// ========================================
// HOME PAGE SCRIPT - MEMBER & ID CARD PORTAL
// ========================================

import {
    getDocument,
    getMembers
} from "../firebase/firestore.js";

import {
    COLLECTIONS
} from "../utils/constants.js";

import {
    DEFAULT_FOOTER_SETTINGS,
    applyFooterToPage,
    fetchFooterSettings
} from "../utils/footer-renderer.js";

// DOM Elements
const headerLogoImg = document.getElementById("headerLogoImg");
const headerPortalTitle = document.getElementById("headerPortalTitle");
const headerPortalSubtitle = document.getElementById("headerPortalSubtitle");
const centerEmblemImg = document.getElementById("centerEmblemImg");
const centerEmblemFallback = document.getElementById("centerEmblemFallback");

const btnCardDownload = document.getElementById("btnCardDownload");
const cardDownloadModal = document.getElementById("cardDownloadModal");
const closeCardModalBtn = document.getElementById("closeCardModalBtn");
const cardSearchForm = document.getElementById("cardSearchForm");
const cardSearchInput = document.getElementById("cardSearchInput");
const cardSearchResult = document.getElementById("cardSearchResult");

// Load dynamic brand settings & footer from Firestore
async function loadDynamicPortalSettings() {
    try {
        // 1. Load and apply footer settings
        const footerSettings = await fetchFooterSettings();
        applyFooterToPage(footerSettings);

        // 2. Load branding & organization details
        const orgSettings = await getDocument(COLLECTIONS.SETTINGS, "organization").catch(() => null);
        const assetSettings = await getDocument(COLLECTIONS.SETTINGS, "assets").catch(() => null);

        // Update Title & Subtitle
        if (orgSettings?.portalTitle && headerPortalTitle) {
            headerPortalTitle.textContent = orgSettings.portalTitle;
            document.title = orgSettings.portalTitle;
        } else if (orgSettings?.orgName && headerPortalTitle) {
            // Keep default "Member & ID Card Portal" unless custom specified
            if (orgSettings.portalTitle) headerPortalTitle.textContent = orgSettings.portalTitle;
        }

        if (orgSettings?.portalSubtitle && headerPortalSubtitle) {
            headerPortalSubtitle.textContent = orgSettings.portalSubtitle;
        } else if (orgSettings?.tagline && headerPortalSubtitle && !headerPortalSubtitle.textContent) {
            headerPortalSubtitle.textContent = orgSettings.tagline;
        }

        // Update Logo & Emblem Images
        const customLogoUrl = assetSettings?.logoUrl || orgSettings?.logoUrl || footerSettings?.logoUrl;
        if (customLogoUrl) {
            if (headerLogoImg) headerLogoImg.src = customLogoUrl;
            if (centerEmblemImg) {
                centerEmblemImg.src = customLogoUrl;
                centerEmblemImg.style.display = "block";
                if (centerEmblemFallback) centerEmblemFallback.style.display = "none";
            }
        }
    } catch (err) {
        console.warn("Could not load dynamic portal settings:", err);
    }
}

// Setup Card Download Modal & Quick Lookup
function setupCardDownloadFlow() {
    if (btnCardDownload && cardDownloadModal) {
        btnCardDownload.addEventListener("click", (e) => {
            e.preventDefault();
            cardDownloadModal.classList.add("active");
            if (cardSearchInput) {
                cardSearchInput.value = "";
                cardSearchInput.focus();
            }
            if (cardSearchResult) {
                cardSearchResult.style.display = "none";
                cardSearchResult.innerHTML = "";
            }
        });
    }

    if (closeCardModalBtn && cardDownloadModal) {
        closeCardModalBtn.addEventListener("click", () => {
            cardDownloadModal.classList.remove("active");
        });
    }

    if (cardDownloadModal) {
        cardDownloadModal.addEventListener("click", (e) => {
            if (e.target === cardDownloadModal) {
                cardDownloadModal.classList.remove("active");
            }
        });
    }

    // Form submit lookup
    if (cardSearchForm && cardSearchInput && cardSearchResult) {
        cardSearchForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const query = cardSearchInput.value.trim().toUpperCase();
            if (!query) return;

            cardSearchResult.style.display = "block";
            cardSearchResult.innerHTML = `
                <div style="padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 0.85rem; color: #64748b; text-align: center;">
                    🔍 Searching member records...
                </div>
            `;

            try {
                const res = await getMembers({ limit: 150 });
                const found = res?.members?.find((m) =>
                    (m.memberNumber && m.memberNumber.toUpperCase().includes(query)) ||
                    (m.mobile && m.mobile.includes(query)) ||
                    (m.id && m.id.toUpperCase() === query) ||
                    (m.fullName && m.fullName.toUpperCase().includes(query))
                );

                if (found) {
                    cardSearchResult.innerHTML = `
                        <div style="padding: 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; text-align: left;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <div style="font-weight: 800; color: #166534; font-size: 0.98rem;">✅ ${found.fullName}</div>
                                    <div style="font-size: 0.82rem; color: #0F2B5C; margin-top: 2px;"><strong>ID:</strong> ${found.memberNumber || found.id}</div>
                                    <div style="font-size: 0.82rem; color: #64748b;"><strong>Mobile:</strong> ${found.mobile || "-"}</div>
                                </div>
                                <span style="font-size: 0.75rem; background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Verified</span>
                            </div>
                            <div style="margin-top: 12px; display: flex; gap: 8px;">
                                <a href="id-card-template.html?memberId=${found.id}" style="flex: 1; text-align: center; font-size: 0.85rem; font-weight: 700; color: #ffffff; background: #2563eb; padding: 8px 12px; border-radius: 8px; text-decoration: none;">
                                    🪪 Download ID Card
                                </a>
                                <a href="appointment-letter-template.html?memberId=${found.id}" style="font-size: 0.85rem; font-weight: 700; color: #166534; background: #dcfce7; padding: 8px 12px; border-radius: 8px; text-decoration: none;">
                                    🎖️ Letter
                                </a>
                            </div>
                        </div>
                    `;
                } else {
                    cardSearchResult.innerHTML = `
                        <div style="padding: 12px; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 10px; color: #9f1239; font-size: 0.85rem;">
                            <div>❌ No record found matching "<strong>${query}</strong>".</div>
                            <div style="margin-top: 6px; font-size: 0.8rem; color: #64748b;">
                                Need to apply first? <a href="join-contact.html" style="color: #2563eb; font-weight: 700;">Apply for New ID Card &rarr;</a>
                            </div>
                            <div style="margin-top: 8px;">
                                <a href="id-card-template.html" style="display: inline-block; font-size: 0.8rem; color: #2563eb; text-decoration: underline;">Or open ID Card Studio directly</a>
                            </div>
                        </div>
                    `;
                }
            } catch (err) {
                console.error("Member search error:", err);
                cardSearchResult.innerHTML = `
                    <div style="padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; font-size: 0.85rem; text-align: center;">
                        <a href="id-card-template.html" style="color: #1d4ed8; font-weight: 700; text-decoration: none;">Open ID Card Studio &rarr;</a>
                    </div>
                `;
            }
        });
    }
}

// Initialize on page load
function init() {
    loadDynamicPortalSettings();
    setupCardDownloadFlow();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

