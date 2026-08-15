/* ==========================================================================
   OFFICIAL DIGITAL MEMBER ID CARD TEMPLATE & GENERATOR
   ========================================================================== */

import { watchAuth, isAdmin, logout } from "../firebase/auth.js";
import { getDocument, COLLECTIONS } from "../firebase/firestore.js";
import { formatDate, getMemberTypeTamil } from "../utils/validators.js";
import { buildIdCardHTML, DEFAULT_LAYOUT_CONFIG } from "../utils/id-card-renderer.js";

// ========================================
// DOM ELEMENTS
// ========================================

const validStatusSection = document.getElementById("validStatusSection");
const invalidStatusSection = document.getElementById("invalidStatusSection");
const idCardOuterContainer = document.getElementById("idCardOuterContainer");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const downloadPngBtn = document.getElementById("downloadPngBtn");
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
    if (!user) {
        location.href = "member-login.html";
        return;
    }

    if (memberIdParam) {
        try {
            const adminCheck = await isAdmin(user.uid, user);
            const isSelf = user.uid === memberIdParam;
            if (adminCheck || isSelf) {
                await loadMemberCard(memberIdParam);
                
                if (autoDownloadParam === "true") {
                    showSuccess("Generating ID Card...");
                    setTimeout(async () => {
                        await downloadIdCardPDF();
                    }, 1200);
                }
                return;
            } else {
                showError("Unauthorized access");
                showInvalid();
                return;
            }
        } catch (err) {
            console.error("Auth check failed:", err);
            showInvalid();
            return;
        }
    }

    await loadMemberCard(user.uid);
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
