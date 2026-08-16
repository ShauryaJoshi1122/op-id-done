/* ==========================================================================
   DYNAMIC SHORTCODES ENGINE - SARDAR VALLABHBHAI PATEL PARTY (SVPP)
   High-performance regex and token replacement engine
   ========================================================================== */

import { DEFAULT_ORG_SETTINGS } from "./constants.js";

/**
 * List of available shortcodes with human labels, descriptions, and sample preview data
 */
export const SHORTCODE_DEFINITIONS = [
    { tag: "{fullName}", aliases: ["{name}"], label: "Full Name", icon: "👤", defaultVal: "Ananya S. Patel", desc: "Member's Legal Full Name" },
    { tag: "{memberNumber}", aliases: ["{memberId}"], label: "Member ID", icon: "🆔", defaultVal: "SVPP-2026-9041", desc: "Official Unique Membership ID" },
    { tag: "{designation}", aliases: [], label: "Designation", icon: "🎖️", defaultVal: "State Executive Member", desc: "Assigned Party Position / Portfolio" },
    { tag: "{joiningDate}", aliases: [], label: "Joining Date", icon: "📅", defaultVal: "15/08/2025", desc: "Official Membership Induction Date" },
    { tag: "{validUpto}", aliases: [], label: "Valid Upto", icon: "⏳", defaultVal: "14/08/2026", desc: "Membership Expiration / Validity Date" },
    { tag: "{fatherName}", aliases: [], label: "Father Name", icon: "👨", defaultVal: "Sardar Vallabhbhai Patel", desc: "Father or Guardian Name" },
    { tag: "{dob}", aliases: [], label: "Date of Birth", icon: "🎂", defaultVal: "31/10/1990", desc: "Date of Birth (DD/MM/YYYY)" },
    { tag: "{mobile}", aliases: [], label: "Mobile Number", icon: "📱", defaultVal: "+91 98200 12345", desc: "Primary Contact Number" },
    { tag: "{email}", aliases: [], label: "Email Address", icon: "✉️", defaultVal: "patel.svpp@gmail.com", desc: "Official / Personal Email" },
    { tag: "{address}", aliases: [], label: "Address", icon: "🏠", defaultVal: "18 Sardar Patel Marg, New Delhi - 110001", desc: "Residential / Official Address" },
    { tag: "{refNumber}", aliases: [], label: "Reference No", icon: "📑", defaultVal: "SVPP/DEL/2026/089", desc: "Dispatch Reference / Appointment Order No" },
    { tag: "{appointmentDate}", aliases: [], label: "Appointment Date", icon: "📆", defaultVal: "15/08/2026", desc: "Date of Official Appointment" },
    { tag: "{orgName}", aliases: [], label: "Party Name", icon: "🏛️", defaultVal: DEFAULT_ORG_SETTINGS.orgName, desc: "Organization / Party Name" },
    { tag: "{leaderName}", aliases: [], label: "Signatory Title", icon: "✍️", defaultVal: DEFAULT_ORG_SETTINGS.leaderName, desc: "Authorized Signatory / National President" },
    { tag: "{website}", aliases: [], label: "Website", icon: "🌐", defaultVal: DEFAULT_ORG_SETTINGS.website, desc: "Official Portal Website URL" },
    { tag: "{slogan}", aliases: [], label: "Party Slogan", icon: "💬", defaultVal: DEFAULT_ORG_SETTINGS.slogan, desc: "Official Party Motto" },
    { tag: "{bloodGroup}", aliases: [], label: "Blood Group", icon: "🩸", defaultVal: "O+", desc: "Member Blood Group" },
    { tag: "{photo}", aliases: [], label: "Member Photo", icon: "🖼️", isMedia: true, desc: "Member Passport Photo" },
    { tag: "{qrCode}", aliases: [], label: "Verification QR", icon: "🔳", isMedia: true, desc: "Digital Verification QR Code" },
    { tag: "{signature}", aliases: [], label: "Party Seal & Sign", icon: "🔏", isMedia: true, desc: "Official Authorized Signature" }
];

/**
 * Format any timestamp, Date object, or string into DD/MM/YYYY
 */
