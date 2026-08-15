/* ==========================================================================
   OFFICIAL DIGITAL MEMBER ID CARD TEMPLATE & GENERATOR
   ========================================================================== */

import { watchAuth, isAdmin, logout } from "../firebase/auth.js";
import { getDocument, COLLECTIONS } from "../firebase/firestore.js";
import { formatDate, getMemberTypeTamil } from "../utils/helpers.js";
import { buildIdCardHTML, DEFAULT_LAYOUT_CONFIG } from "../utils/id-card-renderer.js";

// ========================================
// DOM ELEMENTS
// ========================================

const validStatusSection = document.getElementById("validStatusSection");
const invalidStatusSection = document.getElementById("invalidStatusSection");
const idCardOuterContainer = document.getElementById("idCardOuterContainer");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const downloadPngBtn = document.getElementById("downloadPngBtn");
const downloadLetterBtn = document.getElementById("downloadLetterBtn");
const printCardBtn = document.getElementById("printCardBtn");
const logoutBtn = document.getElementById("logoutBtn");

// ========================================
// CONSTANTS
// ========================================

const MEMBER_STATUS = {
    APPROVED: "approved",
    PENDING: "pending",
    REJECTED: "rejected"
};

// Query Params
const urlParams = new URLSearchParams(window.location.search);
const memberIdParam = urlParams.get("memberId") || urlParams.get("id");
const autoDownloadParam = urlParams.get("download");

// ========================================
// INITIALIZE
// ========================================

let currentMember = null;
let assetSettings = null;
let orgSettings = null;
let layoutSettings = null;

watchAuth(async (user) => {
    const sessionMemberId = sessionStorage.getItem("tct_member_id") || memberIdParam;

    if (!user && !sessionMemberId) {
        location.href = "member-login.html";
        return;
    }

    const targetMemberId = sessionMemberId || user?.uid;
    if (targetMemberId) {
        await loadMemberCard(targetMemberId);

        if (autoDownloadParam === "true") {
            setTimeout(async () => {
                await downloadIdCardPDF();
            }, 1200);
        }
    } else {
        showInvalid();
    }
});

// ========================================
// LOAD MEMBER & SETTINGS
// ========================================

async function loadMemberCard(uid) {
    try {
        try {
            [assetSettings, orgSettings, layoutSettings] = await Promise.all([
                getDocument(COLLECTIONS.SETTINGS, "assets").catch(() => null),
                getDocument(COLLECTIONS.SETTINGS, "organization").catch(() => null),
                getDocument(COLLECTIONS.SETTINGS, "idCardLayout").catch(() => null)
            ]);
        } catch (err) {
            console.warn("Settings documents could not be loaded:", err);
        }

        const member = await getDocument(COLLECTIONS.MEMBERS, uid);

        if (!member) {
            showInvalid();
            return;
        }

        if (member.status !== MEMBER_STATUS.APPROVED) {
            showInvalid();
            return;
        }

        if (member.active === false || member.active === "false") {
            showInvalid();
            return;
        }

        currentMember = member;
        showValid();
        renderCard(member);
    } catch (error) {
        console.error(error);
        showError("Failed to load ID card");
    }
}

// ========================================
// SHOW VALID / INVALID
// ========================================

function showValid() {
    if (validStatusSection) validStatusSection.style.display = "block";
    if (invalidStatusSection) invalidStatusSection.style.display = "none";
    const idCardPage = document.getElementById("idCardPage");
    if (idCardPage) idCardPage.style.display = "block";
    const welcomeSection = document.querySelector(".dashboard-welcome-section");
    if (welcomeSection) welcomeSection.style.display = "block";
}

function showInvalid() {
    if (validStatusSection) validStatusSection.style.display = "none";
    if (invalidStatusSection) invalidStatusSection.style.display = "block";
    const idCardPage = document.getElementById("idCardPage");
    if (idCardPage) idCardPage.style.display = "none";
    const welcomeSection = document.querySelector(".dashboard-welcome-section");
    if (welcomeSection) welcomeSection.style.display = "none";
}

// ========================================
// RENDER CARD
// ========================================

