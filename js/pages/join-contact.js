// ========================================
// IMPORTS
// ========================================

import {

    signInWithGoogleForVerification

}
    from "../firebase/auth.js";

import { sendAdminNotification } from "../utils/email.js";

import {

    setDocument,

    createDocument,

    serverTimestamp,

    generateProblemNumber

}
    from "../firebase/firestore.js";

import {

    uploadMemberPhoto,

    uploadGovernmentProof

}
    from "../firebase/storage.js";

import {

    MEMBER_STATUS,

    COLLECTIONS

}
    from "../utils/constants.js";

import {

    validateRequiredFields,

    isValidEmail,

    isValidMobile,

    validateMemberPhoto,

    validateGovernmentProof,

    isAdult

}
    from "../utils/validators.js";

import {

    showSuccess,

    showError

}
    from "../utils/toast.js";

// ========================================
// ELEMENTS
// ========================================

const membershipForm =
    document.getElementById(
        "membershipForm"
    );

const problemReportForm =
    document.getElementById(
        "problemReportForm"
    );

const feedbackForm =
    document.getElementById(
        "feedbackForm"
    );

// ========================================
// INIT
// ========================================

if (
    membershipForm
) {
    membershipForm.addEventListener(

        "submit",

        handleMembershipSubmit

    );

    // ====================================
    // REAL-TIME FILE VALIDATION
    // ====================================

    const photoInput = document.getElementById("photoInput");
    const photoError = document.getElementById("photoError");
    const govProofInput = document.getElementById("govProofInput");
    const govProofError = document.getElementById("govProofError");

    const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const MAX_PHOTO_MB = 5 * 1024 * 1024;
    const MAX_PROOF_MB = 10 * 1024 * 1024;

    if (photoInput && photoError) {
        photoInput.addEventListener("change", () => {
            const file = photoInput.files[0];
            photoError.style.display = "none";
            photoError.textContent = "";

            if (!file) return;

            if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
                photoError.textContent = "❌ Invalid file type. Please upload a JPG, PNG, or WEBP image.";
                photoError.style.display = "block";
                photoInput.value = "";
                return;
            }

            if (file.size > MAX_PHOTO_MB) {
                photoError.textContent = `❌ Photo is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed size is 5 MB.`;
                photoError.style.display = "block";
                photoInput.value = "";
                return;
            }

            photoError.textContent = "✅ Photo selected successfully.";
            photoError.style.display = "block";
            photoError.style.color = "#16a34a";
        });
    }

    if (govProofInput && govProofError) {
        govProofInput.addEventListener("change", () => {
            const file = govProofInput.files[0];
            govProofError.style.display = "none";
            govProofError.textContent = "";

            if (!file) return;

            if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
                govProofError.textContent = "❌ Invalid file type. Only JPG, PNG, or PDF files are accepted.";
                govProofError.style.display = "block";
                govProofInput.value = "";
                return;
            }

            if (file.size > MAX_PROOF_MB) {
                govProofError.textContent = `❌ Document is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed size is 10 MB.`;
                govProofError.style.display = "block";
                govProofInput.value = "";
                return;
            }

            govProofError.textContent = "✅ Document selected successfully.";
            govProofError.style.display = "block";
            govProofError.style.color = "#16a34a";
        });
    }

    // ====================================
    // EMAIL VALIDATION
    // ====================================

    const memberEmailInput = document.getElementById("memberEmailInput");
    const membershipSubmitBtn = document.getElementById("membershipSubmitBtn");

    if (memberEmailInput) {
        const validateEmailInput = () => {
            const val = memberEmailInput.value.trim();
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
            if (membershipSubmitBtn) {
                membershipSubmitBtn.disabled = !isValid;
                if (isValid) {
                    membershipSubmitBtn.classList.add("btn-enabled");
                } else {
                    membershipSubmitBtn.classList.remove("btn-enabled");
                }
            }
        };

        memberEmailInput.addEventListener("input", validateEmailInput);
        memberEmailInput.addEventListener("change", validateEmailInput);
        validateEmailInput();
    }
}


