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
// DIRECT MEMBER EMAIL / ID LOGIN
// ========================================

const memberDirectLoginForm = document.getElementById("memberDirectLoginForm");
const memberEmailOrIdInput = document.getElementById("memberEmailOrIdInput");
const memberDirectSubmitBtn = document.getElementById("memberDirectSubmitBtn");

if (memberDirectLoginForm) {
    memberDirectLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();

        const query = (memberEmailOrIdInput?.value || "").trim().toLowerCase();
        if (!query) {
            showErrorMessage("Please enter your registered email or Member ID number.");
            return;
        }

        if (memberDirectSubmitBtn) {
            memberDirectSubmitBtn.disabled = true;
            memberDirectSubmitBtn.textContent = "Searching Member Record...";
        }

        try {
            const allMembers = await getCollection(COLLECTIONS.MEMBERS);
            const found = allMembers.find((m) => {
                const matchEmail = m.email?.toLowerCase() === query;
                const matchId = (m.memberId || m.id || "").toLowerCase() === query;
                const matchPhone = (m.phone || "").includes(query);
                return matchEmail || matchId || matchPhone;
            });

            if (!found) {
                showErrorMessage(`No registered member found matching "${query}". Please check your details or apply for membership.`);
                return;
            }

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

            // Approved member -> Store session and redirect
            sessionStorage.setItem("tct_member_id", found.id || found.memberId);
            sessionStorage.setItem("tct_member_email", found.email);
            showSuccess(`Welcome back, ${found.fullName || "Member"}! Loading ID card...`);

            setTimeout(() => {
                location.href = `id-card-template.html?memberId=${found.id || found.memberId}`;
            }, 600);

        } catch (err) {
            console.error("Direct member login error:", err);
            showErrorMessage("An error occurred while verifying member credentials. Please try again.");
        } finally {
            if (memberDirectSubmitBtn) {
                memberDirectSubmitBtn.disabled = false;
                memberDirectSubmitBtn.textContent = "Access Digital ID Card →";
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
