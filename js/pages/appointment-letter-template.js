/* ==========================================================================
   APPOINTMENT LETTER STUDIO CONTROLLER SCRIPT
   SARDAR VALLABHBHAI PATEL PARTY (SVPP)
   ========================================================================== */

import { getMembers, getSettings } from "../firebase/firestore.js";
import { showToast } from "../utils/toast.js";
import { DEFAULT_ORG_SETTINGS } from "../utils/constants.js";
import {
    buildAppointmentLetterHTML,
    DEFAULT_LETTER_TEMPLATE
} from "../utils/appointment-letter-renderer.js";
import {
    SHORTCODE_DEFINITIONS,
    formatToStandardDate,
    computeValidUpto
} from "../utils/shortcodes.js";

// Global State
let orgSettings = { ...DEFAULT_ORG_SETTINGS };
let assetSettings = {};
let membersList = [];
let selectedMember = null;

// DOM Elements
const memberSelectDropdown = document.getElementById("memberSelectDropdown");
const designationInput = document.getElementById("designationInput");
const refNumberInput = document.getElementById("refNumberInput");
const appointmentDateInput = document.getElementById("appointmentDateInput");
const validUptoInput = document.getElementById("validUptoInput");
const btnSetOneYear = document.getElementById("btnSetOneYear");
const letterHeaderColorInput = document.getElementById("letterHeaderColorInput");
const watermarkToggleInput = document.getElementById("watermarkToggleInput");
const letterBodyTextarea = document.getElementById("letterBodyTextarea");
const btnResetLetterBody = document.getElementById("btnResetLetterBody");
const letterShortcodeBadges = document.getElementById("letterShortcodeBadges");
const btnDownloadLetterPng = document.getElementById("btnDownloadLetterPng");
const btnDownloadLetterPdf = document.getElementById("btnDownloadLetterPdf");
const btnPrintLetter = document.getElementById("btnPrintLetter");
const btnCopyLetterText = document.getElementById("btnCopyLetterText");
const appointmentLetterCanvasWrapper = document.getElementById("appointmentLetterCanvasWrapper");

// Zoom controls
const btnLetterZoomIn = document.getElementById("btnLetterZoomIn");
const btnLetterZoomOut = document.getElementById("btnLetterZoomOut");
const btnLetterZoomReset = document.getElementById("btnLetterZoomReset");
const letterZoomLabel = document.getElementById("letterZoomLabel");

let letterCanvasZoom = 1.0;

function setLetterZoom(newZoom) {
    letterCanvasZoom = Math.min(1.5, Math.max(0.5, parseFloat(newZoom.toFixed(2))));
    if (appointmentLetterCanvasWrapper) {
        appointmentLetterCanvasWrapper.style.transform = `scale(${letterCanvasZoom})`;
        appointmentLetterCanvasWrapper.style.transformOrigin = "top center";
    }
    if (letterZoomLabel) {
        letterZoomLabel.textContent = `${Math.round(letterCanvasZoom * 100)}%`;
    }
}

/**
 * Initialize Appointment Letter Studio
 */
async function initAppointmentStudio() {
    try {
        // Set today's date in appointment date input
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        if (appointmentDateInput) {
            appointmentDateInput.value = `${yyyy}-${mm}-${dd}`;
        }

        // Initialize Valid Upto (1 year from today)
        if (validUptoInput) {
            validUptoInput.value = computeValidUpto(today, 1);
        }

        // Load Default Letter Template
        if (letterBodyTextarea) {
            letterBodyTextarea.value = DEFAULT_LETTER_TEMPLATE;
        }

        // Populate Shortcode Badges
        renderShortcodeBadges();

        // Load Firestore Settings
        await loadSettingsData();

        // Load Members from Firestore
        await loadMembersData();

        // Check URL Query parameters for specific member
        const urlParams = new URLSearchParams(window.location.search);
        const queryMemberId = urlParams.get("memberId") || urlParams.get("id");
        const queryMemberNumber = urlParams.get("memberNumber");

        if (queryMemberId || queryMemberNumber) {
            const found = membersList.find(
                (m) => m.id === queryMemberId || m.memberNumber === queryMemberNumber
            );
            if (found) {
                selectedMember = found;
                if (memberSelectDropdown) {
                    memberSelectDropdown.value = found.id;
                }
                syncMemberDetails(found);
            }
        }

        // Setup Event Listeners
        setupEventListeners();

        // Initial Render
        renderLiveLetter();
    } catch (err) {
        console.error("Initialization error:", err);
        showToast("Error initializing appointment studio", "error");
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAppointmentStudio);
} else {
    initAppointmentStudio();
}

/**
 * Load Org Settings & Asset Settings
 */
async function loadSettingsData() {
    try {
        const settingsRes = await getSettings("general");
        if (settingsRes?.data) {
            orgSettings = { ...DEFAULT_ORG_SETTINGS, ...settingsRes.data };
        }

        const assetsRes = await getSettings("assets");
        if (assetsRes?.data) {
            assetSettings = assetsRes.data;
        }
    } catch (err) {
        console.warn("Could not load cloud settings, using defaults:", err);
    }
}

