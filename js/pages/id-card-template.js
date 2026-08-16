/* ==========================================================================
   OFFICIAL DIGITAL MEMBER ID CARD CONTROLLER
   SARDAR VALLABHBHAI PATEL PARTY (SVPP)
   ========================================================================== */

import { watchAuth, logout } from "../firebase/auth.js";
import { getDocument, COLLECTIONS } from "../firebase/firestore.js";
import { buildIdCardHTML, DEFAULT_LAYOUT_CONFIG } from "../utils/id-card-renderer.js";
import { DEFAULT_ORG_SETTINGS } from "../utils/constants.js";
import { showToast } from "../utils/toast.js";

// DOM Elements
const validStatusSection = document.getElementById("validStatusSection");
const idCardOuterContainer = document.getElementById("idCardOuterContainer");
const dynamicCardContainer = document.getElementById("dynamicCardContainer");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const downloadPngBtn = document.getElementById("downloadPngBtn");
const printCardBtn = document.getElementById("printCardBtn");
const btnGoAppointmentLetter = document.getElementById("btnGoAppointmentLetter");
const logoutBtn = document.getElementById("logoutBtn");
const sideToggleButtons = document.querySelectorAll(".side-toggle-btn");

// State
let currentMember = null;
let assetSettings = {};
let orgSettings = { ...DEFAULT_ORG_SETTINGS };
let layoutSettings = null;
let activeSide = "both"; // "both" | "front" | "back"
let activeOrientation = "vertical"; // "vertical" | "horizontal"

// Query Params
const urlParams = new URLSearchParams(window.location.search);
const memberIdParam = urlParams.get("memberId") || urlParams.get("id");
const autoDownloadParam = urlParams.get("download");
const requestedOrientation = urlParams.get("orientation") || urlParams.get("layout");

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    // Setup Side Toggle Handlers
    sideToggleButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            sideToggleButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            activeSide = btn.getAttribute("data-side") || "both";
            renderCard();
        });
    });

    // Setup Orientation Toggle Handlers
    const btnToggleOriVertical = document.getElementById("btnToggleOriVertical");
    const btnToggleOriHorizontal = document.getElementById("btnToggleOriHorizontal");

    function updateOriToggleButtons(ori) {
        activeOrientation = ori;
        if (btnToggleOriVertical && btnToggleOriHorizontal) {
            if (ori === "horizontal") {
                btnToggleOriHorizontal.style.background = "#0F2B5C";
                btnToggleOriHorizontal.style.color = "white";
                btnToggleOriVertical.style.background = "transparent";
                btnToggleOriVertical.style.color = "#9a3412";
            } else {
                btnToggleOriVertical.style.background = "#0F2B5C";
                btnToggleOriVertical.style.color = "white";
                btnToggleOriHorizontal.style.background = "transparent";
                btnToggleOriHorizontal.style.color = "#9a3412";
            }
        }
    }

    if (btnToggleOriVertical) {
        btnToggleOriVertical.addEventListener("click", () => {
            updateOriToggleButtons("vertical");
            renderCard();
        });
    }

    if (btnToggleOriHorizontal) {
        btnToggleOriHorizontal.addEventListener("click", () => {
            updateOriToggleButtons("horizontal");
            renderCard();
        });
    }

    // Setup Action Buttons
    if (downloadPngBtn) downloadPngBtn.addEventListener("click", downloadIdCardPNG);
    if (downloadPdfBtn) downloadPdfBtn.addEventListener("click", downloadIdCardPDF);
    if (printCardBtn) printCardBtn.addEventListener("click", () => window.print());
    if (logoutBtn) logoutBtn.addEventListener("click", () => logout().then(() => location.href = "index.html"));

    // Watch Auth / Load Member
    watchAuth(async (user) => {
        const sessionMemberId = sessionStorage.getItem("tct_member_id") || sessionStorage.getItem("svpp_member_id") || memberIdParam;
        const targetId = memberIdParam || sessionMemberId || user?.uid;

        if (targetId) {
            await loadMemberCard(targetId);
        } else {
            // Default to Sample Preview if visitor is browsing without ID
            await loadSettings();
            currentMember = {
                id: "sample",
                fullName: "Ananya S. Patel",
                name: "Ananya S. Patel",
                memberNumber: "SVPP-2026-9041",
                designation: "State Executive Member",
                fatherName: "Sardar Vallabhbhai Patel",
                dob: "31/10/1990",
                bloodGroup: "O+",
                mobile: "+91 98200 12345",
                email: "patel.svpp@gmail.com",
                address: "18 Sardar Patel Marg, New Delhi - 110001",
                joiningDate: new Date(),
                status: "approved",
                active: true
            };
            showValid();
            renderCard();
        }
    });
});

