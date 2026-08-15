// ========================================
// IMPORTS
// ========================================

import {
    getCollection,
    getDocument
} from "../firebase/firestore.js";

import {
    COLLECTIONS,
    MEMBER_STATUS
} from "../utils/constants.js";

import {
    escapeHtml,
    formatDate,
    getMemberTypeTamil
} from "../utils/helpers.js";

import {
    showError,
    showSuccess,
    showWarning
} from "../utils/toast.js";

import {
    initFooterOnPage
} from "../utils/footer-renderer.js";

// ========================================
// DOM ELEMENTS
// ========================================

const btnTeamMember = document.getElementById("btnTeamMember");
const teamMembersModal = document.getElementById("teamMembersModal");
const closeTeamModalBtn = document.getElementById("closeTeamModalBtn");
const teamMembersContainer = document.getElementById("teamMembersContainer");
const teamSearchInput = document.getElementById("teamSearchInput");

const openVerifyPromptBtn = document.getElementById("openVerifyPromptBtn");
const verifyModal = document.getElementById("verifyModal");
const closeVerifyModalBtn = document.getElementById("closeVerifyModalBtn");
const quickVerifyForm = document.getElementById("quickVerifyForm");
const quickVerifyInput = document.getElementById("quickVerifyInput");
const quickVerifyOutput = document.getElementById("quickVerifyOutput");

const portalOrgName = document.getElementById("portalOrgName");
const portalOrgSubtitle = document.getElementById("portalOrgSubtitle");
const portalPhoneBtn = document.getElementById("portalPhoneBtn");
const portalWhatsAppBtn = document.getElementById("portalWhatsAppBtn");
const portalEmailBtn = document.getElementById("portalEmailBtn");
const portalFooterTitle = document.getElementById("portalFooterTitle");
const portalFooterAddress = document.getElementById("portalFooterAddress");

let cachedApprovedMembers = [];

// ========================================
// LOAD SETTINGS DYNAMICALLY
// ========================================

async function loadPortalSettings() {
    try {
        const orgSettings = await getDocument(COLLECTIONS.SETTINGS, "organization").catch(() => null);
        if (orgSettings) {
            if (orgSettings.orgName && portalOrgName) {
                portalOrgName.textContent = orgSettings.orgName;
                document.title = `${orgSettings.orgName} | Member & ID Portal`;
                if (portalFooterTitle) portalFooterTitle.textContent = orgSettings.orgName;
            }
            if (orgSettings.tagline && portalOrgSubtitle) {
                portalOrgSubtitle.textContent = orgSettings.tagline;
            }
            if (orgSettings.phone && portalPhoneBtn) {
                portalPhoneBtn.href = `tel:${orgSettings.phone.replace(/\s+/g, '')}`;
                portalPhoneBtn.textContent = `📞 ${orgSettings.phone}`;
            } else if (portalPhoneBtn) {
                portalPhoneBtn.style.display = "none";
            }
            if (orgSettings.phone && portalWhatsAppBtn) {
                const cleanNum = orgSettings.phone.replace(/[^0-9]/g, '');
                portalWhatsAppBtn.href = `https://wa.me/${cleanNum.startsWith('91') ? cleanNum : '91' + cleanNum}`;
            } else if (portalWhatsAppBtn) {
                portalWhatsAppBtn.style.display = "none";
            }
            if (orgSettings.email && portalEmailBtn) {
                portalEmailBtn.href = `mailto:${orgSettings.email}`;
                portalEmailBtn.textContent = `✉️ Email Us`;
            } else if (portalEmailBtn) {
                portalEmailBtn.style.display = "none";
            }
            if (orgSettings.address && portalFooterAddress) {
                portalFooterAddress.textContent = orgSettings.address;
            }
        }
    } catch (e) {
        console.warn("Could not load organization settings:", e);
    }
}

loadPortalSettings();
initFooterOnPage();

// ========================================
// TEAM MEMBERS MODAL LOGIC
// ========================================

if (btnTeamMember && teamMembersModal) {
    btnTeamMember.addEventListener("click", async () => {
        teamMembersModal.classList.add("active");
        teamMembersModal.setAttribute("aria-hidden", "false");
        await loadTeamMembers();
    });
}

if (closeTeamModalBtn && teamMembersModal) {
    closeTeamModalBtn.addEventListener("click", () => {
        teamMembersModal.classList.remove("active");
        teamMembersModal.setAttribute("aria-hidden", "true");
    });
}

window.addEventListener("click", (e) => {
    if (e.target === teamMembersModal) {
        teamMembersModal.classList.remove("active");
        teamMembersModal.setAttribute("aria-hidden", "true");
    }
    if (e.target === verifyModal) {
        verifyModal.classList.remove("active");
        verifyModal.setAttribute("aria-hidden", "true");
    }
});