/**
 * Load Approved Members
 */
async function loadMembersData() {
    try {
        const res = await getMembers({ limit: 100 });
        if (res && res.members && res.members.length > 0) {
            membersList = res.members;

            if (memberSelectDropdown) {
                // Clear existing except sample
                memberSelectDropdown.innerHTML = `
                    <option value="sample">Sample Preview: Ananya S. Patel (SVPP-2026-9041)</option>
                `;

                membersList.forEach((m) => {
                    const opt = document.createElement("option");
                    opt.value = m.id;
                    opt.textContent = `${m.fullName || "Member"} (${m.memberNumber || "Pending"}) - ${m.status || "active"}`;
                    memberSelectDropdown.appendChild(opt);
                });
            }
        }
    } catch (err) {
        console.warn("Could not load members list:", err);
    }
}

/**
 * Render Clickable Shortcode Badges
 */
function renderShortcodeBadges() {
    if (!letterShortcodeBadges) return;
    letterShortcodeBadges.innerHTML = "";

    SHORTCODE_DEFINITIONS.forEach((sc) => {
        if (sc.isMedia) return; // Skip media shortcodes like photo/qr in letter body
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "shortcode-chip";
        chip.innerHTML = `<span>${sc.icon || "🏷️"}</span> <span>${sc.tag}</span>`;
        chip.title = `${sc.label} - ${sc.desc}`;
        chip.addEventListener("click", () => insertShortcodeAtCursor(sc.tag));
        letterShortcodeBadges.appendChild(chip);
    });
}

/**
 * Insert shortcode tag at cursor inside letterBodyTextarea
 */
function insertShortcodeAtCursor(tag) {
    if (!letterBodyTextarea) return;
    const startPos = letterBodyTextarea.selectionStart;
    const endPos = letterBodyTextarea.selectionEnd;
    const currentVal = letterBodyTextarea.value;

    letterBodyTextarea.value =
        currentVal.substring(0, startPos) + tag + currentVal.substring(endPos);

    letterBodyTextarea.focus();
    letterBodyTextarea.selectionStart = startPos + tag.length;
    letterBodyTextarea.selectionEnd = startPos + tag.length;

    renderLiveLetter();
}

/**
 * Synchronize Member details into inputs
 */
function syncMemberDetails(member) {
    if (!member) return;
    if (member.designation && designationInput) {
        designationInput.value = member.designation;
    }
    if (refNumberInput) {
        const numPart = String(member.memberNumber || "089").replace(/[^0-9]/g, "") || "089";
        refNumberInput.value = `SVPP/HQ/${new Date().getFullYear()}/${numPart}`;
    }
    if (member.joiningDate && validUptoInput) {
        validUptoInput.value = computeValidUpto(member.joiningDate, 1);
    }
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Member dropdown change
    if (memberSelectDropdown) {
        memberSelectDropdown.addEventListener("change", (e) => {
            const val = e.target.value;
            if (val === "sample") {
                selectedMember = null;
            } else {
                selectedMember = membersList.find((m) => m.id === val) || null;
                if (selectedMember) {
                    syncMemberDetails(selectedMember);
                }
            }
            renderLiveLetter();
        });
    }

    // Inputs change
    [designationInput, refNumberInput, appointmentDateInput, validUptoInput, letterHeaderColorInput, watermarkToggleInput, letterBodyTextarea].forEach((input) => {
        if (input) {
            input.addEventListener("input", renderLiveLetter);
            input.addEventListener("change", renderLiveLetter);
        }
    });

    // Zoom buttons
    if (btnLetterZoomIn) btnLetterZoomIn.addEventListener("click", () => setLetterZoom(letterCanvasZoom + 0.15));
    if (btnLetterZoomOut) btnLetterZoomOut.addEventListener("click", () => setLetterZoom(letterCanvasZoom - 0.15));
    if (btnLetterZoomReset) btnLetterZoomReset.addEventListener("click", () => setLetterZoom(1.0));

    // Quick +1 Year button
    if (btnSetOneYear) {
        btnSetOneYear.addEventListener("click", () => {
            const baseDate = appointmentDateInput?.value ? new Date(appointmentDateInput.value) : new Date();
            if (validUptoInput) {
                validUptoInput.value = computeValidUpto(baseDate, 1);
                renderLiveLetter();
                showToast("Set validity to 1 Year from appointment date", "success");
            }
        });
    }

    // Reset Template
    if (btnResetLetterBody) {
        btnResetLetterBody.addEventListener("click", () => {
            if (confirm("Reset letter body template to official default wording?")) {
                if (letterBodyTextarea) {
                    letterBodyTextarea.value = DEFAULT_LETTER_TEMPLATE;
                    renderLiveLetter();
                    showToast("Restored default appointment template", "success");
                }
            }
        });
    }

    // Download PNG
    if (btnDownloadLetterPng) {
        btnDownloadLetterPng.addEventListener("click", downloadLetterPNG);
    }

    // Download PDF
    if (btnDownloadLetterPdf) {
        btnDownloadLetterPdf.addEventListener("click", downloadLetterPDF);
    }

    // Print
    if (btnPrintLetter) {
        btnPrintLetter.addEventListener("click", () => {
            window.print();
        });
    }

    // Copy text
    if (btnCopyLetterText) {
        btnCopyLetterText.addEventListener("click", () => {
            const letterEl = document.querySelector(".appointment-letter-sheet");
            if (letterEl) {
                navigator.clipboard.writeText(letterEl.innerText).then(() => {
                    showToast("Appointment letter text copied to clipboard!", "success");
                }).catch(() => {
                    showToast("Failed to copy text", "error");
                });
            }
        });
    }
}

