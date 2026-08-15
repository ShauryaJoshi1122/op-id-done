// ========================================
// DATE FORMAT
// ========================================

export function formatDate(
    value
) {
    if (!value) {
        return "-";
    }

    try {

        const date =

            value?.seconds

                ?

                new Date(
                    value.seconds * 1000
                )

                :

                new Date(
                    value
                );

        return date.toLocaleDateString(

            "en-US",

            {

                year:
                    "numeric",

                month:
                    "short",

                day:
                    "numeric"

            }

        );

    }
    catch {

        return "-";

    }
}

// ========================================
// DATE TIME FORMAT
// ========================================

export function formatDateTime(
    value
) {
    if (!value) {
        return "-";
    }

    try {

        const date =

            value?.seconds

                ?

                new Date(
                    value.seconds * 1000
                )

                :

                new Date(
                    value
                );

        return date.toLocaleString(

            "en-US"

        );

    }
    catch {

        return "-";

    }
}

// ========================================
// TRIM TEXT
// ========================================

export function sanitizeText(
    value
) {
    return value
        ?.trim()
        ?.replace(
            /\s+/g,
            " "
        );
}

// ========================================
// GET FILE EXTENSION
// ========================================

export function getFileExtension(
    fileName
) {
    return fileName
        .split(".")
        .pop()
        .toLowerCase();
}

// ========================================
// FORMAT FILE SIZE
// ========================================

export function formatFileSize(
    bytes
) {
    if (
        bytes < 1024
    ) {
        return `${bytes} B`;
    }

    if (
        bytes < 1024 * 1024
    ) {
        return `${(

            bytes / 1024

        ).toFixed(2)} KB`;
    }

    return `${(

        bytes / 1024 / 1024

    ).toFixed(2)} MB`;
}

// ========================================
// DEBOUNCE
// ========================================

export function debounce(

    callback,

    delay = 300

) {
    let timer;

    return (...args) => {

        clearTimeout(
            timer
        );

        timer =
            setTimeout(

                () => {

                    callback(
                        ...args
                    );

                },

                delay

            );

    };
}

// ========================================
// EMPTY CHECK
// ========================================

export function isEmpty(
    value
) {
    return (

        value === null ||

        value === undefined ||

        value === ""

    );
}

// ========================================
// RANDOM ID
// ========================================

export function generateId() {
    return crypto.randomUUID();
}

// ========================================
// COPY TO CLIPBOARD
// ========================================

export async function copyText(
    text
) {
    try {

        await navigator
            .clipboard
            .writeText(
                text
            );

        return true;

    }
    catch {

        return false;

    }
}

// ========================================
// OPEN URL
// ========================================

export function openUrl(
    url
) {
    window.open(

        url,

        "_blank",

        "noopener,noreferrer"

    );
}

// ========================================
// MEMBER STATUS
// ========================================

export function getMemberStatusTamil(
    status
) {
    const statuses = {

        pending:
            "Pending",

        approved:
            "Approved",

        rejected:
            "Rejected"

    };

    return statuses[status] || status;
}

// ========================================
// PROBLEM STATUS
// ========================================

export function getProblemStatusTamil(
    status
) {
    const statuses = {

        pending:
            "Pending",

        "under-review":
            "Under Review",

        resolved:
            "Resolved",

        closed:
            "Closed"

    };

    return statuses[status] || status;
}

// ========================================
// BLOOD REQUEST STATUS
// ========================================

export function getBloodStatusTamil(
    status
) {
    const statuses = {

        pending:
            "Pending",

        fulfilled:
            "Fulfilled",

        closed:
            "Closed"

    };

    return statuses[status] || status;
}

// ========================================
// SCROLL TO TOP
// ========================================

export function scrollToTop() {
    window.scrollTo({

        top: 0,

        behavior:
            "smooth"

    });
}

// ========================================
// MEMBER TYPE
// ========================================

export function getMemberTypeTamil(
    type
) {
    const types = {

        "member":
            "Member",

        "active-member":
            "Active Member"

    };

    return types[type] || type || "-";
}

// ========================================
// HTML ESCAPE (XSS PREVENTION)
// ========================================

export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}