async function loadTeamMembers() {
    if (cachedApprovedMembers.length > 0) {
        renderTeamMembers(cachedApprovedMembers);
        return;
    }

    try {
        const allMembers = await getCollection(COLLECTIONS.MEMBERS);
        cachedApprovedMembers = (allMembers || []).filter(
            (m) =>
                (m.status === MEMBER_STATUS.APPROVED || m.status === "approved") &&
                m.active !== false &&
                m.active !== "false"
        );

        renderTeamMembers(cachedApprovedMembers);
    } catch (err) {
        console.error("Error loading team members:", err);
        if (teamMembersContainer) {
            teamMembersContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ef4444;">
                    Failed to load members. Please try again.
                </div>
            `;
        }
    }
}

function renderTeamMembers(members) {
    if (!teamMembersContainer) return;

    if (!members || members.length === 0) {
        teamMembersContainer.innerHTML = `
            <div style="text-align: center; padding: 30px 10px; color: #64748b;">
                <p style="font-size: 1.1rem; margin-bottom: 8px;">No approved members found yet.</p>
                <a href="join-contact.html" style="color: #2563eb; font-weight: 600;">Click here to Apply for ID Card &rarr;</a>
            </div>
        `;
        return;
    }

    teamMembersContainer.innerHTML = members
        .map(
            (m) => `
        <div class="team-member-item">
            <img src="${m.photoUrl || 'images/default-user.jpg'}" alt="${escapeHtml(m.fullName)}" class="team-member-avatar" onerror="this.src='images/default-user.jpg'" />
            <div class="team-member-info">
                <h4 class="team-member-name">${escapeHtml(m.fullName)}</h4>
                <p class="team-member-meta">
                    <strong>ID:</strong> <span style="color: #2563eb; font-weight: 700;">${escapeHtml(m.memberNumber || 'Assigned')}</span>
                    ${m.occupation ? ` &bull; ${escapeHtml(m.occupation)}` : ''}
                </p>
                <p class="team-member-meta" style="color: #2563eb; font-size: 0.8rem; font-weight: 600;">
                    ✓ Verified Member
                </p>
            </div>
            <a href="id-card-template.html?memberId=${m.id}" class="team-member-action" target="_blank">
                View ID Card
            </a>
        </div>
    `
        )
        .join("");
}

if (teamSearchInput) {
    teamSearchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            renderTeamMembers(cachedApprovedMembers);
            return;
        }

        const filtered = cachedApprovedMembers.filter((m) => {
            const name = (m.fullName || "").toLowerCase();
            const num = (m.memberNumber || "").toLowerCase();
            const occ = (m.occupation || "").toLowerCase();
            return name.includes(query) || num.includes(query) || occ.includes(query);
        });

        renderTeamMembers(filtered);
    });
}

// ========================================
// FAST VERIFY MODAL LOGIC
// ========================================

if (openVerifyPromptBtn && verifyModal) {
    openVerifyPromptBtn.addEventListener("click", () => {
        verifyModal.classList.add("active");
        verifyModal.setAttribute("aria-hidden", "false");
        if (quickVerifyInput) quickVerifyInput.focus();
    });
}

if (closeVerifyModalBtn && verifyModal) {
    closeVerifyModalBtn.addEventListener("click", () => {
        verifyModal.classList.remove("active");
        verifyModal.setAttribute("aria-hidden", "true");
    });
}

if (quickVerifyForm && quickVerifyInput && quickVerifyOutput) {
    quickVerifyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const query = quickVerifyInput.value.trim();
        if (!query) return;

        quickVerifyOutput.style.display = "block";
        quickVerifyOutput.style.background = "#eff6ff";
        quickVerifyOutput.style.border = "1px solid #bfdbfe";
        quickVerifyOutput.innerHTML = `<p style="color: #1e40af; margin: 0; text-align: center;">Verifying member record...</p>`;

        try {
            const members = await getCollection(COLLECTIONS.MEMBERS);
            const found = (members || []).find(
                (m) =>
                    m.memberNumber &&
                    m.memberNumber.toLowerCase() === query.toLowerCase() &&
                    (m.status === MEMBER_STATUS.APPROVED || m.status === "approved") &&
                    m.active !== false &&
                    m.active !== "false"
            );

            if (found) {
                quickVerifyOutput.style.background = "#eff6ff";
                quickVerifyOutput.style.border = "1px solid #93c5fd";
                quickVerifyOutput.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${found.photoUrl || 'images/default-user.jpg'}" alt="Member" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #2563eb;" onerror="this.src='images/default-user.jpg'" />
                        <div>
                            <h4 style="margin: 0 0 2px; color: #1e40af; font-size: 1rem;">✓ Official Verified Member</h4>
                            <p style="margin: 0 0 2px; color: #1f2937; font-size: 0.9rem;"><strong>Name:</strong> ${escapeHtml(found.fullName)}</p>
                            <p style="margin: 0 0 4px; color: #1f2937; font-size: 0.9rem;"><strong>Member No:</strong> <span style="color: #2563eb; font-weight: bold;">${escapeHtml(found.memberNumber)}</span></p>
                            <a href="id-card-template.html?memberId=${found.id}" target="_blank" style="color: #2563eb; font-size: 0.85rem; font-weight: 600; text-decoration: underline;">
                                View Digital ID Card &rarr;
                            </a>
                        </div>
                    </div>
                `;
                showSuccess("ID Card verified successfully!");
            } else {
                quickVerifyOutput.style.background = "#fef2f2";
                quickVerifyOutput.style.border = "1px solid #fecaca";
                quickVerifyOutput.innerHTML = `
                    <div style="text-align: center; color: #991b1b;">
                        <h4 style="margin: 0 0 4px;">❌ Member Not Found</h4>
                        <p style="margin: 0; font-size: 0.85rem;">No active approved ID card matches member number "${escapeHtml(query)}".</p>
                    </div>
                `;
                showWarning("Member ID not found");
            }
        } catch (err) {
            console.error("Verification error:", err);
            quickVerifyOutput.style.background = "#fef2f2";
            quickVerifyOutput.style.border = "1px solid #fecaca";
            quickVerifyOutput.innerHTML = `
                <div style="text-align: center; color: #991b1b;">
                    <p style="margin: 0;">Verification failed. Please try again later.</p>
                </div>
            `;
            showError("Could not verify ID card");
        }
    });
}