function renderCard(member) {
    const orgName = orgSettings?.orgName || "Official Member Portal";
    const leaderName = orgSettings?.leaderName || "Authorized Administration";

    const topHeader = document.getElementById("topHeaderOrgName");
    if (topHeader) topHeader.textContent = orgName;

    const welcomeLeader = document.getElementById("welcomeLeaderName");
    if (welcomeLeader) welcomeLeader.textContent = leaderName;

    // Use dynamic layout builder
    if (idCardOuterContainer) {
        const layoutConfig = layoutSettings || DEFAULT_LAYOUT_CONFIG;
        idCardOuterContainer.innerHTML = buildIdCardHTML(
            member,
            orgSettings,
            assetSettings,
            layoutConfig
        );
    }
}

// ========================================
// PDF DOWNLOAD
// ========================================

async function downloadIdCardPDF() {
    try {
        const card = document.querySelector(".member-id-card");
        if (!card) {
            showError("ID card element not found");
            return;
        }

        const canvas = await html2canvas(card, {
            scale: 3,
            useCORS: true,
            allowTaint: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: document.documentElement.clientWidth,
            windowHeight: document.documentElement.clientHeight
        });

        const imageData = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;

        const isHorizontal = card.classList.contains("card-layout-horizontal") || canvas.width > canvas.height;

        let pdfWidthMm = 54;
        let pdfHeightMm = 86;

        if (isHorizontal) {
            pdfWidthMm = 86;
            pdfHeightMm = parseFloat((pdfWidthMm * canvas.height / canvas.width).toFixed(4));
        } else {
            pdfWidthMm = 54;
            pdfHeightMm = parseFloat((pdfWidthMm * canvas.height / canvas.width).toFixed(4));
        }

        const pdf = new jsPDF({
            orientation: isHorizontal ? "landscape" : "portrait",
            unit: "mm",
            format: [pdfWidthMm, pdfHeightMm]
        });

        pdf.addImage(imageData, "PNG", 0, 0, pdfWidthMm, pdfHeightMm);
        const memberNumber = currentMember?.memberNumber || "ID-Card";
        pdf.save(`Member-ID-${memberNumber}.pdf`);
        showSuccess("PDF ID Card downloaded successfully!");
    } catch (error) {
        console.error("PDF generation failed:", error);
        showError("Failed to generate PDF");
    }
}

// ========================================
// PNG DOWNLOAD
// ========================================

async function downloadIdCardPNG() {
    try {
        const card = document.querySelector(".member-id-card");
        if (!card) {
            showError("ID card element not found");
            return;
        }

        const canvas = await html2canvas(card, {
            scale: 3,
            useCORS: true,
            allowTaint: false,
            scrollX: 0,
            scrollY: 0
        });

        const imageUri = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        const memberNumber = currentMember?.memberNumber || "ID-Card";
        link.download = `Member-ID-${memberNumber}.png`;
        link.href = imageUri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess("PNG ID Card downloaded successfully!");
    } catch (error) {
        console.error("PNG export failed:", error);
        showError("Failed to generate PNG image");
    }
}

// ========================================
// MEMBERSHIP LETTER PDF DOWNLOAD
// ========================================

