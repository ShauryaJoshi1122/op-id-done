// ========================================
// SUPABASE CONFIGURATION & HELPER MODULE
// ========================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const supabaseUrl = "https://tqkwavgtqphognjgawmc.supabase.co"; 
export const supabaseAnonKey = "sb_publishable_rKJYyV-wpVR_Y8a96JUn_g_3sxvN-Em"; 
export const supabaseSecretKey = "sb_secret_yXXw1Azq8IApuDD0O-asVw_QfT-mQT_"; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const BUCKET_NAME = "thamarai-assets";

// ========================================
// SUPABASE STORAGE HELPERS
// ========================================

/**
 * Upload a file to Supabase Storage bucket
 * @param {string} filePath - Path inside bucket (e.g. "memberPhotos/123.jpg")
 * @param {File|Blob} file - File object
 * @returns {Promise<string|null>} Public URL of uploaded file or null
 */
export async function uploadToSupabase(filePath, file) {
    if (!file) return null;
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: true
            });

        if (error) {
            console.warn("[Supabase Storage] Upload error:", error.message);
            return null;
        }

        const { data: publicData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return publicData?.publicUrl || null;
    } catch (err) {
        console.error("[Supabase Storage] Exception during upload:", err);
        return null;
    }
}

/**
 * Get public URL for a file in Supabase Storage
 */
export function getSupabasePublicUrl(filePath) {
    if (!filePath) return null;
    if (filePath.startsWith("http") || filePath.startsWith("data:")) return filePath;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data?.publicUrl || filePath;
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromSupabase(filePath) {
    if (!filePath || filePath.startsWith("data:") || filePath.startsWith("http")) return;
    try {
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    } catch (err) {
        console.warn("[Supabase Storage] Error deleting file:", err);
    }
}

// ========================================
// SUPABASE DATABASE HELPERS
// ========================================

/**
 * Fetch records from a Supabase table
 */
export async function getFromSupabaseTable(tableName, queryBuilder = null) {
    try {
        let req = supabase.from(tableName).select("*");
        if (queryBuilder && typeof queryBuilder === "function") {
            req = queryBuilder(req);
        }
        const { data, error } = await req;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.warn(`[Supabase Database] Fetch ${tableName} error:`, err.message);
        return [];
    }
}

/**
 * Get single record by ID from a Supabase table
 */
export async function getFromSupabaseById(tableName, id) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        return data || null;
    } catch (err) {
        console.warn(`[Supabase Database] Fetch by ID ${tableName}/${id} error:`, err.message);
        return null;
    }
}

/**
 * Insert or Upsert a record into a Supabase table
 */
export async function saveToSupabaseTable(tableName, record) {
    if (!record || !tableName) return null;
    try {
        // Prepare clean record payload with JSON-serializable timestamps
        const payload = { ...record };
        if (payload.createdAt && typeof payload.createdAt === "object" && payload.createdAt.seconds) {
            payload.createdAt = new Date(payload.createdAt.seconds * 1000).toISOString();
        } else if (!payload.createdAt) {
            payload.createdAt = new Date().toISOString();
        }
        payload.updatedAt = new Date().toISOString();

        const { data, error } = await supabase
            .from(tableName)
            .upsert(payload)
            .select();

        if (error) {
            console.warn(`[Supabase Database] Upsert ${tableName} warning:`, error.message);
            return null;
        }
        return data?.[0] || payload;
    } catch (err) {
        console.warn(`[Supabase Database] Error saving to ${tableName}:`, err.message);
        return null;
    }
}

/**
 * Delete a record from a Supabase table
 */
export async function deleteFromSupabaseTable(tableName, id) {
    if (!tableName || !id) return;
    try {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq("id", id);
        if (error) throw error;
    } catch (err) {
        console.warn(`[Supabase Database] Delete ${tableName}/${id} error:`, err.message);
    }
}

/**
 * Realtime subscription to a Supabase table
 */
export function subscribeSupabaseTable(tableName, callback) {
    try {
        const channelName = `public:${tableName}_changes`;
        const channel = supabase
            .channel(channelName)
            .on("postgres_changes", { event: "*", schema: "public", table: tableName }, async () => {
                const freshData = await getFromSupabaseTable(tableName);
                callback(freshData);
            })
            .subscribe();

        // Fetch initial data
        getFromSupabaseTable(tableName).then(data => callback(data));

        return () => {
            supabase.removeChannel(channel);
        };
    } catch (err) {
        console.warn(`[Supabase Realtime] Channel setup error for ${tableName}:`, err);
        return () => {};
    }
}