/**
 * Load Global Settings from Firestore
 */
async function loadSettings() {
    try {
        const [assetsDoc, orgDoc, layoutDoc] = await Promise.all([
            getDocument(COLLECTIONS.SETTINGS, "assets").catch(() => null),
            getDocument(COLLECTIONS.SETTINGS, "organization").catch(() => null),
            getDocument(COLLECTIONS.SETTINGS, "idCardLayout").catch(() => null)
        ]);

        if (assetsDoc) assetSettings = assetsDoc;
        if (orgDoc) orgSettings = { ...DEFAULT_ORG_SETTINGS, ...orgDoc };
        if (layoutDoc) layoutSettings = layoutDoc;

        // Determine orientation
        if (requestedOrientation) {
            activeOrientation = requestedOrientation.toLowerCase() === "horizontal" ? "horizontal" : "vertical";
        } else if (layoutSettings?.orientation || layoutSettings?.cardOrientation) {
            activeOrientation = layoutSettings.orientation || layoutSettings.cardOrientation;
        } else if (layoutSettings?.preset === "svpp-horizontal" || layoutSettings?.preset === "horizontal") {
            activeOrientation = "horizontal";
        } else {
            activeOrientation = "vertical";
        }

        const btnToggleOriVertical = document.getElementById("btnToggleOriVertical");
        const btnToggleOriHorizontal = document.getElementById("btnToggleOriHorizontal");
        if (btnToggleOriVertical && btnToggleOriHorizontal) {
            if (activeOrientation === "horizontal") {
                btnToggleOriHorizontal.style.background = "#0F2B5C";
                btnToggleOriHorizontal.style.color = "white";
                btnToggleOriVertical.style.background = "transparent";
                btnToggleOriVertical.style.color = "#9a3412";
            } else {
                btnToggleOriVertical.style.background = "#0F2B5C";
                btnToggleOriVertical.style.color = "white";
                btnToggleOriHorizontal.style.background = "transparent";
                btnToggleOriHorizontal.style.color = "#9a3412";
            }
        }
    } catch (err) {
        console.warn("Could not load Firestore settings, using fallback:", err);
    }
}

/**
 * Load Member Data by ID
 */
async function loadMemberCard(uid) {
    try {
        await loadSettings();

        const member = await getDocument(COLLECTIONS.MEMBERS, uid);
        if (member) {
            currentMember = member;
            showValid();
            renderCard();

            if (btnGoAppointmentLetter) {
                btnGoAppointmentLetter.href = `appointment-letter-template.html?memberId=${member.id || uid}`;
            }

            if (autoDownloadParam === "true") {
                setTimeout(downloadIdCardPNG, 1000);
            }
        } else {
            // If ID not found in Firestore, load sample preview
            currentMember = {
                fullName: "Ananya S. Patel",
                memberNumber: uid.length > 8 ? "SVPP-2026-9041" : uid,
                designation: "State Executive Member",
                fatherName: "Sardar Vallabhbhai Patel",
                dob: "31/10/1990",
                bloodGroup: "O+",
                mobile: "+91 98200 12345",
                email: "patel.svpp@gmail.com",
                address: "18 Sardar Patel Marg, New Delhi - 110001",
                status: "approved",
                active: true
            };
            showValid();
            renderCard();
        }
    } catch (error) {
        console.error("Error loading member card:", error);
        showToast("Loaded default preview card", "info");
    }
}