if (
    problemReportForm
) {
    problemReportForm.addEventListener(

        "submit",

        async event => {

            event.preventDefault();

            try {

                const formData =
                    new FormData(
                        problemReportForm
                    );

                if (
                    !formData.get("reporterName") ||
                    !formData.get("reporterMobile") ||
                    !formData.get("problemDescription")
                ) {
                    throw new Error(
                        "அனைத்து கட்டாய விவரங்களையும் நிரப்பவும்"
                    );
                }

                const problemNumber = generateProblemNumber();

                await createDocument(

                    COLLECTIONS.GRIEVANCES,

                    {

                        problemNumber,

                        reporterName:
                            formData.get("reporterName")?.trim(),

                        reporterMobile:
                            formData.get("reporterMobile")?.trim(),

                        problemLocation:
                            formData.get("problemLocation")?.trim(),

                        problemCategory:
                            formData.get("problemCategory"),

                        problemDescription:
                            formData.get("problemDescription")?.trim(),

                        status:
                            "pending"

                    }

                );

                // Send email to admin
                try {
                    await sendAdminNotification({
                        subject: `புதிய பொதுமக்கள் புகார் | New Grievance: ${formData.get("reporterName")?.trim()} (${problemNumber})`,
                        html: `
                            <h3>புதிய பொதுமக்கள் புகார் பதிவு செய்யப்பட்டுள்ளது</h3>
                            <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%; max-width: 600px;">
                                <tr><td><strong>டிராக்கிங் எண் (Tracking No):</strong></td><td>${problemNumber}</td></tr>
                                <tr><td><strong>பெயர் (Reporter Name):</strong></td><td>${formData.get("reporterName")?.trim()}</td></tr>
                                <tr><td><strong>மொபைல் (Reporter Mobile):</strong></td><td>${formData.get("reporterMobile")?.trim()}</td></tr>
                                <tr><td><strong>மாவட்டம்/வட்டம் (Location):</strong></td><td>${formData.get("problemLocation")?.trim() || "-"}</td></tr>
                                <tr><td><strong>வகை (Category):</strong></td><td>${formData.get("problemCategory")}</td></tr>
                                <tr><td><strong>விவரம் (Description):</strong></td><td>${formData.get("problemDescription")?.trim()}</td></tr>
                            </table>
                        `
                    });
                } catch (emailError) {
                    console.error("Could not send admin grievance notification email:", emailError);
                }

                showSuccess(

                    `உங்கள் பிரச்சினை வெற்றிகரமாக பதிவு செய்யப்பட்டது. டிராக்கிங் எண்: ${problemNumber}`

                );


                problemReportForm.reset();

            }
            catch (error) {

                console.error(error);

                showError(

                    "பிரச்சினையை பதிவு செய்ய முடியவில்லை"

                );

            }

        }

    );
}

if (
    feedbackForm
) {
    feedbackForm.addEventListener(

        "submit",

        async event => {

            event.preventDefault();

            try {

                const formData =
                    new FormData(
                        feedbackForm
                    );

                const feedbackName =
                    formData.get("feedbackName")?.trim();

                const feedbackMessage =
                    formData.get("feedbackMessage")?.trim();

                if (!feedbackName || !feedbackMessage) {
                    throw new Error("பெயர் மற்றும் கருத்து இரண்டும் கட்டாயம்");
                }

                await createDocument(

                    COLLECTIONS.CONTACT_MESSAGES,

                    {

                        feedbackName,

                        feedbackMobile:
                            formData.get("feedbackMobile")?.trim(),

                        feedbackEmail:
                            formData.get("feedbackEmail")?.trim(),

                        feedbackType:
                            formData.get("feedbackType"),

                        feedbackMessage,

                        createdAt: new Date()

                    }

                );

                showSuccess(

                    "உங்கள் கருத்து வெற்றிகரமாக பதிவு செய்யப்பட்டது"

                );

                feedbackForm.reset();

            }
            catch (error) {

                console.error(error);

                showError(

                    error.message || "கருத்தை பதிவு செய்ய முடியவில்லை"

                );

            }

        }

    );
}

// ========================================
// SUBMIT
// ========================================