async function downloadMembershipLetterPDF() {
    try {
        if (!currentMember) {
            showError("Member details not loaded");
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const orgName = orgSettings?.name || "THAMARAI CHARITABLE TRUST & FOUNDATION";
        const orgSub = orgSettings?.subtitle || "Registered Charitable Trust & Non-Profit Foundation";
        const authorityName = orgSettings?.authorityName || "Authorized Signatory";
        const authorityTitle = orgSettings?.authorityTitle || "President / General Secretary";

        // Header blue banner
        pdf.setFillColor(37, 99, 235);
        pdf.rect(0, 0, 210, 26, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(15);
        pdf.setFont("helvetica", "bold");
        pdf.text(orgName, 105, 12, { align: "center" });

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(orgSub, 105, 19, { align: "center" });

        // Letter Header & Reference
        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("OFFICIAL MEMBERSHIP APPOINTMENT LETTER", 105, 36, { align: "center" });

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        const todayStr = new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
        pdf.text(`Ref No: TCT/MEM/${currentMember.memberNumber || "NEW"}`, 15, 46);
        pdf.text(`Date: ${todayStr}`, 195, 46, { align: "right" });

        pdf.setLineWidth(0.4);
        pdf.setDrawColor(203, 213, 225);
        pdf.line(15, 49, 195, 49);

        // Recipient Address
        let y = 58;
        pdf.setFont("helvetica", "bold");
        pdf.text("To,", 15, y); y += 6;
        pdf.setFontSize(11);
        pdf.text(currentMember.fullName || "Valued Member", 15, y); y += 5;
        pdf.setFontSize(9.5);
        pdf.setFont("helvetica", "normal");
        if (currentMember.fatherName) { pdf.text(`S/o, D/o, W/o: ${currentMember.fatherName}`, 15, y); y += 5; }
        if (currentMember.address) { pdf.text(`Address: ${currentMember.address}`, 15, y); y += 5; }
        if (currentMember.mobile) { pdf.text(`Contact: ${currentMember.mobile} | Email: ${currentMember.email || "N/A"}`, 15, y); y += 8; }

        // Subject Line
        pdf.setFont("helvetica", "bold");
        pdf.text(`Subject: Official Membership Confirmation - Member ID: ${currentMember.memberNumber || currentMember.uid}`, 15, y); y += 10;

        // Content Body
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text(`Dear ${currentMember.fullName},`, 15, y); y += 7;

        const bodyMsg1 = `We are pleased to inform you that your application for membership with ${orgName} has been officially approved and verified by the administrative board.`;
        pdf.text(pdf.splitTextToSize(bodyMsg1, 180), 15, y); y += 12;

        const bodyMsg2 = `As a recognized ${currentMember.memberType === "active_member" ? "Active Member" : "Regular Member"}, you are hereby granted full participation in our community welfare initiatives, charitable programs, and official foundation events.`;
        pdf.text(pdf.splitTextToSize(bodyMsg2, 180), 15, y); y += 12;

        // Verification Table Box
        pdf.setFillColor(248, 250, 252);
        pdf.rect(15, y, 180, 42, "F");
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(15, y, 180, 42, "S");

        let ty = y + 7;
        pdf.setFont("helvetica", "bold");
        pdf.text("Official Membership Verification Details:", 20, ty); ty += 7;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(`• Full Name: ${currentMember.fullName}`, 20, ty);
        pdf.text(`• Member ID: ${currentMember.memberNumber || "Pending"}`, 110, ty); ty += 6;
        pdf.text(`• Member Category: ${currentMember.memberType === "active_member" ? "Active Member" : "Regular Member"}`, 20, ty);
        pdf.text(`• Blood Group: ${currentMember.bloodGroup || "N/A"}`, 110, ty); ty += 6;
        pdf.text(`• Issue Date: ${formatDate(currentMember.approvedAt || currentMember.createdAt)}`, 20, ty);
        pdf.text(`• Status: Official & Approved`, 110, ty); y += 50;

        // Closing Statement
        pdf.setFontSize(10);
        const bodyMsg3 = `Thank you for standing with us in our noble mission to serve society and empower communities.`;
        pdf.text(pdf.splitTextToSize(bodyMsg3, 180), 15, y); y += 20;

        // Signatory
        pdf.setFont("helvetica", "bold");
        pdf.text("Warm Regards,", 15, y); y += 12;
        pdf.text(authorityName, 15, y); y += 5;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(authorityTitle, 15, y); y += 4;
        pdf.text(orgName, 15, y);

        pdf.save(`Membership_Appointment_Letter_${currentMember.memberNumber || "Official"}.pdf`);
        showSuccess("Membership letter downloaded successfully!");
    } catch (err) {
        console.error("Letter generation error:", err);
        showError("Failed to generate membership letter.");
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", async () => {
        await downloadIdCardPDF();
    });
}

if (downloadPngBtn) {
    downloadPngBtn.addEventListener("click", async () => {
        await downloadIdCardPNG();
    });
}

if (downloadLetterBtn) {
    downloadLetterBtn.addEventListener("click", async () => {
        await downloadMembershipLetterPDF();
    });
}

if (printCardBtn) {
    printCardBtn.addEventListener("click", () => {
        window.print();
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            await logout();
            location.href = "member-login.html";
        } catch (error) {
            console.error(error);
        }
    });
}

function showSuccess(msg) {
    console.log("Success:", msg);
}

function showError(msg) {
    console.error("Error:", msg);
}
