// ========================================
// APP NAME
// ========================================

export const APP_NAME =

    "தாமரை தொண்டு நிறுவன அறக்கட்டளை";

// ========================================
// MEMBER STATUS
// ========================================

export const MEMBER_STATUS = {

    PENDING:
        "pending",

    APPROVED:
        "approved",

    REJECTED:
        "rejected"

};

// ========================================
// MEMBER TYPES
// ========================================

export const MEMBER_TYPES = {

    MEMBER:
        "member",

    ACTIVE_MEMBER:
        "active-member"

};

// ========================================
// EVENT STATUS
// ========================================

export const EVENT_STATUS = {

    UPCOMING:
        "upcoming",

    ONGOING:
        "ongoing",

    COMPLETED:
        "completed",

    CANCELLED:
        "cancelled"

};

// ========================================
// BLOOD REQUEST STATUS
// ========================================

export const BLOOD_REQUEST_STATUS = {

    PENDING:
        "pending",

    FULFILLED:
        "fulfilled",

    CLOSED:
        "closed"

};

// ========================================
// PROBLEM STATUS
// ========================================

export const PROBLEM_STATUS = {

    PENDING:
        "pending",

    UNDER_REVIEW:
        "under-review",

    RESOLVED:
        "resolved",

    CLOSED:
        "closed"

};

// ========================================
// CONTACT STATUS
// ========================================

export const CONTACT_STATUS = {

    UNREAD:
        "unread",

    READ:
        "read",

    REPLIED:
        "replied",

    ARCHIVED:
        "archived"

};

// ========================================
// COLLECTIONS
// ========================================

export const COLLECTIONS = {

    ADMINS:
        "admins",

    MEMBERS:
        "members",

    EVENTS:
        "events",

    EVENT_REGISTRATIONS:
        "eventRegistrations",

    BLOOD_DONORS:
        "bloodDonors",

    BLOOD_REQUESTS:
        "bloodRequests",

    DONATIONS:
        "donations",

    GRIEVANCES:
        "grievances",

    TESTIMONIALS:
        "testimonials",

    CONTACT_MESSAGES:
        "contactMessages",

    LOGIN_HISTORY:
        "loginHistory",

    ANNOUNCEMENTS:
        "announcements",

    GALLERY:
        "gallery",

    VIDEOS:
        "videos",

    SETTINGS:
        "settings",

};

// ========================================
// STORAGE PATHS
// ========================================

export const STORAGE_PATHS = {

    MEMBER_PHOTOS:
        "memberPhotos",

    GOVERNMENT_PROOFS:
        "governmentProofs",

    EVENTS:
        "events",

    GALLERY:
        "gallery",

    FOUNDER:
        "founder",

    SIGNATURES:
        "signatures",

    QRCODES:
        "qrcodes"

};

// ========================================
// BLOOD GROUPS
// ========================================

export const BLOOD_GROUPS = [

    "A+",
    "A-",

    "B+",
    "B-",

    "AB+",
    "AB-",

    "O+",
    "O-"

];

// ========================================
// SUPPORTED FILES
// ========================================

export const IMAGE_TYPES = [

    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"

];

export const GOVERNMENT_PROOF_TYPES = [

    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf"

];

// ========================================
// FILE SIZE LIMITS
// ========================================

export const MAX_PHOTO_SIZE =

    5 * 1024 * 1024;

export const MAX_GOV_PROOF_SIZE =

    10 * 1024 * 1024;

// ========================================
// MEMBER NUMBER
// ========================================

export const MEMBER_NUMBER_START =

    100001;

// ========================================
// DONATION
// ========================================

export const DEFAULT_CURRENCY =

    "INR";

// ========================================
// PAGINATION
// ========================================

export const PAGE_SIZE =

    20;

export const DONATION_STATUS = {

    AWAITING_PAYMENT:
        "awaiting-payment",

    PAID:
        "paid"

};

export const BLOOD_DONOR_STATUS = {

    ACTIVE:
        "active",

    INACTIVE:
        "inactive"

};
