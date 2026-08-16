// ========================================
// IMPORTS
// ========================================

import {

    logout,

    watchAuth,

    recordLogin,

    signInWithGoogle

}
    from "../firebase/auth.js";

import {
    getDocument,
    getCollection
} from "../firebase/firestore.js";

import {

    MEMBER_STATUS,

    COLLECTIONS

}
    from "../utils/constants.js";

import {

    showSuccess

}
    from "../utils/toast.js";

// ========================================
// ELEMENTS
// ========================================

const memberLoginForm =
    document.getElementById(
        "memberLoginForm"
    );

const loginInfo =
    document.getElementById(
        "loginInfo"
    );

const loginError =
    document.getElementById(
        "loginError"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const logoutNavLi =
    document.getElementById(
        "logoutNavLi"
    );

const googleSignInBtn =
    document.getElementById(
        "memberGoogleSignInBtn"
    );

// ========================================
// AUTH CHECK
// ========================================

watchAuth(

    async user => {

        try {

            if (!user) {
                if (logoutNavLi) logoutNavLi.style.display = "none";
                const loginContainer = document.querySelector(".login-container");
                if (loginContainer) loginContainer.style.display = "block";
                const pendingSection = document.getElementById("pendingSection");
                if (pendingSection) pendingSection.style.display = "none";
                const rejectedSection = document.getElementById("rejectedSection");
                if (rejectedSection) rejectedSection.style.display = "none";
                return;
            }

            if (logoutNavLi) logoutNavLi.style.display = "block";

            const member =

                await getDocument(

                    COLLECTIONS.MEMBERS,

                    user.uid

                );

            if (!member) {
                // Signed in with Google but not a registered member
                await logout();
                showErrorMessage("This Google account is not registered as a member. Please register first.");
                return;
            }

            if (
                member.status ===
                MEMBER_STATUS.PENDING
            ) {
                const loginContainer = document.querySelector(".login-container");
                if (loginContainer) loginContainer.style.display = "none";
                const pendingSection = document.getElementById("pendingSection");
                if (pendingSection) pendingSection.style.display = "block";
                return;
            }

            if (
                member.status ===
                MEMBER_STATUS.REJECTED
            ) {
                const loginContainer = document.querySelector(".login-container");
                if (loginContainer) loginContainer.style.display = "none";
                const rejectedSection = document.getElementById("rejectedSection");
                if (rejectedSection) rejectedSection.style.display = "block";
                return;
            }

            if (
                member.status ===
                MEMBER_STATUS.APPROVED
            ) {
                if (
                    !window.location.pathname.includes(
                        "id-card-template.html"
                    )
                ) {
                    location.href =
                        "id-card-template.html";
                }
            }

        }
        catch (error) {

            console.error(
                error
            );

        }

    }

);

// ========================================
// DIRECT MEMBER ID & DoB LOGIN
// ========================================

const memberDirectLoginForm = document.getElementById("memberDirectLoginForm");
const memberEmailOrIdInput = document.getElementById("memberEmailOrIdInput");
const memberDobInput = document.getElementById("memberDobInput");
const memberDirectSubmitBtn = document.getElementById("memberDirectSubmitBtn");
const authenticatedMemberHub = document.getElementById("authenticatedMemberHub");
const authMemberName = document.getElementById("authMemberName");
const authMemberId = document.getElementById("authMemberId");
const btnAuthGoIdCard = document.getElementById("btnAuthGoIdCard");
const btnAuthGoLetter = document.getElementById("btnAuthGoLetter");

/**
 * Standardize and compare Date of Birth strings across all common formats
 */
function normalizeDate(d) {
    if (!d) return "";
    const s = String(d).trim();
    // YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
        const [yyyy, mm, dd] = s.split("-");
        return `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${yyyy}`;
    }
    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(s)) {
        const [d1, m1, y1] = s.split(/[\/\-\.]/);
        return `${String(d1).padStart(2, "0")}/${String(m1).padStart(2, "0")}/${y1}`;
    }
    // Date instance or parseable timestamp
    try {
        const dt = new Date(s);
        if (!isNaN(dt.getTime())) {
            const dd = String(dt.getDate()).padStart(2, "0");
            const mm = String(dt.getMonth() + 1).padStart(2, "0");
            const yyyy = dt.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        }
    } catch (_) {}
    return s.replace(/\D/g, "");
}

function matchBirthDate(storedDob, inputDob) {
    if (!storedDob || !inputDob) return false;
    const n1 = normalizeDate(storedDob);
    const n2 = normalizeDate(inputDob);
    if (n1 && n2 && n1 === n2) return true;

    // Compare digits only (e.g. 31101990 vs 19901031)
    const digits1 = String(storedDob).replace(/\D/g, "");
    const digits2 = String(inputDob).replace(/\D/g, "");
    if (digits1 === digits2 && digits1.length >= 6) return true;

    // Check swapped YYYYMMDD vs DDMMYYYY
    if (digits1.length === 8 && digits2.length === 8) {
        const d1_iso = (digits1.startsWith("19") || digits1.startsWith("20")) ? digits1 : digits1.slice(4, 8) + digits1.slice(2, 4) + digits1.slice(0, 2);
        const d2_iso = (digits2.startsWith("19") || digits2.startsWith("20")) ? digits2 : digits2.slice(4, 8) + digits2.slice(2, 4) + digits2.slice(0, 2);
        if (d1_iso === d2_iso) return true;
    }
    return false;
}

