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

// ========================================
// REAL-TIME LISTENERS
// ========================================
export function subscribeCollection(collectionName, callback) {
    const colRef = collection(db, collectionName);
    return onSnapshot(colRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(items);
    }, (error) => {
        console.warn(`[Firestore Realtime] Subscription error for ${collectionName}:`, error);
    });
}

export function subscribeDocument(collectionName, documentId, callback) {
    const docRef = doc(db, collectionName, documentId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    }, (error) => {
        console.warn(`[Firestore Realtime] Doc subscription error for ${collectionName}/${documentId}:`, error);
    });
}

// ========================================
// CREATE DOCUMENT
// ========================================

export async function createDocument(

    collectionName,

    data

) {
    const documentData = {

        ...data,

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp()

    };

    const documentRef =

        await addDoc(

            collection(

                db,

                collectionName

            ),

            documentData

        );

    return documentRef.id;
}

// ========================================
// SET DOCUMENT
// ========================================

export async function setDocument(

    collectionName,

    documentId,

    data

) {
    await setDoc(

        doc(

            db,

            collectionName,

            documentId

        ),

        {

            ...data,

            updatedAt:
                serverTimestamp()

        }

    );
}

// ========================================
// GET DOCUMENT
// ========================================

export async function getDocument(

    collectionName,

    documentId

) {
    const documentRef =

        doc(

            db,

            collectionName,

            documentId

        );

    const snapshot =

        await getDoc(
            documentRef
        );

    if (
        !snapshot.exists()
    ) {
        return null;
    }

    return {

        id:
            snapshot.id,

        ...snapshot.data()

    };
}

// ========================================
// GET COLLECTION
// ========================================

export async function getCollection(
    collectionName
) {
    const snapshot =

        await getDocs(

            collection(

                db,

                collectionName

            )

        );

    return snapshot.docs.map(

        document => (

            {

                id:
                    document.id,

                ...document.data()

            }

        )

    );
}

// ========================================
// UPDATE DOCUMENT
// ========================================

export async function updateDocument(

    collectionName,

    documentId,

    data

) {
    await updateDoc(

        doc(

            db,

            collectionName,

            documentId

        ),

        {

            ...data,

            updatedAt:
                serverTimestamp()

        }

    );
}

// ========================================
// DELETE DOCUMENT
// ========================================

export async function deleteDocument(

    collectionName,

    documentId

) {
    await deleteDoc(

        doc(

            db,

            collectionName,

            documentId

        )

    );
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
    const firestoreQuery =

        query(

            collection(

                db,

                collectionName

            ),

            where(

                field,

                operator,

                value

            )

        );

    const snapshot =

        await getDocs(
            firestoreQuery
        );

    return snapshot.docs.map(

        document => (

            {

                id:
                    document.id,

                ...document.data()

            }

        )

    );
}

// ========================================
// GET LATEST DOCUMENTS
// ========================================

export async function getLatestDocuments(

    collectionName,

    count = 10

) {
    const firestoreQuery =

        query(

            collection(

                db,

                collectionName

            ),

            orderBy(

                "createdAt",

                "desc"

            ),

            limit(
                count
            )

        );

    const snapshot =

        await getDocs(
            firestoreQuery
        );

    return snapshot.docs.map(

        document => (

            {

                id:
                    document.id,

                ...document.data()

            }

        )

    );
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