/* ==========================================================================
   OFFICIAL DIGITAL MEMBER ID CARD CONTROLLER
   SARDAR VALLABHBHAI PATEL PARTY (SVPP)
   ========================================================================== */

import { watchAuth, logout } from "../firebase/auth.js";
import { getDocument, getCollection, COLLECTIONS } from "../firebase/firestore.js";
import { buildIdCardHTML, DEFAULT_LAYOUT_CONFIG } from "../utils/id-card-renderer.js";
import { DEFAULT_ORG_SETTINGS } from "../utils/constants.js";
import { showToast } from "../utils/toast.js";
import { matchBirthDates, normalizeDobString } from "../utils/validators.js";

// DOM Elements
const validStatusSection = document.getElementById("validStatusSection");
const validBadgeText = document.getElementById("validBadgeText");
const welcomeHeading = document.getElementById("welcomeHeading");
const idCardOuterContainer = document.getElementById("idCardOuterContainer");
const dynamicCardContainer = document.getElementById("dynamicCardContainer");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const downloadPngBtn = document.getElementById("downloadPngBtn");
const downloadFrontPngBtn = document.getElementById("downloadFrontPngBtn");
const downloadBackPngBtn = document.getElementById("downloadBackPngBtn");
const printCardBtn = document.getElementById("printCardBtn");
const btnGoAppointmentLetter = document.getElementById("btnGoAppointmentLetter");
const logoutBtn = document.getElementById("logoutBtn");
const sideToggleButtons = document.querySelectorAll(".side-toggle-btn");

// Auth Modal DOM Elements
const memberAuthModal = document.getElementById("memberAuthModal");
const inPageMemberAuthForm = document.getElementById("inPageMemberAuthForm");
const modalMemberIdInput = document.getElementById("modalMemberIdInput");
const modalMemberDobInput = document.getElementById("modalMemberDobInput");
const modalAuthSubmitBtn = document.getElementById("modalAuthSubmitBtn");
const modalAuthError = document.getElementById("modalAuthError");

// State
let currentMember = null;
let isAuthenticatedMember = false;
let isAdminUser = false;
let assetSettings = {};
let orgSettings = { ...DEFAULT_ORG_SETTINGS };
let layoutSettings = null;
let activeSide = "both"; // "both" | "front" | "back"
let activeOrientation = "vertical"; // "vertical" | "horizontal"
let pendingDownloadAction = null;

// Query Params
const urlParams = new URLSearchParams(window.location.search);
const memberIdParam = urlParams.get("memberId") || urlParams.get("id");
const autoDownloadParam = urlParams.get("download");
const requestedOrientation = urlParams.get("orientation") || urlParams.get("layout");

// Sample preview member for unauthenticated visitors
const DEFAULT_SAMPLE_MEMBER = {
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

    // Setup Action Buttons with Auth Verification Protection
    if (downloadPngBtn) {
        downloadPngBtn.addEventListener("click", () => requireAuthForAction(() => downloadIdCardPNG(activeSide)));
    }
    if (downloadFrontPngBtn) {
        downloadFrontPngBtn.addEventListener("click", () => requireAuthForAction(() => downloadIdCardPNG("front")));
    }
    if (downloadBackPngBtn) {
        downloadBackPngBtn.addEventListener("click", () => requireAuthForAction(() => downloadIdCardPNG("back")));
    }
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener("click", () => requireAuthForAction(downloadIdCardPDF));
    }
    if (printCardBtn) {
        printCardBtn.addEventListener("click", () => requireAuthForAction(() => window.print()));
    }
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("svpp_authenticated_member_id");
            sessionStorage.removeItem("svpp_authenticated_member");
            sessionStorage.removeItem("tct_member_id");
            sessionStorage.removeItem("tct_member_email");
            localStorage.removeItem("svpp_auth_member_id");
            logout().then(() => {
                location.href = "member-login.html";
            }).catch(() => {
                location.href = "member-login.html";
            });
        });
    }

    // In-page Auth Form Handler
    if (inPageMemberAuthForm) {
        inPageMemberAuthForm.addEventListener("submit", handleInPageMemberAuth);
    }

    // Watch Auth / Check Session
    watchAuth(async (user) => {
        if (user) {
            isAdminUser = true;
        }
        await checkMemberSession();
    });
});

