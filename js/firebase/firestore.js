// ========================================
// FIRESTORE
// ========================================

import {

    db

}
    from "./firebase-config.js";

import {

    collection,

    doc,

    addDoc,

    setDoc,

    getDoc,

    getDocs,

    updateDoc,

    deleteDoc,

    query,

    where,

    orderBy,

    limit,

    serverTimestamp,

    onSnapshot

}
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ========================================
// COLLECTIONS CONSTANTS
// ========================================
export const COLLECTIONS = {
    ADMINS: "admins",
    MEMBERS: "members",
    APPLICATIONS: "applications",
    SETTINGS: "settings",
    EVENTS: "events",
    EVENT_REGISTRATIONS: "eventRegistrations",
    BLOOD_DONORS: "bloodDonors",
    BLOOD_REQUESTS: "bloodRequests",
    GRIEVANCES: "grievances",
    CONTACT_MESSAGES: "contactMessages",
    AUDIT_LOGS: "auditLogs",
    LOGIN_HISTORY: "loginHistory"
};

import {
    saveToSupabaseTable,
    getFromSupabaseTable,
    getFromSupabaseById,
    deleteFromSupabaseTable,
    subscribeSupabaseTable
} from "../supabase-config.js";

// Helper: Async sync to Supabase Database
async function syncToSupabase(collectionName, record) {
    try {
        await saveToSupabaseTable(collectionName, record);
    } catch (e) {
        console.warn(`[Supabase Sync] Warning syncing ${collectionName}:`, e);
    }
}

// Helper: Async delete from Supabase Database
async function syncDeleteToSupabase(collectionName, id) {
    try {
        await deleteFromSupabaseTable(collectionName, id);
    } catch (e) {
        console.warn(`[Supabase Sync] Warning deleting ${collectionName}/${id}:`, e);
    }
}

// ========================================
// REAL-TIME LISTENERS
// ========================================
export function subscribeCollection(collectionName, callback) {
    try {
        const colRef = collection(db, collectionName);
        return onSnapshot(colRef, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(items);
        }, (error) => {
            console.warn(`[Firestore Realtime] Subscription error for ${collectionName}, falling back to Supabase:`, error);
            subscribeSupabaseTable(collectionName, callback);
        });
    } catch (err) {
        console.warn(`[Realtime] Fallback to Supabase for ${collectionName}`);
        return subscribeSupabaseTable(collectionName, callback);
    }
}

export function subscribeDocument(collectionName, documentId, callback) {
    const docRef = doc(db, collectionName, documentId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    }, async (error) => {
        console.warn(`[Firestore Realtime] Doc subscription error for ${collectionName}/${documentId}, attempting Supabase fetch:`, error);
        const sbDoc = await getFromSupabaseById(collectionName, documentId);
        callback(sbDoc);
    });
}

// ========================================
// CREATE DOCUMENT
// ========================================

