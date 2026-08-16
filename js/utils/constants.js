// ========================================
// APP NAME & PARTY DEFAULTS
// ========================================

export const APP_NAME = "SARDAR VALLABHBHAI PATEL PARTY";
export const PARTY_SHORT_NAME = "SVPP";
export const PARTY_WEBSITE = "svpparty.co";
export const PARTY_SLOGAN = "Your Voice. Your Strength. Our Commitment.";
export const PARTY_HEADER_ACCENT = "#FF9933";
export const PARTY_PRIMARY_BLUE = "#0F2B5C";
export const PARTY_ACCENT_GREEN = "#138808";

export const DEFAULT_ORG_SETTINGS = {
    orgName: "SARDAR VALLABHBHAI PATEL PARTY",
    name: "SARDAR VALLABHBHAI PATEL PARTY",
    subtitle: "Rashtriya Rajnitik Dal | National Political Party",
    leaderName: "National President",
    authorityName: "Authorized Signatory",
    authorityTitle: "National General Secretary / President",
    website: "svpparty.co",
    slogan: "Your Voice. Your Strength. Our Commitment.",
    phone: "+91 98200 12345",
    email: "contact@svpparty.co",
    address: "National Headquarters, New Delhi, India",
    validityYears: 1,
    defaultDesignation: "State Executive Member"
};

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
