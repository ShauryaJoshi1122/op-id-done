// ========================================
// FIREBASE STORAGE INTEGRATION
// ========================================

import { storage } from "./firebase-config.js";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Helper: Convert file to Base64 DataURL fallback
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

// Generic Upload with Firebase & Supabase Fallback
async function uploadToFirebaseStorage(path, file) {
    if (!file) return null;
    try {
        if (storage) {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            if (downloadUrl) return downloadUrl;
        }
    } catch (err) {
        console.warn(`[Firebase Storage] Upload to ${path} failed, attempting Supabase Storage fallback:`, err);
    }

    // Try Supabase Storage
    try {
        const { uploadToSupabase } = await import("../supabase-config.js");
        const supabaseUrl = await uploadToSupabase(path, file);
        if (supabaseUrl) return supabaseUrl;
    } catch (sbErr) {
        console.warn("[Supabase Storage] Fallback upload skipped or error:", sbErr);
    }

    // Local DataURL fallback
    return await fileToDataUrl(file);
}

// ========================================
// UPLOAD MEMBER PHOTO
// ========================================
export async function uploadMemberPhoto(uid, file) {
    const filePath = `memberPhotos/${uid}_${Date.now()}`;
    return await uploadToFirebaseStorage(filePath, file);
}

// ========================================
// UPLOAD GOVERNMENT PROOF
// ========================================
export async function uploadGovernmentProof(uid, file) {
    const extension = file.name ? file.name.split(".").pop() : "png";
    const filePath = `governmentProofs/${uid}_${Date.now()}.${extension}`;
    return await uploadToFirebaseStorage(filePath, file);
}

// ========================================
// GET GOVERNMENT PROOF VIEW URL
// ========================================
export async function getGovernmentProofUrl(proofPath) {
    if (!proofPath) return null;
    if (proofPath.startsWith("http") || proofPath.startsWith("data:")) {
        return proofPath;
    }
    try {
        if (storage) {
            const storageRef = ref(storage, proofPath);
            return await getDownloadURL(storageRef);
        }
    } catch (e) {
        console.warn("Could not retrieve government proof URL:", e);
    }
    return proofPath;
}

// ========================================
// DELETE GOVERNMENT PROOF
// ========================================
export async function deleteGovernmentProof(proofPath) {
    if (!proofPath || proofPath.startsWith("data:")) return;
    try {
        if (storage) {
            const storageRef = ref(storage, proofPath);
            await deleteObject(storageRef);
        }
    } catch (e) {
        console.warn("Error deleting government proof:", e);
    }
}

// ========================================
// UPLOAD EVENT IMAGE
// ========================================
export async function uploadEventImage(eventId, file) {
    const filePath = `events/${eventId}/${Date.now()}_${file.name || "image"}`;
    return await uploadToFirebaseStorage(filePath, file);
}

// ========================================
// UPLOAD GALLERY IMAGE
// ========================================
export async function uploadGalleryImage(file) {
    const filePath = `gallery/${Date.now()}_${file.name || "image"}`;
    return await uploadToFirebaseStorage(filePath, file);
}

// ========================================
// UPLOAD FOUNDER IMAGE
// ========================================
export async function uploadFounderImage(file) {
    const filePath = `founder/${Date.now()}_${file.name || "founder"}`;
    return await uploadToFirebaseStorage(filePath, file);
}

// ========================================
// UPLOAD SIGNATURE
// ========================================
export async function uploadSignature(file) {
    const filePath = `signatures/${Date.now()}_${file.name || "signature"}`;
    return await uploadToFirebaseStorage(filePath, file);
}

// ========================================
// UPLOAD QR CODE
// ========================================
export async function uploadQrCode(file) {
    const filePath = `qrcodes/${Date.now()}_${file.name || "qrcode"}`;
    return await uploadToFirebaseStorage(filePath, file);
}

// ========================================
// DELETE FILE
// ========================================
export async function deleteFile(filePath) {
    if (!filePath || filePath.startsWith("data:")) return;
    try {
        if (storage) {
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
        }
    } catch (e) {
        console.warn("Error deleting file:", e);
    }
}
