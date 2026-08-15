/* ==========================================================================
   AUTHENTICATION UTILITIES (FIREBASE AUTH + FIRESTORE + SUPER ADMIN ROLES)
   ========================================================================== */

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut,
    signInWithPopup,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    getDocument,
    setDocument,
    createDocument,
    deleteDocument,
    updateDocument,
    getCollection,
    serverTimestamp
} from "./firestore.js";

// Firestore collections
export const ADMINS_COLLECTION = "admins";
export const LOGIN_HISTORY_COLLECTION = "loginHistory";

// Pre-authorized master Super Admin emails
export const SUPER_ADMIN_EMAILS = [
    "earthin199@gmail.com",
    "superadmin@thamaraitrust.org"
];

// Pre-authorized general admin emails
export const ADMIN_EMAILS = [
    "earthin199@gmail.com",
    "lotus4helptn@gmail.com",
    "admin@thamaraitrust.org"
];

// Admin master passcodes
export const SUPER_ADMIN_PASSCODES = [
    "superadmin123",
    "7010353437"
];

export const ADMIN_PASSCODES = [
    "admin123",
    "7010353437",
    "superadmin123",
    "thamarai2025"
];

// ========================================
// GOOGLE PROVIDER
// ========================================
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ========================================
// WATCH AUTH STATE
// ========================================
export function watchAuth(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (!user && isSessionAdmin()) {
            const role = sessionStorage.getItem("tct_admin_role") || "superadmin";
            const sessionUser = {
                uid: "admin-session-user",
                email: sessionStorage.getItem("tct_admin_email") || "earthin199@gmail.com",
                displayName: role === "superadmin" ? "Super Administrator" : "Administrator",
                isSessionAdmin: true,
                role: role
            };
            callback(sessionUser);
        } else {
            callback(user);
        }
    });
}

// ========================================
// GOOGLE SIGN-IN
// ========================================
export async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}

export async function signInWithGoogleForVerification() {
    return signInWithGoogle();
}

// ========================================
// LOGOUT
// ========================================
export async function logout() {
    setSessionAdmin(false);
    await signOut(auth);
}

// ========================================
// SESSION ADMIN HELPERS
// ========================================
export function isSessionAdmin() {
    return sessionStorage.getItem("tct_admin_auth") === "true";
}

export function setSessionAdmin(active, email = "earthin199@gmail.com", role = "superadmin") {
    if (active) {
        sessionStorage.setItem("tct_admin_auth", "true");
        sessionStorage.setItem("tct_admin_email", email);
        sessionStorage.setItem("tct_admin_role", role);
    } else {
        sessionStorage.removeItem("tct_admin_auth");
        sessionStorage.removeItem("tct_admin_email");
        sessionStorage.removeItem("tct_admin_role");
    }
}