if (memberDirectLoginForm) {
    memberDirectLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();

        const idQuery = (memberEmailOrIdInput?.value || "").trim().toLowerCase();
        const dobVal = (memberDobInput?.value || "").trim();

        if (!idQuery) {
            showErrorMessage("Please enter your Member ID or registered email address.");
            memberEmailOrIdInput?.focus();
            return;
        }

        if (!dobVal) {
            showErrorMessage("Please enter your Date of Birth (DoB) as registered.");
            memberDobInput?.focus();
            return;
        }

        if (memberDirectSubmitBtn) {
            memberDirectSubmitBtn.disabled = true;
            memberDirectSubmitBtn.innerHTML = `<span>⏳</span> Verifying Member Credentials...`;
        }

        try {
            const allMembers = await getCollection(COLLECTIONS.MEMBERS);
            
            // 1. Locate member by ID, email, memberNumber, or phone
            const found = allMembers.find((m) => {
                const matchId = (m.id || "").toLowerCase() === idQuery;
                const matchMemberNo = (m.memberNumber || "").toLowerCase() === idQuery;
                const matchEmail = (m.email || "").toLowerCase() === idQuery;
                const matchPhone = (m.mobile || m.phone || "").replace(/\D/g, "") === idQuery.replace(/\D/g, "");
                return matchId || matchMemberNo || matchEmail || (idQuery.length >= 7 && matchPhone);
            });

            if (!found) {
                showErrorMessage(`No registered member found with ID "${idQuery}". Please verify your Member ID or apply for membership.`);
                return;
            }

            // 2. Verify Date of Birth (DoB)
            const storedDob = found.dob || found.dateOfBirth;
            if (storedDob && !matchBirthDate(storedDob, dobVal)) {
                showErrorMessage(`❌ Date of Birth does not match our official records for Member ID "${found.memberNumber || idQuery}". Please verify your registered birth date.`);
                return;
            }

            // 3. Check Application Status
            if (found.status === MEMBER_STATUS.PENDING) {
                const loginContainer = document.querySelector(".login-container");
                if (loginContainer) loginContainer.style.display = "none";
                const pendingSection = document.getElementById("pendingSection");
                if (pendingSection) pendingSection.style.display = "block";
                return;
            }

            if (found.status === MEMBER_STATUS.REJECTED) {
                const loginContainer = document.querySelector(".login-container");
                if (loginContainer) loginContainer.style.display = "none";
                const rejectedSection = document.getElementById("rejectedSection");
                if (rejectedSection) rejectedSection.style.display = "block";
                return;
            }

            // 4. Approved Member - Store Verified Session
            const targetMemberId = found.id || found.memberId || found.memberNumber;
            sessionStorage.setItem("svpp_authenticated_member_id", targetMemberId);
            sessionStorage.setItem("svpp_authenticated_member", JSON.stringify(found));
            sessionStorage.setItem("tct_member_id", targetMemberId);
            sessionStorage.setItem("tct_member_email", found.email || "");
            localStorage.setItem("svpp_auth_member_id", targetMemberId);

            showSuccess(`✅ Identity Verified: Welcome, ${found.fullName || "Member"}!`);

            // Update UI with action hub
            if (authenticatedMemberHub && authMemberName && authMemberId) {
                authMemberName.textContent = `✅ ${found.fullName || "Approved Member"}`;
                authMemberId.textContent = `Member ID: ${found.memberNumber || targetMemberId} | Designation: ${found.designation || "Executive Member"}`;
                if (btnAuthGoIdCard) btnAuthGoIdCard.href = `id-card-template.html?memberId=${targetMemberId}`;
                if (btnAuthGoLetter) btnAuthGoLetter.href = `appointment-letter-template.html?memberId=${targetMemberId}`;
                authenticatedMemberHub.style.display = "block";
            }

            // Smooth redirect to ID card download
            setTimeout(() => {
                location.href = `id-card-template.html?memberId=${targetMemberId}`;
            }, 800);

        } catch (err) {
            console.error("Direct member login error:", err);
            showErrorMessage("An error occurred while verifying member credentials. Please try again.");
        } finally {
            if (memberDirectSubmitBtn) {
                memberDirectSubmitBtn.disabled = false;
                memberDirectSubmitBtn.textContent = "🔐 Log In & Access Documents →";
            }
        }
    });
}

// ========================================
// ERROR
// ========================================

function showErrorMessage(
    message
) {
    if (
        !loginError
    ) {
        return;
    }

    if (loginInfo) {
        loginInfo.style.display = "none";
    }

    loginError.style.display =
        "block";

    loginError.textContent =
        message;
}

function showInfoMessage(
    message
) {
    if (
        !loginInfo
    ) {
        return;
    }

    if (loginError) {
        loginError.style.display = "none";
    }

    loginInfo.style.display =
        "block";

    loginInfo.textContent =
        message;
}

function hideError() {
    if (
        loginError
    ) {
        loginError.style.display =
            "none";

        loginError.textContent =
            "";
    }
    if (
        loginInfo
    ) {
        loginInfo.style.display =
            "none";

        loginInfo.textContent =
            "";
    }
}

// ========================================
// LOGOUT
// ========================================

if (
    logoutBtn
) {

    logoutBtn.addEventListener(

        "click",

        async () => {

            try {

                await logout();

                location.href =
                    "member-login.html";

            }
            catch (error) {

                console.error(
                    error
                );

            }

        }

    );

}