function showValid() {
    if (validStatusSection) validStatusSection.style.display = "block";
    const welcomeSection = document.querySelector(".dashboard-welcome-section");
    if (welcomeSection) welcomeSection.style.display = "block";
}

/**
 * Render ID Card
 */
function renderCard() {
    if (!dynamicCardContainer && !idCardOuterContainer) return;
    const targetContainer = dynamicCardContainer || idCardOuterContainer;

    const orgName = orgSettings?.orgName || DEFAULT_ORG_SETTINGS.orgName;
    const leaderName = orgSettings?.leaderName || DEFAULT_ORG_SETTINGS.leaderName;

    const topHeader = document.getElementById("topHeaderOrgName");
    if (topHeader) topHeader.textContent = orgName;

    const welcomeLeader = document.getElementById("welcomeLeaderName");
    if (welcomeLeader) welcomeLeader.textContent = leaderName;

    const layoutConfig = {
        ...(layoutSettings || DEFAULT_LAYOUT_CONFIG),
        orientation: activeOrientation,
        cardOrientation: activeOrientation
    };
    const cardHTML = buildIdCardHTML(
        currentMember || {},
        orgSettings,
        assetSettings,
        layoutConfig,
        activeSide
    );

    targetContainer.innerHTML = cardHTML;
}

/**
 * 1-Click PNG Download via html2canvas
 */
async function downloadIdCardPNG() {
    const cardElement = document.querySelector(".id-card-double-wrapper") || 
                        document.querySelector(".svpp-id-card") || 
                        document.querySelector(".custom-id-card-side") ||
                        idCardOuterContainer;

    if (!cardElement) {
        showToast("ID Card element not found for download", "error");
        return;
    }

    try {
        showToast("Generating high-resolution PNG...", "info");
        downloadPngBtn.disabled = true;

        const canvas = await window.html2canvas(cardElement, {
            scale: 3, // 3x sharp resolution
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false
        });

        const imageUri = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        const memberId = (currentMember?.memberNumber || "SVPP-ID").replace(/[^a-zA-Z0-9]/g, "_");
        link.download = `SVPP_ID_Card_${memberId}_${activeSide}.png`;
        link.href = imageUri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast("ID Card PNG downloaded successfully!", "success");
    } catch (err) {
        console.error("PNG export error:", err);
        showToast("Failed to generate PNG image", "error");
    } finally {
        downloadPngBtn.disabled = false;
    }
}

/**
 * 1-Click PDF Download
 */
async function downloadIdCardPDF() {
    const cardElement = document.querySelector(".id-card-double-wrapper") || 
                        document.querySelector(".svpp-id-card") || 
                        document.querySelector(".custom-id-card-side") ||
                        idCardOuterContainer;

    if (!cardElement) {
        showToast("ID Card element not found", "error");
        return;
    }

    try {
        showToast("Generating PDF document...", "info");
        downloadPdfBtn.disabled = true;

        const canvas = await window.html2canvas(cardElement, {
            scale: 2.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false
        });

        const imageData = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;

        const isWide = canvas.width > canvas.height;
        const pdf = new jsPDF({
            orientation: isWide ? "landscape" : "portrait",
            unit: "mm",
            format: isWide ? [160, 100] : [100, 160]
        });

        const imgProps = pdf.getImageProperties(imageData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
        const memberNumber = currentMember?.memberNumber || "ID-Card";
        pdf.save(`SVPP-ID-${memberNumber}.pdf`);

        showToast("PDF downloaded successfully!", "success");
    } catch (err) {
        console.error("PDF export error:", err);
        showToast("Failed to generate PDF", "error");
    } finally {
        downloadPdfBtn.disabled = false;
    }
}