export async function verifyAdminPasscode(passcode, email = "earthin199@gmail.com") {
    const trimmedPasscode = (passcode || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();

    // Check master super admin passcodes
    if (SUPER_ADMIN_PASSCODES.includes(trimmedPasscode)) {
        setSessionAdmin(true, cleanEmail || "earthin199@gmail.com", "superadmin");
        return { valid: true, role: "superadmin" };
    }

    // Check default general admin passcodes
    if (ADMIN_PASSCODES.includes(trimmedPasscode)) {
        const isSuper = SUPER_ADMIN_EMAILS.includes(cleanEmail);
        setSessionAdmin(true, cleanEmail || "earthin199@gmail.com", isSuper ? "superadmin" : "admin");
        return { valid: true, role: isSuper ? "superadmin" : "admin" };
    }

    // Check custom database admin passcodes
    try {
        const dbAdmins = await getCollection(ADMINS_COLLECTION);
        const matched = dbAdmins.find(
            (a) => a.passcode === trimmedPasscode || (a.email?.toLowerCase() === cleanEmail && a.passcode === trimmedPasscode)
        );

        if (matched) {
            const role = matched.role === "superadmin" ? "superadmin" : "admin";
            setSessionAdmin(true, matched.email || cleanEmail, role);
            return { valid: true, role };
        }
    } catch (e) {
        console.warn("Database admin check error:", e);
    }

    return { valid: false, role: null };
}

// ========================================
// CHECK ADMIN ROLE
// ========================================
export async function isAdmin(uid, userObj = null) {
    if (isSessionAdmin()) {
        return true;
    }

    if (!uid) {
        return false;
    }

    try {
        const currentUser = userObj || auth.currentUser;
        const email = currentUser?.email?.toLowerCase();

        if (email && (ADMIN_EMAILS.includes(email) || SUPER_ADMIN_EMAILS.includes(email) || email.includes("admin"))) {
            return true;
        }

        const adminDoc = await getDocument(ADMINS_COLLECTION, uid);
        if (adminDoc && adminDoc.active !== false) {
            return true;
        }

        // Check if admin is listed by email in collection
        if (email) {
            const dbAdmins = await getCollection(ADMINS_COLLECTION);
            const found = dbAdmins.find((a) => a.email?.toLowerCase() === email && a.active !== false);
            if (found) return true;
        }

        return false;
    } catch (error) {
        console.error("Error checking admin role:", error);
        return false;
    }
}

// ========================================
// CHECK SUPER ADMIN ROLE
// ========================================
export async function isSuperAdmin(uid, userObj = null) {
    if (isSessionAdmin()) {
        const role = sessionStorage.getItem("tct_admin_role");
        const email = sessionStorage.getItem("tct_admin_email")?.toLowerCase();
        if (role === "superadmin" || SUPER_ADMIN_EMAILS.includes(email)) {
            return true;
        }
    }

    try {
        const currentUser = userObj || auth.currentUser;
        const email = currentUser?.email?.toLowerCase();

        if (email && SUPER_ADMIN_EMAILS.includes(email)) {
            return true;
        }

        if (uid) {
            const adminDoc = await getDocument(ADMINS_COLLECTION, uid);
            if (adminDoc && adminDoc.role === "superadmin" && adminDoc.active !== false) {
                return true;
            }
        }

        if (email) {
            const dbAdmins = await getCollection(ADMINS_COLLECTION);
            const found = dbAdmins.find((a) => a.email?.toLowerCase() === email && a.role === "superadmin" && a.active !== false);
            if (found) return true;
        }

        return false;
    } catch (error) {
        console.error("Error checking super admin role:", error);
        return false;
    }
}

// ========================================
// ADMIN MANAGEMENT (SUPER ADMIN ACTIONS)
// ========================================

export async function fetchAllAdmins() {
    try {
        const dbAdmins = await getCollection(ADMINS_COLLECTION);
        // Ensure default super admin is always represented
        const superAdminExists = dbAdmins.some((a) => a.email?.toLowerCase() === "earthin199@gmail.com");
        
        let all = [...dbAdmins];
        if (!superAdminExists) {
            all.unshift({
                id: "default-super-admin",
                name: "Primary Super Administrator",
                email: "earthin199@gmail.com",
                role: "superadmin",
                passcode: "superadmin123",
                phone: "+91 9876543210",
                active: true,
                isPrimary: true,
                createdAt: new Date()
            });
        }
        return all;
    } catch (err) {
        console.error("Error fetching admins:", err);
        return [];
    }
}

export async function createAdminAccount(adminData) {
    const docId = `admin_${Date.now()}`;
    const payload = {
        name: adminData.name || "Administrator",
        email: adminData.email.toLowerCase().trim(),
        role: adminData.role || "admin", // "admin" or "superadmin"
        passcode: adminData.passcode || "admin123",
        phone: adminData.phone || "",
        active: true,
        createdAt: serverTimestamp()
    };

    await setDocument(ADMINS_COLLECTION, docId, payload);
    return { id: docId, ...payload };
}

export async function removeAdminAccount(adminId) {
    if (adminId === "default-super-admin") {
        throw new Error("The Primary Super Administrator account cannot be removed.");
    }
    await deleteDocument(ADMINS_COLLECTION, adminId);
}

export async function toggleAdminStatus(adminId, newStatus) {
    if (adminId === "default-super-admin") {
        throw new Error("Primary Super Administrator status cannot be changed.");
    }
    await updateDocument(ADMINS_COLLECTION, adminId, {
        active: newStatus,
        updatedAt: serverTimestamp()
    });
}

// ========================================
// RECORD LOGIN HISTORY
// ========================================
export async function recordLogin(user) {
    if (!user) return;

    try {
        await createDocument(LOGIN_HISTORY_COLLECTION, {
            uid: user.uid || "session-admin",
            email: user.email || "earthin199@gmail.com",
            device: navigator.userAgent.substring(0, 100),
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error recording login history:", error);
    }
}
