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

// Helper: Convert file to Base64 DataURL fallback with canvas image compression
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }

        // If it's an image, compress & downscale it for fast base64 storage
        if (file.type && file.type.startsWith("image/")) {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const maxDim = 1000;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
                resolve(compressedDataUrl);
            };
            img.onerror = () => {
                // Fallback to standard FileReader if canvas fails
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(file);
            };
            img.src = url;
            return;
        }

        // Non-image files (e.g. PDFs)
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

// Helper: Promise timeout wrapper
function withTimeout(promise, ms = 1000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Storage timeout")), ms);
        promise.then(
            res => { clearTimeout(timer); resolve(res); },
            err => { clearTimeout(timer); reject(err); }
        );
    });
}

// Generic Upload with Firebase & Supabase Fallback
async function uploadToFirebaseStorage(path, file) {
    if (!file) return null;

    // Try Firebase Storage with 1s timeout
    try {
        if (storage) {
            const storageRef = ref(storage, path);
            const uploadPromise = uploadBytes(storageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
            const downloadUrl = await withTimeout(uploadPromise, 1000);
            if (downloadUrl) return downloadUrl;
        }
    } catch (err) {
        console.warn(`[Firebase Storage] Upload to ${path} skipped or timed out:`, err);
    }

    // Try Supabase Storage with 1s timeout
    try {
        const { uploadToSupabase } = await import("../supabase-config.js");
        const supabaseUrl = await withTimeout(uploadToSupabase(path, file), 1000);
        if (supabaseUrl) return supabaseUrl;
    } catch (sbErr) {
        console.warn("[Supabase Storage] Fallback upload skipped or timed out:", sbErr);
    }

    // Fast local compressed DataURL fallback
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
// UPLOAD ID CARD TEMPLATE IMAGE
// ========================================
export async function uploadIdCardTemplateImage(side, file) {
    const filePath = `id-card-templates/${side}_${Date.now()}_${file.name || "template"}`;
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