async function handleMembershipSubmit(
    event
) {
    event.preventDefault();

    const submitBtn = membershipForm?.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.textContent || 'Submit Application';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    try {

        // ====================================
        // EMAIL VALIDATION CHECK
        // ====================================
        const rawEmail = memberEmailInput?.value?.trim();
        if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
            showError("Please enter a valid email address before submitting your application.");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
            return;
        }
        const emailToUse = rawEmail;

        const formData =

            new FormData(
                membershipForm
            );


        const fullName =
            formData.get(
                "fullName"
            )?.trim();

        const fatherName =
            formData.get(
                "fatherName"
            )?.trim();

        const mobile =
            formData.get(
                "mobile"
            )?.trim();

        const email =
            formData.get(
                "email"
            )?.trim();


        const address =
            formData.get(
                "address"
            )?.trim();

        const dob =
            formData.get(
                "dob"
            );

        const occupation =
            formData.get(
                "occupation"
            )?.trim();

        const gender =
            formData.get(
                "gender"
            );

        const bloodGroup =
            formData.get(
                "bloodGroup"
            );

        const memberType =
            formData.get(
                "membertype"
            );

        const photo =

            formData.get(
                "photo"
            );

        const governmentProof =

            formData.get(
                "governmentProof"
            );

        // ====================================
        // VALIDATIONS
        // ====================================

        const valid =

            validateRequiredFields([

                fullName,

                fatherName,

                mobile,

                email,

                address,

                dob,

                occupation,

                gender,

                photo,

                governmentProof,

                bloodGroup,

                memberType

            ]);

        if (
            !valid
        ) {
            throw new Error(
                "Please fill in all required fields."
            );
        }

        if (
            !isValidEmail(
                email
            )
        ) {
            throw new Error(
                "Please enter a valid email address."
            );
        }

        if (
            !isValidMobile(
                mobile
            )
        ) {
            throw new Error(
                "Please enter a valid 10-digit mobile number."
            );
        }


        if (
            !isAdult(
                dob
            )
        ) {
            throw new Error(

                "Applicant must be at least 18 years of age."

            );
        }

        if (
            !validateMemberPhoto(
                photo
            )
        ) {
            throw new Error(

                "Please upload a valid member photo (JPG/PNG/WEBP under 5MB)."

            );
        }

        if (
            !validateGovernmentProof(
                governmentProof
            )
        ) {
            throw new Error(

                "Please upload a valid government ID document (PDF/JPG/PNG under 10MB)."

            );
        }

        // ====================================
        // UNIQUE MEMBER IDENTIFIER
        // ====================================

        const memberUid = "mem_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

        // ====================================
        // FILE UPLOADS
        // ====================================

        try {

            // ====================================
            // PARALLEL FAST FILE UPLOADS
            // ====================================

            const [photoUrl, governmentProofPath] = await Promise.all([
                uploadMemberPhoto(memberUid, photo),
                uploadGovernmentProof(memberUid, governmentProof)
            ]);

            // ====================================
            // MEMBER RECORD
            // ====================================

            await setDocument(
                COLLECTIONS.MEMBERS,
                memberUid,
                {
                    uid: memberUid,
                    fullName,
                    fatherName,
                    mobile,
                    email,
                    address,
                    dob,
                    occupation,
                    gender,
                    bloodGroup,
                    memberType,
                    photoUrl,
                    governmentProofPath,
                    governmentProofDeleted: false,
                    memberNumber: null,
                    status: MEMBER_STATUS.PENDING,
                    createdAt: serverTimestamp(),
                    approvedAt: null,
                    rejectedAt: null
                }
            );

            // Background admin email notification (non-blocking)
            sendAdminNotification({
                subject: `New Member Application: ${fullName}`,
                html: `
                    <h3>New Membership Application Submitted</h3>
                    <p>Applicant details:</p>
                    <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%; max-width: 600px;">
                        <tr><td><strong>Full Name:</strong></td><td>${fullName}</td></tr>
                        <tr><td><strong>Father's Name:</strong></td><td>${fatherName}</td></tr>
                        <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
                        <tr><td><strong>Mobile:</strong></td><td>${mobile}</td></tr>
                        <tr><td><strong>DOB:</strong></td><td>${dob}</td></tr>
                        <tr><td><strong>Gender:</strong></td><td>${gender}</td></tr>
                        <tr><td><strong>Blood Group:</strong></td><td>${bloodGroup}</td></tr>
                        <tr><td><strong>Occupation:</strong></td><td>${occupation}</td></tr>
                        <tr><td><strong>Address:</strong></td><td>${address}</td></tr>
                        <tr><td><strong>Member Category:</strong></td><td>${memberType === "member" ? "Regular Member" : "Active Member"}</td></tr>
                        <tr><td><strong>Reason to Join:</strong></td><td>${whyJoin}</td></tr>
                    </table>
                    <p>Visit the Admin Portal to review and approve this application.</p>
                `
            }).catch(emailErr => console.warn("Admin notification email sent in background encountered error:", emailErr));

            showSuccess(

                "Application submitted successfully! Please wait for administrator verification."

            );

            membershipForm.reset();


        }
        catch (error) {

            console.error("Error in file uploads or Firestore process:", error);

            throw error;

        }

    }

    catch (error) {

        console.error(error);

        showError(

            error.message ||

            "Failed to submit application. Please try again."

        );

    }
    finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }

}