/**
 * Check if the visitor is verified with Member ID & DoB session
 */
async function checkMemberSession() {
    await loadSettings();

    const storedAuthId = sessionStorage.getItem("svpp_authenticated_member_id") || 
                         sessionStorage.getItem("tct_member_id") || 
                         localStorage.getItem("svpp_auth_member_id");
    
    const storedAuthMemberJSON = sessionStorage.getItem("svpp_authenticated_member");

    // If Admin is logged in via Firebase Auth or admin session
    if (isAdminUser || sessionStorage.getItem("adminUser")) {
        isAuthenticatedMember = true;
        const targetId = memberIdParam || storedAuthId;
        if (targetId) {
            await loadMemberCard(targetId);
        } else {
            currentMember = DEFAULT_SAMPLE_MEMBER;
            showValid("Official Sample Preview &bull; Admin Mode");
            renderCard();
        }
        return;
    }

    // If verified member session exists
    if (storedAuthMemberJSON) {
        try {
            const memberObj = JSON.parse(storedAuthMemberJSON);
            if (memberObj && (memberObj.id || memberObj.memberNumber)) {
                currentMember = memberObj;
                isAuthenticatedMember = true;
                showValid(`Verified Official Member: ${memberObj.fullName} (${memberObj.memberNumber || "SVPP"})`);
                renderCard();

                if (btnGoAppointmentLetter) {
                    btnGoAppointmentLetter.href = `appointment-letter-template.html?memberId=${memberObj.id || memberObj.memberNumber}`;
                }

                if (autoDownloadParam === "true") {
                    setTimeout(() => downloadIdCardPNG(activeSide), 800);
                }
                return;
            }
        } catch (e) {
            console.warn("Session parse fallback:", e);
        }
    }

    if (storedAuthId) {
        const loaded = await loadMemberCard(storedAuthId);
        if (loaded) {
            isAuthenticatedMember = true;
            return;
        }
    }

    // If a memberId was passed in query params but user has not logged in with DoB
    if (memberIdParam) {
        // Show auth modal prompting for Date of Birth verification
        currentMember = DEFAULT_SAMPLE_MEMBER;
        renderCard();
        openAuthModal(memberIdParam);
        return;
    }

    // Unauthenticated visitor -> Show sample and modal
    currentMember = DEFAULT_SAMPLE_MEMBER;
    renderCard();
}

/**
 * Enforce Member Login with Member ID & DoB before downloading
 */
function requireAuthForAction(actionCallback) {
    if (isAuthenticatedMember || isAdminUser) {
        actionCallback();
    } else {
        pendingDownloadAction = actionCallback;
        openAuthModal();
    }
}

function openAuthModal(prefillId = "") {
    if (memberAuthModal) {
        if (modalMemberIdInput) {
            if (prefillId && prefillId !== "sample") {
                modalMemberIdInput.value = prefillId;
            } else if (currentMember?.memberNumber && currentMember.memberNumber !== "SVPP-2026-9041") {
                modalMemberIdInput.value = currentMember.memberNumber;
            }
        }
        if (modalAuthError) {
            modalAuthError.style.display = "none";
            modalAuthError.textContent = "";
        }
        memberAuthModal.style.display = "flex";
        if (modalMemberDobInput) modalMemberDobInput.focus();
    } else {
        location.href = "member-login.html";
    }
}

function closeAuthModal() {
    if (memberAuthModal) {
        memberAuthModal.style.display = "none";
    }
}

/**
 * In-Page Member Verification Handler
 */
