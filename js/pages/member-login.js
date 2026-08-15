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

    getDocument

}
    from "../firebase/firestore.js";

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
// GOOGLE SIGN-IN HANDLER
// ========================================

if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", handleGoogleLogin);
}

async function handleGoogleLogin() {

    if (googleSignInBtn) {
        googleSignInBtn.disabled = true;
        googleSignInBtn.textContent = "Signing in...";
    }

    try {
        hideError();

        const user = await signInWithGoogle();

        // Auth state watcher will handle routing based on membership status
        await recordLogin(user);

    }
    catch (error) {

        console.error(error);

        // User cancelled the popup — silently ignore
        if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
            return;
        }

        showErrorMessage(
            error.message ||
            "Unable to sign in with Google. Please try again."
        );

    }
    finally {
        if (googleSignInBtn) {
            googleSignInBtn.disabled = false;
            googleSignInBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" style="vertical-align:middle;margin-right:10px;">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Sign in with Google
            `;
        }
    }
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
