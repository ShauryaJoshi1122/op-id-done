// ========================================
// IMPORTS
// ========================================

import {
    logout,
    watchAuth,
    recordLogin,
    isAdmin,
    signInWithGoogle,
    verifyAdminPasscode,
    isSessionAdmin
} from "../firebase/auth.js";

import {
    showSuccess,
    showError
} from "../utils/toast.js";

// ========================================
// ELEMENTS
// ========================================

const adminPasscodeForm = document.getElementById("adminPasscodeForm");
const adminEmailInput = document.getElementById("adminEmailInput");
const adminPasscodeInput = document.getElementById("adminPasscodeInput");
const adminPasscodeBtn = document.getElementById("adminPasscodeBtn");

const loginInfo = document.getElementById("loginInfo");
const loginError = document.getElementById("loginError");
const loginLoading = document.getElementById("loginLoading");
const adminLoginBtn = document.getElementById("adminLoginBtn");

// ========================================
// AUTH CHECK
// ========================================

watchAuth(async (user) => {
    try {
        if (!user && !isSessionAdmin()) {
            return;
        }

        const admin = await isAdmin(user?.uid, user);
        if (admin && !window.location.pathname.includes("admin-dashboard.html")) {
            location.href = "admin-dashboard.html";
        }
    } catch (error) {
        console.error("Auth check error:", error);
    }
});

// ========================================
// PASSCODE LOGIN HANDLER
// ========================================

if (adminPasscodeForm) {
    adminPasscodeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();

        const email = adminEmailInput ? adminEmailInput.value.trim() : "earthin199@gmail.com";
        const passcode = adminPasscodeInput ? adminPasscodeInput.value.trim() : "";

        if (!passcode) {
            showErrorMessage("Please enter the Admin Passcode.");
            return;
        }

        if (loginLoading) loginLoading.style.display = "block";
        if (adminPasscodeBtn) adminPasscodeBtn.disabled = true;

        try {
            const authResult = await verifyAdminPasscode(passcode, email);
            if (authResult.valid) {
                await recordLogin({ uid: "admin-session", email });
                const roleTitle = authResult.role === "superadmin" ? "Super Administrator" : "Administrator";
                showSuccess(`${roleTitle} authenticated successfully!`);
                setTimeout(() => {
                    location.href = "admin-dashboard.html";
                }, 500);
            } else {
                showErrorMessage("Invalid Passcode. Please check your credentials and try again.");
            }
        } catch (err) {
            console.error("Passcode auth error:", err);
            showErrorMessage("Authentication failed. Please try again.");
        } finally {
            if (loginLoading) loginLoading.style.display = "none";
            if (adminPasscodeBtn) adminPasscodeBtn.disabled = false;
        }
    });
}

// ========================================
// GOOGLE SIGN-IN HANDLER
// ========================================

if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", handleAdminGoogleLogin);
}

async function handleAdminGoogleLogin() {
    if (loginLoading) loginLoading.style.display = "block";
    if (adminLoginBtn) adminLoginBtn.disabled = true;

    try {
        hideError();

        const user = await signInWithGoogle();
        const admin = await isAdmin(user.uid, user);

        if (!admin) {
            await logout();
            throw new Error(`The account ${user.email} is not registered as an authorized admin.`);
        }

        await recordLogin(user);
        showSuccess("Admin signed in successfully!");

        setTimeout(() => {
            location.href = "admin-dashboard.html";
        }, 600);
    } catch (error) {
        console.error(error);
        if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
            if (loginLoading) loginLoading.style.display = "none";
            if (adminLoginBtn) adminLoginBtn.disabled = false;
            return;
        }

        showErrorMessage(error.message || "Google Sign-in failed.");
    } finally {
        if (adminLoginBtn) adminLoginBtn.disabled = false;
        if (loginLoading) loginLoading.style.display = "none";
    }
}

// ========================================
// MESSAGES
// ========================================

function showErrorMessage(message) {
    if (!loginError) return;
    if (loginInfo) loginInfo.style.display = "none";
    loginError.style.display = "block";
    loginError.textContent = message;
}

function hideError() {
    if (loginError) {
        loginError.style.display = "none";
        loginError.textContent = "";
    }
    if (loginInfo) {
        loginInfo.style.display = "none";
        loginInfo.textContent = "";
    }
}