async function handleInPageMemberAuth(e) {
    e.preventDefault();
    const enteredId = (modalMemberIdInput?.value || "").trim().toLowerCase();
    const enteredDob = (modalMemberDobInput?.value || "").trim();

    if (!enteredId) {
        showModalError("Please enter your Member ID or registered email.");
        return;
    }

    if (!enteredDob) {
        showModalError("Please enter your Date of Birth (DoB).");
        return;
    }

    if (modalAuthSubmitBtn) {
        modalAuthSubmitBtn.disabled = true;
        modalAuthSubmitBtn.innerHTML = `<span>⏳</span> Verifying Credentials...`;
    }

    try {
        const allMembers = await getCollection(COLLECTIONS.MEMBERS);
        const found = allMembers.find((m) => {
            const matchId = (m.id || "").toLowerCase() === enteredId;
            const matchMemberNo = (m.memberNumber || "").toLowerCase() === enteredId;
            const matchEmail = (m.email || "").toLowerCase() === enteredId;
            const matchPhone = (m.mobile || m.phone || "").replace(/\D/g, "") === enteredId.replace(/\D/g, "");
            return matchId || matchMemberNo || matchEmail || (enteredId.length >= 7 && matchPhone);
        });

        if (!found) {
            showModalError(`No registered member found with ID "${enteredId}". Please check your credentials.`);
            return;
        }

        const storedDob = found.dob || found.dateOfBirth;
        if (storedDob && !matchBirthDates(storedDob, enteredDob)) {
            showModalError(`❌ Date of Birth does not match records for Member ID "${found.memberNumber || enteredId}".`);
            return;
        }

        if (found.status === "pending") {
            showModalError("Your membership application is currently pending admin approval.");
            return;
        }

        if (found.status === "rejected") {
            showModalError("Your membership application was not approved.");
            return;
        }

        // Successfully verified!
        const memberIdKey = found.id || found.memberId || found.memberNumber;
        sessionStorage.setItem("svpp_authenticated_member_id", memberIdKey);
        sessionStorage.setItem("svpp_authenticated_member", JSON.stringify(found));
        sessionStorage.setItem("tct_member_id", memberIdKey);
        localStorage.setItem("svpp_auth_member_id", memberIdKey);

        currentMember = found;
        isAuthenticatedMember = true;
        closeAuthModal();

        showValid(`Verified Official Member: ${found.fullName} (${found.memberNumber || "SVPP"})`);
        renderCard();
        showToast(`Identity Verified: Welcome, ${found.fullName}!`, "success");

        if (btnGoAppointmentLetter) {
            btnGoAppointmentLetter.href = `appointment-letter-template.html?memberId=${memberIdKey}`;
        }

        // Execute any pending download user had clicked
        if (typeof pendingDownloadAction === "function") {
            const act = pendingDownloadAction;
            pendingDownloadAction = null;
            setTimeout(act, 500);
        }

    } catch (err) {
        console.error("Auth error:", err);
        showModalError("Failed to verify credentials. Please try again.");
    } finally {
        if (modalAuthSubmitBtn) {
            modalAuthSubmitBtn.disabled = false;
            modalAuthSubmitBtn.innerHTML = `🔐 Verify Credentials & Unlock ID Card`;
        }
    }
}

function showModalError(msg) {
    if (modalAuthError) {
        modalAuthError.textContent = msg;
        modalAuthError.style.display = "block";
    }
}

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
            showValid(`Verified Official Member: ${member.fullName} (${member.memberNumber || uid})`);
            renderCard();

            if (btnGoAppointmentLetter) {
                btnGoAppointmentLetter.href = `appointment-letter-template.html?memberId=${member.id || uid}`;
            }
            return true;
        }
    } catch (error) {
        console.error("Error loading member card:", error);
    }
    return false;
}

function showValid(customMessage) {
    if (validStatusSection) {
        validStatusSection.style.display = "block";
        if (validBadgeText && customMessage) {
            validBadgeText.innerHTML = customMessage;
        }
    }
    const welcomeSection = document.querySelector(".dashboard-welcome-section");
    if (welcomeSection) {
        welcomeSection.style.display = "block";
        if (welcomeHeading && currentMember?.fullName) {
            welcomeHeading.textContent = `Welcome, ${currentMember.fullName}`;
        }
    }
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
        currentMember || DEFAULT_SAMPLE_MEMBER,
        orgSettings,
        assetSettings,
        layoutConfig,
        activeSide
    );

    targetContainer.innerHTML = cardHTML;
}

/**
 * Convert all images inside container to inlined Base64 Data URLs to prevent html2canvas CORS / canvas taint
 */
async function inlineContainerImages(container) {
    if (!container) return;
    const images = Array.from(container.querySelectorAll("img"));

    await Promise.all(images.map(async (img) => {
        const src = img.src;
        if (!src || src.startsWith("data:")) return;

        try {
            const dataUrl = await fetchImageAsDataURL(src);
            if (dataUrl) {
                img.setAttribute("src", dataUrl);
            }
        } catch (e) {
            console.warn("Could not inline image:", src, e);
        }
    }));
}