export async function createDocument(
    collectionName,
    data
) {
    let docId = null;
    const nowIso = new Date().toISOString();
    const documentData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    try {
        const documentRef = await addDoc(
            collection(db, collectionName),
            documentData
        );
        docId = documentRef.id;
    } catch (fsErr) {
        console.warn(`[Firestore] createDocument failed for ${collectionName}, using generated ID:`, fsErr);
        docId = `sb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // Dual-sync record to Supabase
    const supabaseRecord = {
        id: docId,
        ...data,
        createdAt: nowIso,
        updatedAt: nowIso
    };
    syncToSupabase(collectionName, supabaseRecord);

    return docId;
}

// ========================================
// SET DOCUMENT
// ========================================

export async function setDocument(
    collectionName,
    documentId,
    data
) {
    const nowIso = new Date().toISOString();
    try {
        await setDoc(
            doc(db, collectionName, documentId),
            {
                ...data,
                updatedAt: serverTimestamp()
            }
        );
    } catch (fsErr) {
        console.warn(`[Firestore] setDocument failed for ${collectionName}/${documentId}:`, fsErr);
    }

    // Dual-sync to Supabase
    const supabaseRecord = {
        id: documentId,
        ...data,
        updatedAt: nowIso
    };
    syncToSupabase(collectionName, supabaseRecord);
}

// ========================================
// GET DOCUMENT
// ========================================

export async function getDocument(
    collectionName,
    documentId
) {
    try {
        const documentRef = doc(db, collectionName, documentId);
        const snapshot = await getDoc(documentRef);
        if (snapshot.exists()) {
            return {
                id: snapshot.id,
                ...snapshot.data()
            };
        }
    } catch (fsErr) {
        console.warn(`[Firestore] getDocument failed for ${collectionName}/${documentId}, attempting Supabase fallback:`, fsErr);
    }

    // Supabase fallback
    return await getFromSupabaseById(collectionName, documentId);
}

// ========================================
// GET COLLECTION
// ========================================

export async function getCollection(
    collectionName
) {
    try {
        const snapshot = await getDocs(
            collection(db, collectionName)
        );
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
    } catch (fsErr) {
        console.warn(`[Firestore] getCollection failed for ${collectionName}, attempting Supabase fallback:`, fsErr);
    }

    // Supabase fallback
    const sbData = await getFromSupabaseTable(collectionName);
    return sbData || [];
}

// ========================================
// UPDATE DOCUMENT
// ========================================

export async function updateDocument(
    collectionName,
    documentId,
    data
) {
    const nowIso = new Date().toISOString();
    try {
        await updateDoc(
            doc(db, collectionName, documentId),
            {
                ...data,
                updatedAt: serverTimestamp()
            }
        );
    } catch (fsErr) {
        console.warn(`[Firestore] updateDocument failed for ${collectionName}/${documentId}:`, fsErr);
    }

    // Sync update to Supabase
    syncToSupabase(collectionName, { id: documentId, ...data, updatedAt: nowIso });
}

// ========================================
// DELETE DOCUMENT
// ========================================

export async function deleteDocument(
    collectionName,
    documentId
) {
    try {
        await deleteDoc(
            doc(db, collectionName, documentId)
        );
    } catch (fsErr) {
        console.warn(`[Firestore] deleteDocument failed for ${collectionName}/${documentId}:`, fsErr);
    }

    // Sync delete to Supabase
    syncDeleteToSupabase(collectionName, documentId);
}

// ========================================
// QUERY BY FIELD
// ========================================

export async function queryByField(
    collectionName,
    field,
    operator,
    value
) {
    try {
        const firestoreQuery = query(
            collection(db, collectionName),
            where(field, operator, value)
        );
        const snapshot = await getDocs(firestoreQuery);
        if (!snapshot.empty) {
            return snapshot.docs.map(document => ({
                id: document.id,
                ...document.data()
            }));
        }
    } catch (fsErr) {
        console.warn(`[Firestore] queryByField failed for ${collectionName}, attempting Supabase query:`, fsErr);
    }

    // Supabase query fallback
    return await getFromSupabaseTable(collectionName, (req) => {
        if (operator === "==" || operator === "===") {
            return req.eq(field, value);
        } else if (operator === ">") {
            return req.gt(field, value);
        } else if (operator === "<") {
            return req.lt(field, value);
        } else if (operator === ">=") {
            return req.gte(field, value);
        } else if (operator === "<=") {
            return req.lte(field, value);
        }
        return req;
    });
}

// ========================================
// GET LATEST DOCUMENTS
// ========================================

export async function getLatestDocuments(
    collectionName,
    count = 10
) {
    try {
        const firestoreQuery = query(
            collection(db, collectionName),
            orderBy("createdAt", "desc"),
            limit(count)
        );
        const snapshot = await getDocs(firestoreQuery);
        if (!snapshot.empty) {
            return snapshot.docs.map(document => ({
                id: document.id,
                ...document.data()
            }));
        }
    } catch (fsErr) {
        console.warn(`[Firestore] getLatestDocuments failed for ${collectionName}, attempting Supabase query:`, fsErr);
    }

    // Supabase fallback
    return await getFromSupabaseTable(collectionName, (req) => {
        return req.order("createdAt", { ascending: false }).limit(count);
    });
}

// ========================================
// MEMBER NUMBER GENERATOR
// ========================================

export async function generateMemberNumber() {
    try {
        const membersCollectionRef = collection(db, "members");
        const q = query(
            membersCollectionRef,
            orderBy("memberNumber", "desc"),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return "100001";
        }
        
        const latestMember = querySnapshot.docs[0].data();
        const latestNumber = parseInt(latestMember.memberNumber, 10);
        
        if (isNaN(latestNumber)) {
            return "100001";
        }
        
        return String(latestNumber + 1);
    } catch (error) {
        console.error("Error generating member number:", error);
        // Fallback to counting to be safe
        const members = await getCollection("members");
        const numberedCount = members.filter(
            m => m.memberNumber !== null &&
                m.memberNumber !== undefined &&
                m.memberNumber !== ""
        ).length;
        return String(100001 + numberedCount);
    }
}

// ========================================
// PROBLEM NUMBER GENERATOR
// ========================================

export function generateProblemNumber() {
    const timestamp =
        Date.now();

    return `PROB-${timestamp}`;
}

export {
    serverTimestamp
}
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";