export function formatToStandardDate(dateVal) {
    if (!dateVal) return "-";
    try {
        const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return String(dateVal);
    }
}

/**
 * Calculate Expiration / Valid Upto date (default 1 year from joining/approval date)
 */
export function computeValidUpto(joiningDateVal, years = 1) {
    try {
        const d = joiningDateVal?.toDate ? joiningDateVal.toDate() : (joiningDateVal ? new Date(joiningDateVal) : new Date());
        if (isNaN(d.getTime())) return "31/12/2026";
        const validDate = new Date(d);
        validDate.setFullYear(validDate.getFullYear() + (parseInt(years, 10) || 1));
        validDate.setDate(validDate.getDate() - 1); // 1 day before anniversary
        return formatToStandardDate(validDate);
    } catch {
        return "31/12/2026";
    }
}

/**
 * Builds the shortcode lookup map based on member, orgSettings, and appointment parameters
 */
export function buildShortcodeContext(member = {}, orgSettings = {}, extraParams = {}) {
    const org = { ...DEFAULT_ORG_SETTINGS, ...orgSettings };

    const fullName = member?.fullName || member?.name || "Ananya S. Patel";
    const memberNumber = member?.memberNumber || member?.memberId || "SVPP-2026-9041";
    const designation = extraParams?.designation || member?.designation || member?.memberTypeLabel || "State Executive Member";
    
    const rawJoinDate = member?.joiningDate || member?.approvedAt || member?.createdAt || new Date();
    const joiningDate = formatToStandardDate(rawJoinDate);
    
    const validYears = org?.validityYears || 1;
    const validUpto = extraParams?.validUpto || member?.validUpto || computeValidUpto(rawJoinDate, validYears);
    
    const fatherName = member?.fatherName || "-";
    const dob = member?.dob ? formatToStandardDate(member.dob) : "31/10/1990";
    const mobile = member?.mobile || "+91 98200 12345";
    const email = member?.email || "patel.svpp@gmail.com";
    const address = member?.address || "National Headquarters, New Delhi - 110001";
    const bloodGroup = member?.bloodGroup || "O+";
    
    const refNumber = extraParams?.refNumber || member?.refNumber || `SVPP/HQ/${new Date().getFullYear()}/${String(member?.memberNumber || "1024").replace(/[^0-9]/g, "") || "089"}`;
    const appointmentDate = extraParams?.appointmentDate ? formatToStandardDate(extraParams.appointmentDate) : formatToStandardDate(new Date());
    
    const orgName = org?.orgName || org?.name || DEFAULT_ORG_SETTINGS.orgName;
    const leaderName = org?.leaderName || DEFAULT_ORG_SETTINGS.leaderName;
    const website = org?.website || DEFAULT_ORG_SETTINGS.website;
    const slogan = org?.slogan || DEFAULT_ORG_SETTINGS.slogan;

    return {
        "{fullName}": fullName,
        "{name}": fullName,
        "{memberNumber}": memberNumber,
        "{memberId}": memberNumber,
        "{designation}": designation,
        "{joiningDate}": joiningDate,
        "{validUpto}": validUpto,
        "{fatherName}": fatherName,
        "{dob}": dob,
        "{mobile}": mobile,
        "{email}": email,
        "{address}": address,
        "{bloodGroup}": bloodGroup,
        "{refNumber}": refNumber,
        "{appointmentDate}": appointmentDate,
        "{orgName}": orgName,
        "{leaderName}": leaderName,
        "{website}": website,
        "{slogan}": slogan
    };
}

/**
 * Replace all shortcodes inside a template text string
 */
export function replaceShortcodes(templateText, contextMap) {
    if (!templateText) return "";
    let output = templateText;
    
    Object.keys(contextMap).forEach((tag) => {
        const val = contextMap[tag] !== undefined && contextMap[tag] !== null ? String(contextMap[tag]) : "";
        // Escape braces for regex
        const safeRegex = new RegExp(tag.replace(/([{}])/g, "\\$1"), "gi");
        output = output.replace(safeRegex, val);
    });

    return output;
}