function fetchImageAsDataURL(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function () {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth || img.width || 200;
                canvas.height = img.naturalHeight || img.height || 200;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            } catch (e) {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

/**
 * Robust High-Res PNG Download for Front, Back, or Both Sides
 */
async function downloadIdCardPNG(sideToExport = activeSide) {
    const originalSide = activeSide;
    let targetElement = null;

    try {
        showToast(`Generating high-resolution ID Card PNG (${sideToExport})...`, "info");
        if (downloadPngBtn) downloadPngBtn.disabled = true;
        if (downloadFrontPngBtn) downloadFrontPngBtn.disabled = true;
        if (downloadBackPngBtn) downloadBackPngBtn.disabled = true;

        // If specific side requested and currently viewing both, temporarily render target side
        if (sideToExport !== "both" && activeSide === "both") {
            const frontCard = document.querySelector(".custom-id-card-side.front") || document.querySelector(".card-front");
            const backCard = document.querySelector(".custom-id-card-side.back") || document.querySelector(".card-back");
            
            if (sideToExport === "front" && frontCard) {
                targetElement = frontCard;
            } else if (sideToExport === "back" && backCard) {
                targetElement = backCard;
            }
        }

        if (!targetElement) {
            targetElement = document.querySelector(".id-card-double-wrapper") || 
                            document.querySelector(".svpp-id-card") || 
                            document.querySelector(".custom-id-card-side") ||
                            idCardOuterContainer;
        }

        if (!targetElement) {
            showToast("ID Card element not found for download", "error");
            return;
        }

        // Inline images to guarantee clean export without taint
        await inlineContainerImages(targetElement);

        if (!window.html2canvas) {
            showToast("Canvas export library loading, please try again in a moment.", "warning");
            return;
        }

        const canvas = await window.html2canvas(targetElement, {
            scale: 3, // 300 DPI equivalent sharp resolution
            useCORS: true,
            allowTaint: false, // Critical: prevent canvas security tainting so toDataURL succeeds
            backgroundColor: null,
            logging: false,
            imageTimeout: 10000
        });

        const imageUri = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        const memberIdStr = (currentMember?.memberNumber || currentMember?.id || "SVPP-ID").replace(/[^a-zA-Z0-9]/g, "_");
        const memberNameStr = (currentMember?.fullName || "Member").replace(/[^a-zA-Z0-9]/g, "_");

        link.download = `SVPP_ID_Card_${memberIdStr}_${memberNameStr}_${sideToExport}.png`;
        link.href = imageUri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast("High-Resolution ID Card PNG downloaded!", "success");
    } catch (err) {
        console.error("PNG export error:", err);
        showToast("Failed to generate PNG image. Please use Print -> Save as PDF.", "error");
    } finally {
        if (downloadPngBtn) downloadPngBtn.disabled = false;
        if (downloadFrontPngBtn) downloadFrontPngBtn.disabled = false;
        if (downloadBackPngBtn) downloadBackPngBtn.disabled = false;
    }
}

/**
 * 1-Click High-DPI PDF Download
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
        showToast("Generating official PDF document...", "info");
        if (downloadPdfBtn) downloadPdfBtn.disabled = true;

        await inlineContainerImages(cardElement);

        if (!window.html2canvas || !window.jspdf) {
            showToast("PDF generator loading, please try in a moment.", "warning");
            return;
        }

        const canvas = await window.html2canvas(cardElement, {
            scale: 2.5,
            useCORS: true,
            allowTaint: false,
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

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imageData);
        const calcHeight = (imgProps.height * pdfWidth) / imgProps.width;

        const yPos = calcHeight < pdfHeight ? (pdfHeight - calcHeight) / 2 : 0;
        pdf.addImage(imageData, "PNG", 0, yPos, pdfWidth, calcHeight);

        const memberNumber = (currentMember?.memberNumber || currentMember?.id || "SVPP-ID").replace(/[^a-zA-Z0-9]/g, "_");
        pdf.save(`SVPP-Official-ID-${memberNumber}.pdf`);

        showToast("Official PDF ID Card downloaded!", "success");
    } catch (err) {
        console.error("PDF export error:", err);
        showToast("Failed to generate PDF. You can use Print ID Card as an alternative.", "error");
    } finally {
        if (downloadPdfBtn) downloadPdfBtn.disabled = false;
    }
}
