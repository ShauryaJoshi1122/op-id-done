// ========================================
// FIREBASE CONFIGURATION
// ========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import {
    getAuth
}
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    getFirestore
}
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    getStorage
}
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

import {
    initializeAppCheck,
    ReCaptchaV3Provider
}
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-check.js";

// ========================================
// FIREBASE CONFIG
// ========================================

let firebaseConfig = {
    apiKey: "AIzaSyAMbphDWdviu-i9Aszy8mQnLyDFkma1IFw",
    authDomain: "upheld-renderer-96pck.firebaseapp.com",
    projectId: "upheld-renderer-96pck",
    storageBucket: "upheld-renderer-96pck.firebasestorage.app",
    messagingSenderId: "258816415496",
    appId: "1:258816415496:web:6409828c4a7c7364defebd",
    firestoreDatabaseId: "ai-studio-id-045c9baa-59ce-48c1-a3c5-2462853abdf1"
};

try {
    const res = await fetch("/firebase-applet-config.json");
    if (res.ok) {
        const json = await res.json();
        if (json.apiKey) {
            firebaseConfig = { ...firebaseConfig, ...json };
        }
    }
} catch (e) {
    console.warn("Could not load dynamic firebase-applet-config.json:", e);
}

// ========================================
// INITIALIZE FIREBASE
// ========================================

const app = initializeApp(firebaseConfig);

// ========================================
// APP CHECK INITIALIZATION (SAFEGUARDED)
// ========================================

let appCheck = null;

try {
    if (typeof window !== "undefined") {
        // Set debug token for dev, preview iframe, and container environments
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

        const isLocalOrPreview =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.hostname.includes("run.app") ||
            window.location.hostname.includes("google.com") ||
            window.location.hostname.includes("ais-") ||
            window.location.hostname.includes("webcontainer") ||
            window.location.hostname.includes("preview");

        if (!isLocalOrPreview) {
            appCheck = initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider("6Ld18ywtAAAAAEuQNLyxjbaVKPV6AP3K7rtxfL3j"),
                isTokenAutoRefreshEnabled: true
            });
        }
    }
} catch (e) {
    console.warn("App Check initialization skipped/safe:", e);
}

// ========================================
// SERVICES
// ========================================

const auth = getAuth(app);

const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)")
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

const storage = getStorage(app);

// ========================================
// EXPORTS
// ========================================

export {
    app,
    auth,
    db,
    storage,
    appCheck
};