/**
 * Render Live Appointment Letter to Canvas
 */
function renderLiveLetter() {
    if (!appointmentLetterCanvasWrapper) return;

    const letterParams = {
        designation: designationInput?.value || "State Executive Member",
        refNumber: refNumberInput?.value || "SVPP/HQ/2026/089",
        appointmentDate: appointmentDateInput?.value ? new Date(appointmentDateInput.value) : new Date(),
        validUpto: validUptoInput?.value || "14/08/2027",
        headerColor: letterHeaderColorInput?.value || "#0F2B5C",
        watermark: watermarkToggleInput?.value || "subtle",
        letterBody: letterBodyTextarea?.value || DEFAULT_LETTER_TEMPLATE
    };

    const targetMember = selectedMember || {
        fullName: "Ananya S. Patel",
        name: "Ananya S. Patel",
        memberNumber: "SVPP-2026-9041",
        fatherName: "Sardar Vallabhbhai Patel",
        dob: "31/10/1990",
        mobile: "+91 98200 12345",
        email: "patel.svpp@gmail.com",
        address: "18 Sardar Patel Marg, New Delhi - 110001",
        designation: letterParams.designation
    };

    const html = buildAppointmentLetterHTML(targetMember, orgSettings, letterParams, assetSettings);
    appointmentLetterCanvasWrapper.innerHTML = html;
}

/**
 * Download High-Res PDF of Appointment Letter via html2canvas & jsPDF
 */
async function downloadLetterPDF() {
    const letterElement = document.querySelector(".appointment-letter-sheet");
    if (!letterElement) {
        showToast("Cannot find letter canvas to download", "error");
        return;
    }

    try {
        showToast("Generating high-resolution appointment letter PDF...", "info");
        btnDownloadLetterPdf.disabled = true;
        btnDownloadLetterPdf.innerHTML = `<span>⏳</span> Generating PDF...`;

        const canvas = await window.html2canvas(letterElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: "p",
            unit: "mm",
            format: "a4"
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

        const targetName = (selectedMember?.fullName || "Member").replace(/[^a-zA-Z0-9]/g, "_");
        const refId = (refNumberInput?.value || "SVPP").replace(/[^a-zA-Z0-9]/g, "_");

        pdf.save(`SVPP_Appointment_Letter_${targetName}_${refId}.pdf`);
        showToast("Appointment Letter PDF generated successfully!", "success");
    } catch (err) {
        console.error("PDF download error:", err);
        showToast("Failed to generate PDF. Try the Print or PNG option.", "error");
    } finally {
        btnDownloadLetterPdf.disabled = false;
        btnDownloadLetterPdf.innerHTML = `<span>📄</span> Download High-DPI PDF`;
    }
}

/**
 * Download High-Res PNG of Appointment Letter via html2canvas
 */
async function downloadLetterPNG() {
    const letterElement = document.querySelector(".appointment-letter-sheet");
    if (!letterElement) {
        showToast("Cannot find letter canvas to download", "error");
        return;
    }

    try {
        showToast("Generating high-resolution appointment letter PNG...", "info");
        btnDownloadLetterPng.disabled = true;
        btnDownloadLetterPng.innerHTML = `<span>⏳</span> Generating Image...`;

        const canvas = await window.html2canvas(letterElement, {
            scale: 2, // 2x high DPI rendering
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false
        });

        const imageUri = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        const targetName = (selectedMember?.fullName || "Member").replace(/[^a-zA-Z0-9]/g, "_");
        const refId = (refNumberInput?.value || "SVPP").replace(/[^a-zA-Z0-9]/g, "_");

        downloadLink.download = `SVPP_Appointment_Letter_${targetName}_${refId}.png`;
        downloadLink.href = imageUri;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        showToast("Appointment Letter PNG downloaded successfully!", "success");
    } catch (err) {
        console.error("PNG download error:", err);
        showToast("Failed to generate PNG. Try the Print option.", "error");
    } finally {
        btnDownloadLetterPng.disabled = false;
        btnDownloadLetterPng.innerHTML = `<span>📥</span> Download Official Letter (PNG)`;
    }
}
