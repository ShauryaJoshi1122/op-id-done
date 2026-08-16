// ========================================
// IMPORTS
// ========================================

import {
    watchAuth,
    logout,
    isAdmin,
    isSuperAdmin,
    fetchAllAdmins,
    createAdminAccount,
    removeAdminAccount,
    toggleAdminStatus
} from "../firebase/auth.js";

import { sendMemberStatusNotification } from "../utils/email.js";

import {
    getCollection,
    updateDocument,
    deleteDocument,
    generateMemberNumber,
    getDocument,
    setDocument,
    serverTimestamp
} from "../firebase/firestore.js";

import {
    deleteGovernmentProof,
    getGovernmentProofUrl,
    uploadSignature,
    uploadMemberPhoto,
    uploadIdCardTemplateImage,
    deleteFile
} from "../firebase/storage.js";

import {
    formatDate,
    formatDateTime,
    getMemberStatusTamil,
    getMemberTypeTamil,
    escapeHtml
} from "../utils/helpers.js";

import {
    showSuccess,
    showError,
    showWarning
} from "../utils/toast.js";

import {
    COLLECTIONS,
    MEMBER_STATUS
} from "../utils/constants.js";

import {
    buildIdCardHTML,
    DEFAULT_LAYOUT_CONFIG,
    AVAILABLE_SHORTCODES
} from "../utils/id-card-renderer.js";

import {
    fetchFooterSettings,
    applyFooterToPage,
    DEFAULT_FOOTER_SETTINGS
} from "../utils/footer-renderer.js";

// ========================================
// DOM ELEMENTS
// ========================================

const adminInfo = document.getElementById("adminInfo");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const dashboardLoader = document.getElementById("dashboardLoader");

const memberApprovalsTableBody = document.getElementById("memberApprovalsTableBody");
const membersTableBody = document.getElementById("membersTableBody");
const memberSearchInput = document.getElementById("memberSearchInput");
const exportMembersBtn = document.getElementById("exportMembersBtn");
const clearAllOldMembersBtn = document.getElementById("clearAllOldMembersBtn");

// Organization Settings Elements
const orgSettingsForm = document.getElementById("orgSettingsForm");
const portalTitleInput = document.getElementById("portalTitleInput");
const portalSubtitleInput = document.getElementById("portalSubtitleInput");
const portalLogoUpload = document.getElementById("portalLogoUpload");
const portalLogoUrlInput = document.getElementById("portalLogoUrlInput");
const currentLogoPreview = document.getElementById("currentLogoPreview");
const orgNameInput = document.getElementById("orgNameInput");
const orgTaglineInput = document.getElementById("orgTaglineInput");
const orgPhoneInput = document.getElementById("orgPhoneInput");
const orgEmailInput = document.getElementById("orgEmailInput");
const orgAddressInput = document.getElementById("orgAddressInput");
const orgLeaderNameInput = document.getElementById("orgLeaderNameInput");
const orgLeaderTitleInput = document.getElementById("orgLeaderTitleInput");

// Footer Settings Form Elements
const footerSettingsForm = document.getElementById("footerSettingsForm");
const footerLogoTopInput = document.getElementById("footerLogoTopInput");
const footerLogoStarInput = document.getElementById("footerLogoStarInput");
const footerLogoBottomInput = document.getElementById("footerLogoBottomInput");
const footerEmailInput = document.getElementById("footerEmailInput");
const footerPhoneInput = document.getElementById("footerPhoneInput");
const footerAddressInput = document.getElementById("footerAddressInput");
const footerCopyrightInput = document.getElementById("footerCopyrightInput");
const footerTermsUrlInput = document.getElementById("footerTermsUrlInput");
const footerPrivacyUrlInput = document.getElementById("footerPrivacyUrlInput");
const footerDisclaimerUrlInput = document.getElementById("footerDisclaimerUrlInput");
const footerRefundUrlInput = document.getElementById("footerRefundUrlInput");
const footerFbUrlInput = document.getElementById("footerFbUrlInput");
const footerTwitterUrlInput = document.getElementById("footerTwitterUrlInput");
const footerInstaUrlInput = document.getElementById("footerInstaUrlInput");
const footerYoutubeUrlInput = document.getElementById("footerYoutubeUrlInput");

// Asset Settings Elements
const signatureUpload = document.getElementById("signatureUpload");
const defaultPhotoUpload = document.getElementById("defaultPhotoUpload");
const saveAssetSettingsBtn = document.getElementById("saveAssetSettingsBtn");
const currentSignaturePreview = document.getElementById("currentSignaturePreview");
const currentDefaultPhotoPreview = document.getElementById("currentDefaultPhotoPreview");

// Super Admin: Admin Management Elements
const addNewAdminForm = document.getElementById("addNewAdminForm");
const newAdminName = document.getElementById("newAdminName");
const newAdminEmail = document.getElementById("newAdminEmail");
const newAdminRole = document.getElementById("newAdminRole");
const newAdminPasscode = document.getElementById("newAdminPasscode");
const newAdminPhone = document.getElementById("newAdminPhone");
const generatePasscodeBtn = document.getElementById("generatePasscodeBtn");
const refreshAdminsBtn = document.getElementById("refreshAdminsBtn");
const adminsTableBody = document.getElementById("adminsTableBody");

// Super Admin: ID Card Studio Elements
const layoutPresetGrid = document.getElementById("layoutPresetGrid");
const colorSwatches = document.getElementById("colorSwatches");
const studioCustomColor = document.getElementById("studioCustomColor");
const studioCustomHexText = document.getElementById("studioCustomHexText");
const toggleBloodGroup = document.getElementById("toggleBloodGroup");
const toggleFatherName = document.getElementById("toggleFatherName");
const toggleDob = document.getElementById("toggleDob");
const toggleAddress = document.getElementById("toggleAddress");
const toggleQrCode = document.getElementById("toggleQrCode");
const toggleIssueDate = document.getElementById("toggleIssueDate");
const toggleSignatory = document.getElementById("toggleSignatory");
const saveLayoutSettingsBtn = document.getElementById("saveLayoutSettingsBtn");
const resetLayoutSettingsBtn = document.getElementById("resetLayoutSettingsBtn");
const studioLiveCardPreviewContainer = document.getElementById("studioLiveCardPreviewContainer");

// Detail Modal Elements
const detailModal = document.getElementById("detailModal");
const detailModalTitle = document.getElementById("detailModalTitle");
const detailModalBody = document.getElementById("detailModalBody");
const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");

const sidebarToggle = document.getElementById("sidebarToggle");
const sidebar = document.querySelector(".sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

// ========================================
// STATE MANAGEMENT
// ========================================

let dashboardState = {
    members: [],
    admins: [],
    assetSettings: null,
    orgSettings: null,
    layoutSettings: { ...DEFAULT_LAYOUT_CONFIG },
    currentUser: null,
    isSuperAdmin: false
};

// ========================================
// AUTH VERIFICATION
// ========================================

watchAuth(async (user) => {
    if (!user) {
        location.href = "admin-login.html";
        return;
    }
    const adminCheck = await isAdmin(user.uid, user);
    if (!adminCheck) {
        location.href = "admin-login.html";
        return;
    }
    const superAdminCheck = await isSuperAdmin(user.uid, user);
    dashboardState.currentUser = user;
    dashboardState.isSuperAdmin = superAdminCheck;

    initializeDashboard(user);
});

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", async () => {
        try {
            await logout();
            location.href = "admin-login.html";
        } catch (err) {
            console.error("Logout error:", err);
        }
    });
}

async function fetchDashboardData() {
    try {
        const [members, assetSettings, orgSettings, layoutSettings, admins] = await Promise.all([
            getCollection(COLLECTIONS.MEMBERS),
            getDocument(COLLECTIONS.SETTINGS, "assets").catch(() => null),
            getDocument(COLLECTIONS.SETTINGS, "organization").catch(() => null),
            getDocument(COLLECTIONS.SETTINGS, "idCardLayout").catch(() => null),
            fetchAllAdmins().catch(() => [])
        ]);

        dashboardState.members = members || [];
        dashboardState.assetSettings = assetSettings || null;
        dashboardState.orgSettings = orgSettings || null;
        dashboardState.layoutSettings = layoutSettings ? { ...DEFAULT_LAYOUT_CONFIG, ...layoutSettings } : { ...DEFAULT_LAYOUT_CONFIG };
        dashboardState.admins = admins || [];
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        throw err;
    }
}

// ========================================
// INITIALIZE DASHBOARD
// ========================================

async function initializeDashboard(user) {
    try {
        if (dashboardLoader) dashboardLoader.style.display = "block";
        
        const roleBadge = dashboardState.isSuperAdmin
            ? `<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.8rem; margin-left: 8px;">👑 Super Admin</span>`
            : `<span style="background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; margin-left: 8px;">🛡️ Admin</span>`;

        if (adminInfo) {
            adminInfo.innerHTML = `Welcome, ${escapeHtml(user.email || "Administrator")} ${roleBadge}`;
        }

        await fetchDashboardData();

        await Promise.all([
            loadStatistics(),
            loadPendingMembers(),
            loadApprovedMembers(),
            loadOrgSettings(),
            loadFooterSettingsForm(),
            loadAssetSettings(),
            loadAdminsTable(),
            loadIdCardStudio()
        ]);
    } catch (error) {
        console.error("Dashboard initialization error:", error);
        showError("Failed to load dashboard data");
    } finally {
        if (dashboardLoader) dashboardLoader.style.display = "none";
    }
}

// ========================================
// STATISTICS
// ========================================

async function loadStatistics() {
    const members = dashboardState.members;

    const pendingMembers = members.filter(
        (m) => m.status === MEMBER_STATUS.PENDING
    );

    const approvedMembers = members.filter(
        (m) => m.status === MEMBER_STATUS.APPROVED && m.active !== false && m.active !== "false"
    );

    setText("totalMembers", approvedMembers.length);
    setText("pendingApprovals", pendingMembers.length);
    setText("activeMembersCount", approvedMembers.length);
}

// ========================================
// APPLICANT SCREENING (PENDING QUEUE)
// ========================================

async function loadPendingMembers() {
    if (!memberApprovalsTableBody) return;

    const members = dashboardState.members;
    const pendingMembers = members.filter(
        (m) => m.status === MEMBER_STATUS.PENDING
    );

    if (pendingMembers.length === 0) {
        memberApprovalsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #64748b; padding: 25px;">
                    ✅ No pending applications in queue
                </td>
            </tr>
        `;
        return;
    }

    memberApprovalsTableBody.innerHTML = pendingMembers
        .map((member) => {
            const photoSrc = member.photoUrl || "images/default-user.jpg";
            return `
                <tr>
                    <td style="font-weight: 600;">${escapeHtml(member.fullName || "-")}</td>
                    <td>
                        <img src="${photoSrc}" alt="Photo" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1;" />
                    </td>
                    <td>${escapeHtml(member.mobile || "-")}</td>
                    <td>${escapeHtml(member.email || "-")}</td>
                    <td>
                        <span class="member-type-badge ${member.memberType === 'active-member' ? 'badge-active' : 'badge-member'}">
                            ${getMemberTypeTamil(member.memberType)}
                        </span>
                    </td>
                    <td>
                        <span class="badge-pending">${getMemberStatusTamil(member.status)}</span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <button
                                class="btn-inspect view-pending-member"
                                data-id="${member.id}"
                                title="Inspect applicant details and government ID"
                            >
                                👁️ Review
                            </button>
                            <button
                                class="btn-approve approve-member"
                                data-id="${member.id}"
                                title="Approve member and generate membership ID"
                            >
                                ✅ Approve
                            </button>
                            <button
                                class="btn-reject reject-member"
                                data-id="${member.id}"
                                title="Reject application"
                            >
                                ❌ Reject
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
}

// ========================================
// MEMBER DIRECTORY & ID CARDS
// ========================================

async function loadApprovedMembers(searchFilter = "") {
    if (!membersTableBody) return;

    let members = dashboardState.members.filter(
        (m) => m.status === MEMBER_STATUS.APPROVED
    );

    if (searchFilter) {
        const query = searchFilter.toLowerCase().trim();
        members = members.filter(
            (m) =>
                m.fullName?.toLowerCase().includes(query) ||
                m.memberNumber?.toLowerCase().includes(query) ||
                m.mobile?.includes(query) ||
                m.bloodGroup?.toLowerCase().includes(query) ||
                m.email?.toLowerCase().includes(query)
        );
    }

    if (members.length === 0) {
        membersTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #64748b; padding: 25px;">
                    ${searchFilter ? "No matching members found" : "No approved members in registry yet"}
                </td>
            </tr>
        `;
        return;
    }

    membersTableBody.innerHTML = members
        .map((member) => {
            const photoSrc = member.photoUrl || "images/default-user.jpg";
            return `
                <tr>
                    <td style="font-weight: 700; font-family: monospace; color: #2563eb;">
                        ${escapeHtml(member.memberNumber || "Pending")}
                    </td>
                    <td style="font-weight: 600;">${escapeHtml(member.fullName || "-")}</td>
                    <td>
                        <img src="${photoSrc}" alt="Photo" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1;" />
                    </td>
                    <td style="font-weight: 700; color: #dc2626;">${escapeHtml(member.bloodGroup || "-")}</td>
                    <td>${escapeHtml(member.mobile || "-")}</td>
                    <td>
                        <span class="member-type-badge ${member.memberType === 'active-member' ? 'badge-active' : 'badge-member'}">
                            ${getMemberTypeTamil(member.memberType)}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
                            <button
                                type="button"
                                class="btn-edit-member-preview"
                                data-id="${member.id}"
                                style="background-color: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;"
                                title="Edit profile data with real-time live ID preview"
                            >
                                ✏️ Edit & Preview
                            </button>
                            <a
                                href="id-card-template.html?memberId=${member.id}"
                                target="_blank"
                                class="btn-download-id"
                                style="background-color: #0F2B5C;"
                                title="Open Digital ID Card Studio"
                            >
                                🪪 ID Card
                            </a>
                            <a
                                href="appointment-letter-template.html?memberId=${member.id}"
                                target="_blank"
                                class="btn-download-id"
                                style="background-color: #138808;"
                                title="Issue Appointment Letter"
                            >
                                🎖️ Letter
                            </a>
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <button
                                class="btn-inspect view-approved-member"
                                data-id="${member.id}"
                                title="View full profile"
                            >
                                👁️ Profile
                            </button>
                            <button
                                class="btn-reject delete-member"
                                data-id="${member.id}"
                                style="background: #ef4444;"
                                title="Delete member account"
                            >
                                🗑️ Remove
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
}

// Search Filter Listener
if (memberSearchInput) {
    memberSearchInput.addEventListener("input", (e) => {
        loadApprovedMembers(e.target.value);
    });
}

// Export to CSV
if (exportMembersBtn) {
    exportMembersBtn.addEventListener("click", () => {
        const approved = dashboardState.members.filter(
            (m) => m.status === MEMBER_STATUS.APPROVED
        );

        if (approved.length === 0) {
            showWarning("No approved members available to export.");
            return;
        }

        const headers = ["Member ID", "Full Name", "Father Name", "DOB", "Gender", "Blood Group", "Mobile", "Email", "Occupation", "Address", "Member Type", "Approved Date"];
        const rows = approved.map((m) => [
            `"${m.memberNumber || ""}"`,
            `"${m.fullName || ""}"`,
            `"${m.fatherName || ""}"`,
            `"${m.dob || ""}"`,
            `"${m.gender || ""}"`,
            `"${m.bloodGroup || ""}"`,
            `"${m.mobile || ""}"`,
            `"${m.email || ""}"`,
            `"${m.occupation || ""}"`,
            `"${(m.address || "").replace(/"/g, '""')}"`,
            `"${m.memberType || ""}"`,
            `"${m.approvedAt ? formatDate(m.approvedAt) : ""}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Member_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess("Member registry exported to CSV successfully!");
    });
}

// Clear All Old Members
if (clearAllOldMembersBtn) {
    clearAllOldMembersBtn.addEventListener("click", async () => {
        const confirmClear = confirm(
            "⚠️ CLEAR ALL TEST/OLD MEMBERS:\n\nAre you sure you want to clear all existing member registrations to start fresh with new records?\n\nThis action cannot be undone."
        );

        if (!confirmClear) return;

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const deletePromises = dashboardState.members.map((m) =>
                deleteDocument(COLLECTIONS.MEMBERS, m.id)
            );
            await Promise.all(deletePromises);
            showSuccess("All old member records cleared successfully!");
            await fetchDashboardData();
            await loadStatistics();
            await loadPendingMembers();
            await loadApprovedMembers();
        } catch (err) {
            console.error("Clear members error:", err);
            showError("Failed to clear old members.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

// ========================================
// APPROVAL & REJECTION ACTIONS
// ========================================

document.addEventListener("click", async (e) => {
    // Approve Member
    if (e.target.classList.contains("approve-member") || e.target.closest(".approve-member")) {
        const btn = e.target.classList.contains("approve-member") ? e.target : e.target.closest(".approve-member");
        const memberId = btn.dataset.id;
        const member = dashboardState.members.find((m) => m.id === memberId);
        if (!member) return;

        const confirmApprove = confirm(`Approve membership for "${member.fullName}" and generate official Member ID?`);
        if (!confirmApprove) return;

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const memberNumber = await generateMemberNumber();

            await updateDocument(COLLECTIONS.MEMBERS, memberId, {
                status: MEMBER_STATUS.APPROVED,
                memberNumber: memberNumber,
                approvedAt: serverTimestamp(),
                active: true
            });

            // Send notification
            try {
                await sendMemberStatusNotification(member, "approved", memberNumber);
            } catch (notifyErr) {
                console.warn("Notification error non-fatal:", notifyErr);
            }

            showSuccess(`Member ${member.fullName} approved! Member ID: ${memberNumber}`);
            await fetchDashboardData();
            await loadStatistics();
            await loadPendingMembers();
            await loadApprovedMembers();
        } catch (err) {
            console.error("Approval error:", err);
            showError("Failed to approve member.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    }

    // Reject Member
    if (e.target.classList.contains("reject-member") || e.target.closest(".reject-member")) {
        const btn = e.target.classList.contains("reject-member") ? e.target : e.target.closest(".reject-member");
        const memberId = btn.dataset.id;
        const member = dashboardState.members.find((m) => m.id === memberId);
        if (!member) return;

        const confirmReject = confirm(`Are you sure you want to reject the application for "${member.fullName}"?`);
        if (!confirmReject) return;

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            await updateDocument(COLLECTIONS.MEMBERS, memberId, {
                status: MEMBER_STATUS.REJECTED,
                rejectedAt: serverTimestamp(),
                active: false
            });

            try {
                await sendMemberStatusNotification(member, "rejected");
            } catch (notifyErr) {
                console.warn("Notification non-fatal:", notifyErr);
            }

            showSuccess(`Application for ${member.fullName} has been rejected.`);
            await fetchDashboardData();
            await loadStatistics();
            await loadPendingMembers();
            await loadApprovedMembers();
        } catch (err) {
            console.error("Rejection error:", err);
            showError("Failed to reject application.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    }

    // Delete Member
    if (e.target.classList.contains("delete-member") || e.target.closest(".delete-member")) {
        const btn = e.target.classList.contains("delete-member") ? e.target : e.target.closest(".delete-member");
        const memberId = btn.dataset.id;
        const member = dashboardState.members.find((m) => m.id === memberId);
        if (!member) return;

        const confirmDel = confirm(`Permanently remove member "${member.fullName}" (${member.memberNumber || "No ID"})?`);
        if (!confirmDel) return;

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            await deleteDocument(COLLECTIONS.MEMBERS, memberId);
            showSuccess(`Member ${member.fullName} removed.`);
            await fetchDashboardData();
            await loadStatistics();
            await loadPendingMembers();
            await loadApprovedMembers();
        } catch (err) {
            console.error("Delete error:", err);
            showError("Failed to delete member.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    }

    // Inspect Details (Pending or Approved)
    if (
        e.target.classList.contains("view-pending-member") ||
        e.target.closest(".view-pending-member") ||
        e.target.classList.contains("view-approved-member") ||
        e.target.closest(".view-approved-member")
    ) {
        const btn = e.target.closest("button");
        const memberId = btn.dataset.id;
        const member = dashboardState.members.find((m) => m.id === memberId);
        if (!member) return;

        showDetailModal(`Member Profile: ${member.fullName}`, [
            { label: "Full Name", value: member.fullName },
            { label: "Father's Name", value: member.fatherName },
            { label: "Date of Birth", value: member.dob ? formatDate(member.dob) : "-" },
            { label: "Gender", value: member.gender },
            { label: "Blood Group", value: member.bloodGroup },
            { label: "Mobile Number", value: member.mobile },
            { label: "Email Address", value: member.email },
            { label: "Occupation", value: member.occupation },
            { label: "Residential Address", value: member.address },
            { label: "Membership Category", value: getMemberTypeTamil(member.memberType) },
            { label: "Application Status", value: getMemberStatusTamil(member.status) },
            { label: "Member ID", value: member.memberNumber || "Not Assigned" },
            { label: "Applicant Photo", value: member.photoUrl || "images/default-user.jpg", isImage: true },
            { label: "Government ID Proof", value: member.governmentProofUrl || member.governmentProofPath, isGovProof: true }
        ]);
    }
});

// ========================================
// ORGANIZATION SETTINGS
// ========================================

async function loadOrgSettings() {
    const settings = dashboardState.orgSettings;
    const assets = dashboardState.assetSettings;

    if (portalTitleInput) portalTitleInput.value = settings?.portalTitle || "Member & ID Card Portal";
    if (portalSubtitleInput) portalSubtitleInput.value = settings?.portalSubtitle || "Digital Member Management & Verification System";
    if (portalLogoUrlInput) portalLogoUrlInput.value = settings?.logoUrl || assets?.logoUrl || "";

    const activeLogoUrl = settings?.logoUrl || assets?.logoUrl || "images/logo.jpg";
    if (currentLogoPreview) {
        currentLogoPreview.innerHTML = `
            <img src="${activeLogoUrl}" alt="Logo Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='images/logo.jpg'" />
        `;
    }

    if (!settings) return;

    if (orgNameInput) orgNameInput.value = settings.orgName || "";
    if (orgTaglineInput) orgTaglineInput.value = settings.tagline || "";
    if (orgPhoneInput) orgPhoneInput.value = settings.phone || "";
    if (orgEmailInput) orgEmailInput.value = settings.email || "";
    if (orgAddressInput) orgAddressInput.value = settings.address || "";
    if (orgLeaderNameInput) orgLeaderNameInput.value = settings.leaderName || "";
    if (orgLeaderTitleInput) orgLeaderTitleInput.value = settings.leaderTitle || "";
}

if (orgSettingsForm) {
    orgSettingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";

            let logoUrl = portalLogoUrlInput?.value?.trim() || dashboardState.orgSettings?.logoUrl || "";

            // Check if a new logo file was selected
            const logoFile = portalLogoUpload?.files?.[0];
            if (logoFile) {
                try {
                    logoUrl = await uploadMemberPhoto("portal-brand-logo", logoFile);
                } catch (logoErr) {
                    console.warn("Logo upload fallback:", logoErr);
                }
            }

            const payload = {
                portalTitle: portalTitleInput?.value?.trim() || "Member & ID Card Portal",
                portalSubtitle: portalSubtitleInput?.value?.trim() || "Digital Member Management & Verification System",
                logoUrl: logoUrl,
                orgName: orgNameInput?.value?.trim() || "SARDAR VALLABHBHAI PATEL PARTY",
                tagline: orgTaglineInput?.value?.trim() || "Your Voice. Your Strength. Our Commitment.",
                website: "svpparty.co",
                phone: orgPhoneInput?.value?.trim() || "+91 98200 12345",
                email: orgEmailInput?.value?.trim() || "contact@svpparty.co",
                address: orgAddressInput?.value?.trim() || "18 Sardar Patel Marg, New Delhi - 110001",
                leaderName: orgLeaderNameInput?.value?.trim() || "National President",
                leaderTitle: orgLeaderTitleInput?.value?.trim() || "President / General Secretary",
                updatedAt: serverTimestamp()
            };

            await setDocument(COLLECTIONS.SETTINGS, "organization", payload, { merge: true });
            
            // Also sync logoUrl to assets settings if available
            if (logoUrl) {
                await setDocument(COLLECTIONS.SETTINGS, "assets", { logoUrl }, { merge: true });
            }

            showSuccess("Organization & Portal Branding saved successfully!");
            await fetchDashboardData();
            await loadOrgSettings();
            updateStudioLivePreview();
        } catch (err) {
            console.error("Error saving org settings:", err);
            showError("Failed to save organization settings");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

// ========================================
// EDITABLE FOOTER SETTINGS
// ========================================

async function loadFooterSettingsForm() {
    try {
        const settings = await fetchFooterSettings();
        if (footerLogoTopInput) footerLogoTopInput.value = settings.logoTop || "";
        if (footerLogoStarInput) footerLogoStarInput.value = settings.logoStar || "";
        if (footerLogoBottomInput) footerLogoBottomInput.value = settings.logoBottom || "";
        if (footerEmailInput) footerEmailInput.value = settings.email || "";
        if (footerPhoneInput) footerPhoneInput.value = settings.phone || "";
        if (footerAddressInput) footerAddressInput.value = settings.address || "";
        if (footerCopyrightInput) footerCopyrightInput.value = settings.copyright || "";
        if (footerTermsUrlInput) footerTermsUrlInput.value = settings.termsUrl || "#";
        if (footerPrivacyUrlInput) footerPrivacyUrlInput.value = settings.privacyUrl || "#";
        if (footerDisclaimerUrlInput) footerDisclaimerUrlInput.value = settings.disclaimerUrl || "#";
        if (footerRefundUrlInput) footerRefundUrlInput.value = settings.refundUrl || "#";
        if (footerFbUrlInput) footerFbUrlInput.value = settings.fbUrl || "#";
        if (footerTwitterUrlInput) footerTwitterUrlInput.value = settings.twitterUrl || "#";
        if (footerInstaUrlInput) footerInstaUrlInput.value = settings.instaUrl || "#";
        if (footerYoutubeUrlInput) footerYoutubeUrlInput.value = settings.youtubeUrl || "#";

        applyFooterToPage(settings);
    } catch (err) {
        console.error("Error loading footer settings form:", err);
    }
}

if (footerSettingsForm) {
    footerSettingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const payload = {
                logoTop: footerLogoTopInput?.value?.trim() || DEFAULT_FOOTER_SETTINGS.logoTop,
                logoStar: footerLogoStarInput?.value?.trim() || DEFAULT_FOOTER_SETTINGS.logoStar,
                logoBottom: footerLogoBottomInput?.value?.trim() || DEFAULT_FOOTER_SETTINGS.logoBottom,
                email: footerEmailInput?.value?.trim() || DEFAULT_FOOTER_SETTINGS.email,
                phone: footerPhoneInput?.value?.trim() || DEFAULT_FOOTER_SETTINGS.phone,
                address: footerAddressInput?.value?.trim() || DEFAULT_FOOTER_SETTINGS.address,
                copyright: footerCopyrightInput?.value?.trim() || DEFAULT_FOOTER_SETTINGS.copyright,
                termsUrl: footerTermsUrlInput?.value?.trim() || "#",
                privacyUrl: footerPrivacyUrlInput?.value?.trim() || "#",
                disclaimerUrl: footerDisclaimerUrlInput?.value?.trim() || "#",
                refundUrl: footerRefundUrlInput?.value?.trim() || "#",
                fbUrl: footerFbUrlInput?.value?.trim() || "#",
                twitterUrl: footerTwitterUrlInput?.value?.trim() || "#",
                instaUrl: footerInstaUrlInput?.value?.trim() || "#",
                youtubeUrl: footerYoutubeUrlInput?.value?.trim() || "#",
                updatedAt: serverTimestamp()
            };

            await setDocument(COLLECTIONS.SETTINGS, "footer", payload, { merge: true });
            try {
                localStorage.setItem("app_footer_settings", JSON.stringify(payload));
            } catch (e) {}

            applyFooterToPage(payload);
            showSuccess("Footer settings saved successfully!");
        } catch (err) {
            console.error("Error saving footer settings:", err);
            showError("Failed to save footer settings");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

// ========================================
// ASSET SETTINGS (SIGNATURE & DEFAULT PHOTO)
// ========================================

async function loadAssetSettings() {
    const settings = dashboardState.assetSettings;

    if (currentSignaturePreview) {
        if (settings?.founderSignatureUrl) {
            currentSignaturePreview.innerHTML = `
                <img src="${settings.founderSignatureUrl}" alt="Signature Preview" style="max-height: 55px; border: 1px solid #cbd5e1; padding: 4px; border-radius: 4px; background: white;" />
            `;
        } else {
            currentSignaturePreview.innerHTML = `<span style="color: #64748b; font-size: 0.85rem;">Using default official signature</span>`;
        }
    }

    if (currentDefaultPhotoPreview) {
        if (settings?.defaultPhotoUrl) {
            currentDefaultPhotoPreview.innerHTML = `
                <img src="${settings.defaultPhotoUrl}" alt="Default Photo" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1;" />
            `;
        } else {
            currentDefaultPhotoPreview.innerHTML = `<span style="color: #64748b; font-size: 0.85rem;">Using default placeholder photo</span>`;
        }
    }
}

if (saveAssetSettingsBtn) {
    saveAssetSettingsBtn.addEventListener("click", async () => {
        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const updatePayload = {};

            const sigFile = signatureUpload?.files?.[0];
            if (sigFile) {
                const sigUrl = await uploadSignature(sigFile);
                updatePayload.founderSignatureUrl = sigUrl;
            }

            const photoFile = defaultPhotoUpload?.files?.[0];
            if (photoFile) {
                const photoUrl = await uploadMemberPhoto("default-asset", photoFile);
                updatePayload.defaultPhotoUrl = photoUrl;
            }

            if (Object.keys(updatePayload).length > 0) {
                await setDocument(COLLECTIONS.SETTINGS, "assets", updatePayload, { merge: true });
                showSuccess("Asset settings saved successfully!");
                await fetchDashboardData();
                await loadAssetSettings();
                updateStudioLivePreview();
            } else {
                showWarning("No new image files selected");
            }
        } catch (err) {
            console.error("Error saving asset settings:", err);
            showError("Failed to save asset settings");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

// ========================================
// SUPER ADMIN: ADMIN MANAGEMENT
// ========================================

async function loadAdminsTable() {
    if (!adminsTableBody) return;

    const admins = dashboardState.admins;

    if (admins.length === 0) {
        adminsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">
                    No administrators listed.
                </td>
            </tr>
        `;
        return;
    }

    adminsTableBody.innerHTML = admins
        .map((admin) => {
            const isSuper = admin.role === "superadmin";
            const roleBadge = isSuper
                ? `<span style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.78rem;">👑 Super Admin</span>`
                : `<span style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.78rem;">🛡️ Admin</span>`;

            const statusBadge = admin.active !== false
                ? `<span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.78rem;">Active</span>`
                : `<span style="background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.78rem;">Inactive</span>`;

            const isPrimary = admin.isPrimary || admin.id === "default-super-admin" || admin.email === "earthin199@gmail.com";

            return `
                <tr>
                    <td>
                        <strong style="color: #0f172a; display: block;">${escapeHtml(admin.name || "Administrator")}</strong>
                        <span style="font-size: 0.8rem; color: #64748b;">${escapeHtml(admin.phone || "No phone listed")}</span>
                    </td>
                    <td style="font-weight: 600; color: #334155;">${escapeHtml(admin.email || "-")}</td>
                    <td>${roleBadge}</td>
                    <td>
                        <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85rem; font-weight: bold; color: #0f172a;">
                            ${escapeHtml(admin.passcode || "admin123")}
                        </code>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        ${
                            isPrimary
                                ? `<span style="font-size: 0.78rem; color: #94a3b8; font-style: italic;">Primary Master</span>`
                                : `
                                <div style="display: flex; gap: 6px;">
                                    <button class="toggle-admin-btn" data-id="${admin.id}" data-active="${admin.active !== false}" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                                        ${admin.active !== false ? "Disable" : "Enable"}
                                    </button>
                                    <button class="delete-admin-btn" data-id="${admin.id}" style="background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                                        Delete
                                    </button>
                                </div>
                                `
                        }
                    </td>
                </tr>
            `;
        })
        .join("");
}

// Generate Random Passcode Helper
if (generatePasscodeBtn) {
    generatePasscodeBtn.addEventListener("click", () => {
        const rand = Math.floor(1000 + Math.random() * 9000);
        if (newAdminPasscode) newAdminPasscode.value = `admin${rand}`;
    });
}

// Add New Admin Form Submit
if (addNewAdminForm) {
    addNewAdminForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!dashboardState.isSuperAdmin) {
            showWarning("Only Super Administrators can create admin accounts.");
            return;
        }

        const name = newAdminName?.value?.trim();
        const email = newAdminEmail?.value?.trim().toLowerCase();
        const role = newAdminRole?.value || "admin";
        const passcode = newAdminPasscode?.value?.trim() || "admin123";
        const phone = newAdminPhone?.value?.trim() || "";

        if (!name || !email) {
            showWarning("Please provide Administrator Name and Email.");
            return;
        }

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            await createAdminAccount({ name, email, role, passcode, phone });
            showSuccess(`Administrator account for "${name}" created successfully!`);
            addNewAdminForm.reset();
            if (newAdminPasscode) newAdminPasscode.value = "admin123";
            await fetchDashboardData();
            await loadAdminsTable();
        } catch (err) {
            console.error("Create admin error:", err);
            showError("Failed to create administrator account.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

// Refresh Admins Button
if (refreshAdminsBtn) {
    refreshAdminsBtn.addEventListener("click", async () => {
        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            await fetchDashboardData();
            await loadAdminsTable();
            showSuccess("Administrator list refreshed.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

// Admin Action Buttons (Toggle status / Delete)
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-admin-btn") || e.target.closest(".delete-admin-btn")) {
        const btn = e.target.closest("button");
        const adminId = btn.dataset.id;
        if (!adminId) return;

        if (!dashboardState.isSuperAdmin) {
            showWarning("Only Super Administrators can delete admin accounts.");
            return;
        }

        const confirmDel = confirm("Are you sure you want to permanently remove this administrator account?");
        if (!confirmDel) return;

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            await removeAdminAccount(adminId);
            showSuccess("Administrator removed successfully.");
            await fetchDashboardData();
            await loadAdminsTable();
        } catch (err) {
            console.error("Delete admin error:", err);
            showError("Failed to remove administrator account.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    }

    if (e.target.classList.contains("toggle-admin-btn") || e.target.closest(".toggle-admin-btn")) {
        const btn = e.target.closest("button");
        const adminId = btn.dataset.id;
        const currentActive = btn.dataset.active === "true";
        if (!adminId) return;

        if (!dashboardState.isSuperAdmin) {
            showWarning("Only Super Administrators can change admin status.");
            return;
        }

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            await toggleAdminStatus(adminId, !currentActive);
            showSuccess(`Admin status updated to ${!currentActive ? "Active" : "Inactive"}.`);
            await fetchDashboardData();
            await loadAdminsTable();
        } catch (err) {
            console.error("Toggle admin status error:", err);
            showError("Failed to update admin status.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    }
});

// ========================================
// SUPER ADMIN: ID CARD LAYOUT STUDIO
// ========================================

const useCustomTemplateCheckbox = document.getElementById("useCustomTemplateCheckbox");
const frontBgFileInput = document.getElementById("frontBgFileInput");
const backBgFileInput = document.getElementById("backBgFileInput");
const frontBgStatus = document.getElementById("frontBgStatus");
const backBgStatus = document.getElementById("backBgStatus");
const btnSideFront = document.getElementById("btnSideFront");
const btnSideBack = document.getElementById("btnSideBack");
const shortcodePalette = document.getElementById("shortcodePalette");
const interactiveCardCanvas = document.getElementById("interactiveCardCanvas");
const canvasSideBadge = document.getElementById("canvasSideBadge");
const elementInspectorBox = document.getElementById("elementInspectorBox");
const inspectorTagLabel = document.getElementById("inspectorTagLabel");
const btnDeleteSelectedElement = document.getElementById("btnDeleteSelectedElement");
const btnDuplicateElement = document.getElementById("btnDuplicateElement");
const inspectorPosX = document.getElementById("inspectorPosX");
const inspectorPosY = document.getElementById("inspectorPosY");
const inspectorFontSize = document.getElementById("inspectorFontSize");
const inspectorFontWeight = document.getElementById("inspectorFontWeight");
const inspectorColor = document.getElementById("inspectorColor");
const inspectorColorHex = document.getElementById("inspectorColorHex");
const inspectorMediaSizeBlock = document.getElementById("inspectorMediaSizeBlock");
const inspectorDimensionsLabel = document.getElementById("inspectorDimensionsLabel");
const inspectorWidth = document.getElementById("inspectorWidth");
const inspectorHeight = document.getElementById("inspectorHeight");
const inspectorBorderRadius = document.getElementById("inspectorBorderRadius");
const inspectorQuickSizePresets = document.getElementById("inspectorQuickSizePresets");
const selectedCoordinatesHint = document.getElementById("selectedCoordinatesHint");
const cardOrientationSelector = document.getElementById("cardOrientationSelector");

// Canvas Zoom Controls
const btnZoomIn = document.getElementById("btnZoomIn");
const btnZoomOut = document.getElementById("btnZoomOut");
const btnZoomReset = document.getElementById("btnZoomReset");
const canvasZoomLabel = document.getElementById("canvasZoomLabel");

// Live Preview Controls
const studioPreviewMemberSelect = document.getElementById("studioPreviewMemberSelect");
const btnPreviewModeBoth = document.getElementById("btnPreviewModeBoth");
const btnPreviewModeFront = document.getElementById("btnPreviewModeFront");
const btnPreviewModeBack = document.getElementById("btnPreviewModeBack");
const btnPreviewModeFlip = document.getElementById("btnPreviewModeFlip");
const btnStudioTestPng = document.getElementById("btnStudioTestPng");
const btnStudioTestPdf = document.getElementById("btnStudioTestPdf");
const btnStudioTestPrint = document.getElementById("btnStudioTestPrint");

// Canvas View Mode Buttons
const btnCanvasViewRealistic = document.getElementById("btnCanvasViewRealistic");
const btnCanvasViewTags = document.getElementById("btnCanvasViewTags");

let studioCanvasZoom = 1.0;
let studioPreviewMode = "both"; // "both" | "front" | "back" | "3d-flip"
let studioCanvasRenderMode = "realistic"; // "realistic" | "tags"

let studioState = {
    orientation: "vertical", // "vertical" | "horizontal"
    activeCanvasSide: "front", // "front" | "back"
    selectedElementId: null,
    useCustomTemplate: false,
    frontBgUrl: "",
    backBgUrl: "",
    frontElements: [],
    backElements: []
};

// Canvas View Mode Toggle Listeners
if (btnCanvasViewRealistic) {
    btnCanvasViewRealistic.addEventListener("click", () => {
        studioCanvasRenderMode = "realistic";
        btnCanvasViewRealistic.classList.add("active");
        btnCanvasViewRealistic.style.background = "#2563eb";
        btnCanvasViewRealistic.style.color = "white";
        if (btnCanvasViewTags) {
            btnCanvasViewTags.classList.remove("active");
            btnCanvasViewTags.style.background = "transparent";
            btnCanvasViewTags.style.color = "#94a3b8";
        }
        renderInteractiveCanvas();
    });
}

if (btnCanvasViewTags) {
    btnCanvasViewTags.addEventListener("click", () => {
        studioCanvasRenderMode = "tags";
        btnCanvasViewTags.classList.add("active");
        btnCanvasViewTags.style.background = "#2563eb";
        btnCanvasViewTags.style.color = "white";
        if (btnCanvasViewRealistic) {
            btnCanvasViewRealistic.classList.remove("active");
            btnCanvasViewRealistic.style.background = "transparent";
            btnCanvasViewRealistic.style.color = "#94a3b8";
        }
        renderInteractiveCanvas();
    });
}

// Canvas Zoom Helpers
function setCanvasZoom(newZoom) {
    studioCanvasZoom = Math.min(1.8, Math.max(0.6, parseFloat(newZoom.toFixed(2))));
    if (interactiveCardCanvas) {
        interactiveCardCanvas.style.transform = `scale(${studioCanvasZoom})`;
    }
    if (canvasZoomLabel) {
        canvasZoomLabel.textContent = `${Math.round(studioCanvasZoom * 100)}%`;
    }
}

if (btnZoomIn) {
    btnZoomIn.addEventListener("click", () => setCanvasZoom(studioCanvasZoom + 0.15));
}
if (btnZoomOut) {
    btnZoomOut.addEventListener("click", () => setCanvasZoom(studioCanvasZoom - 0.15));
}
if (btnZoomReset) {
    btnZoomReset.addEventListener("click", () => setCanvasZoom(1.0));
}

function setStudioOrientationUI(orientation = "vertical") {
    studioState.orientation = orientation;

    if (cardOrientationSelector) {
        cardOrientationSelector.querySelectorAll(".orientation-choice-card").forEach((card) => {
            const cardOri = card.dataset.orientation;
            const badge = card.querySelector(".active-badge");
            if (cardOri === orientation) {
                card.classList.add("active");
                card.style.borderColor = "#0F2B5C";
                card.style.background = "#eff6ff";
                if (badge) badge.style.display = "inline-block";
            } else {
                card.classList.remove("active");
                card.style.borderColor = "#e2e8f0";
                card.style.background = "white";
                if (badge) badge.style.display = "none";
            }
        });
    }

    // Adjust interactive canvas dimensions based on orientation
    if (interactiveCardCanvas) {
        if (orientation === "horizontal") {
            interactiveCardCanvas.style.width = "340px";
            interactiveCardCanvas.style.height = "214px";
        } else {
            interactiveCardCanvas.style.width = "240px";
            interactiveCardCanvas.style.height = "370px";
        }
    }
}

function loadIdCardStudio() {
    const config = dashboardState.layoutSettings || DEFAULT_LAYOUT_CONFIG;
    const initialOrientation = config.orientation || config.cardOrientation || (config.preset === "svpp-horizontal" || config.preset === "horizontal" ? "horizontal" : "vertical");

    setStudioOrientationUI(initialOrientation);

    studioState.useCustomTemplate = config.useCustomTemplate || config.preset === "custom";
    studioState.frontBgUrl = config.frontBgUrl || "";
    studioState.backBgUrl = config.backBgUrl || "";
    studioState.frontElements = Array.isArray(config.frontElements) && config.frontElements.length
        ? JSON.parse(JSON.stringify(config.frontElements))
        : JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG.frontElements));
    studioState.backElements = Array.isArray(config.backElements) && config.backElements.length
        ? JSON.parse(JSON.stringify(config.backElements))
        : JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG.backElements));

    if (useCustomTemplateCheckbox) {
        useCustomTemplateCheckbox.checked = studioState.useCustomTemplate;
    }

    if (frontBgStatus) {
        frontBgStatus.style.display = studioState.frontBgUrl ? "block" : "none";
    }
    if (backBgStatus) {
        backBgStatus.style.display = studioState.backBgUrl ? "block" : "none";
    }

    // Set Preset active card
    if (layoutPresetGrid) {
        const cards = layoutPresetGrid.querySelectorAll(".layout-preset-card");
        cards.forEach((card) => {
            if (card.dataset.preset === config.preset) {
                card.classList.add("active");
                card.style.borderColor = "#2563eb";
                card.style.background = "#eff6ff";
            } else {
                card.classList.remove("active");
                card.style.borderColor = "#e2e8f0";
                card.style.background = "#ffffff";
            }
        });
    }

    // Set Color
    if (studioCustomColor) studioCustomColor.value = config.primaryColor || "#2563eb";
    if (studioCustomHexText) studioCustomHexText.value = config.primaryColor || "#2563eb";

    // Set Color Swatch active state
    if (colorSwatches) {
        const swatches = colorSwatches.querySelectorAll(".color-swatch");
        swatches.forEach((swatch) => {
            if (swatch.dataset.color.toLowerCase() === (config.primaryColor || "#2563eb").toLowerCase()) {
                swatch.style.borderColor = "#0f172a";
                swatch.style.borderWidth = "3px";
            } else {
                swatch.style.borderColor = "white";
                swatch.style.borderWidth = "2px";
            }
        });
    }

    // Set Checkboxes
    if (toggleBloodGroup) toggleBloodGroup.checked = config.showBloodGroup !== false;
    if (toggleFatherName) toggleFatherName.checked = config.showFatherName !== false;
    if (toggleDob) toggleDob.checked = config.showDob !== false;
    if (toggleAddress) toggleAddress.checked = config.showAddress !== false;
    if (toggleQrCode) toggleQrCode.checked = config.showQrCode !== false;
    if (toggleIssueDate) toggleIssueDate.checked = config.showIssueDate !== false;
    if (toggleSignatory) toggleSignatory.checked = config.showSignatory !== false;

    populateStudioMemberSelect();
    renderShortcodePalette();
    renderInteractiveCanvas();
    updateInspector();
    updateStudioLivePreview();
}

function populateStudioMemberSelect() {
    if (!studioPreviewMemberSelect) return;
    const curVal = studioPreviewMemberSelect.value || "default";

    const approvedMembers = dashboardState.members.filter((m) => m.status === MEMBER_STATUS.APPROVED);
    
    let html = `
        <option value="default">Sample (Rajeshwar Verma)</option>
        <option value="president">Sample (State President)</option>
        <option value="long-name">Sample (Long Name Test)</option>
    `;

    if (approvedMembers.length > 0) {
        html += `<optgroup label="Real Approved Members">`;
        approvedMembers.slice(0, 15).forEach((m) => {
            html += `<option value="member-${m.id}">${escapeHtml(m.fullName)} (${m.memberNumber || "Approved"})</option>`;
        });
        html += `</optgroup>`;
    }

    studioPreviewMemberSelect.innerHTML = html;
    studioPreviewMemberSelect.value = curVal;
}

function renderShortcodePalette() {
    if (!shortcodePalette) return;

    shortcodePalette.innerHTML = AVAILABLE_SHORTCODES.map((sc) => `
        <button type="button" class="btn-add-shortcode" data-tag="${sc.tag}" style="background: white; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: #1e293b; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s;" title="Add ${sc.label} tag to canvas">
            <span>${sc.icon || "🏷️"}</span>
            <span>${sc.label}</span>
            <span style="color: #2563eb; font-weight: 800; font-size: 0.7rem;">+</span>
        </button>
    `).join("");

    shortcodePalette.querySelectorAll(".btn-add-shortcode").forEach((btn) => {
        btn.addEventListener("click", () => {
            const tag = btn.dataset.tag;
            addShortcodeToCanvas(tag);
        });
    });
}

function addShortcodeToCanvas(tag) {
    const sc = AVAILABLE_SHORTCODES.find((s) => s.tag === tag);
    if (!sc) return;

    const newEl = {
        id: "el-" + Date.now(),
        tag: sc.tag,
        label: sc.label,
        x: 30,
        y: 35,
        fontSize: sc.isMedia ? undefined : 12,
        fontWeight: sc.isMedia ? undefined : "600",
        color: sc.isMedia ? undefined : "#0f172a",
        width: sc.tag === "{photo}" ? 88 : (sc.tag === "{qrCode}" ? 55 : (sc.tag === "{signature}" ? 110 : undefined)),
        height: sc.tag === "{photo}" ? 110 : (sc.tag === "{qrCode}" ? 55 : (sc.tag === "{signature}" ? 38 : undefined)),
        borderRadius: sc.tag === "{photo}" ? 8 : (sc.tag === "{qrCode}" ? 6 : undefined)
    };

    if (studioState.activeCanvasSide === "front") {
        studioState.frontElements.push(newEl);
    } else {
        studioState.backElements.push(newEl);
    }

    studioState.selectedElementId = newEl.id;
    renderInteractiveCanvas();
    updateInspector();
    updateStudioLivePreview();
}

function renderInteractiveCanvas() {
    if (!interactiveCardCanvas) return;

    const bgUrl = studioState.activeCanvasSide === "back" ? studioState.backBgUrl : studioState.frontBgUrl;
    const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;

    if (bgUrl) {
        interactiveCardCanvas.style.backgroundImage = `url('${bgUrl}')`;
        interactiveCardCanvas.style.backgroundSize = "cover";
        interactiveCardCanvas.style.backgroundPosition = "center";
        interactiveCardCanvas.style.border = "2px solid #2563eb";
    } else {
        interactiveCardCanvas.style.backgroundImage = "none";
        interactiveCardCanvas.style.background = "#ffffff";
        interactiveCardCanvas.style.border = "2px dashed #94a3b8";
    }

    const sampleMember = getStudioSampleMember();
    const shortcodeCtx = buildShortcodeContext(sampleMember, dashboardState.orgSettings);

    interactiveCardCanvas.innerHTML = elements.map((el) => {
        const isSelected = el.id === studioState.selectedElementId;
        const scDef = AVAILABLE_SHORTCODES.find((s) => s.tag === el.tag) || {};

        const isMedia = el.tag === "{photo}" || el.tag === "{qrCode}" || el.tag === "{signature}";
        let resizeHandleHTML = "";

        if (isSelected) {
            resizeHandleHTML = `
                <div class="resize-corner-handle" data-id="${el.id}" title="Drag corner to change size" style="position: absolute; right: -6px; bottom: -6px; width: 15px; height: 15px; background: #2563eb; border: 2.5px solid #ffffff; border-radius: 50%; cursor: nwse-resize; z-index: 30; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
                    <div style="width: 4px; height: 4px; background: white; border-radius: 50%;"></div>
                </div>
            `;
        }

        if (isMedia) {
            const w = el.width || (el.tag === "{photo}" ? 88 : (el.tag === "{signature}" ? 110 : 55));
            const h = el.height || (el.tag === "{photo}" ? 110 : (el.tag === "{signature}" ? 38 : 55));
            const r = el.borderRadius !== undefined ? `${el.borderRadius}px` : (el.tag === "{photo}" ? "8px" : "4px");

            let content = "";

            if (studioCanvasRenderMode === "realistic") {
                if (el.tag === "{photo}") {
                    const photoSrc = shortcodeCtx.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=380&fit=crop&crop=face";
                    content = `
                        <div style="width: 100%; height: 100%; position: relative; border-radius: ${r}; overflow: hidden; background: #e2e8f0; pointer-events: none;">
                            <img src="${photoSrc}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=380&fit=crop&crop=face'" />
                            <span style="position: absolute; bottom: 2px; right: 2px; font-size: 0.52rem; background: rgba(15,23,42,0.75); color: #fff; padding: 1px 4px; border-radius: 3px; font-family: monospace; line-height: 1;">${w}×${h}</span>
                        </div>
                    `;
                } else if (el.tag === "{qrCode}") {
                    const qrSrc = shortcodeCtx.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortcodeCtx.verificationUrl || "https://svpp.org")}`;
                    content = `
                        <div style="width: 100%; height: 100%; position: relative; border-radius: ${r}; overflow: hidden; background: #ffffff; padding: 2px; box-sizing: border-box; pointer-events: none; display: flex; align-items: center; justify-content: center;">
                            <img src="${qrSrc}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
                            <span style="position: absolute; bottom: 1px; right: 1px; font-size: 0.5rem; background: rgba(15,23,42,0.75); color: #fff; padding: 1px 3px; border-radius: 2px; font-family: monospace; line-height: 1;">${w}×${h}</span>
                        </div>
                    `;
                } else if (el.tag === "{signature}") {
                    const sigSrc = shortcodeCtx.signatureUrl || "https://upload.wikimedia.org/wikipedia/commons/f/f8/Signature_sample.svg";
                    content = `
                        <div style="width: 100%; height: 100%; position: relative; border-radius: ${r}; overflow: hidden; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; pointer-events: none;">
                            <img src="${sigSrc}" alt="Signature" style="max-width: 95%; max-height: 90%; object-fit: contain; display: block;" />
                            <span style="position: absolute; bottom: 1px; right: 1px; font-size: 0.5rem; background: rgba(15,23,42,0.75); color: #fff; padding: 1px 3px; border-radius: 2px; font-family: monospace; line-height: 1;">${w}×${h}</span>
                        </div>
                    `;
                }
            } else {
                // Tag mode
                if (el.tag === "{photo}") {
                    content = `
                        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #e0f2fe; border: 1.5px solid #0284c7; border-radius: ${r}; overflow: hidden; pointer-events: none;">
                            <span style="font-size: 1.1rem;">👤</span>
                            <span style="font-size: 0.62rem; font-weight: 800; color: #0369a1; text-transform: uppercase;">PHOTO</span>
                            <span style="font-size: 0.55rem; color: #0284c7; font-family: monospace;">${w}×${h}</span>
                        </div>
                    `;
                } else if (el.tag === "{qrCode}") {
                    content = `
                        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; border: 1.5px solid #64748b; border-radius: ${r}; overflow: hidden; pointer-events: none;">
                            <span style="font-size: 1.1rem;">🔳</span>
                            <span style="font-size: 0.55rem; font-weight: 800; color: #334155; text-transform: uppercase;">QR CODE</span>
                            <span style="font-size: 0.52rem; color: #64748b; font-family: monospace;">${w}×${h}</span>
                        </div>
                    `;
                } else if (el.tag === "{signature}") {
                    content = `
                        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fefce8; border: 1.5px solid #ca8a04; border-radius: ${r}; overflow: hidden; pointer-events: none;">
                            <span style="font-size: 0.9rem;">✍️</span>
                            <span style="font-size: 0.58rem; font-weight: 800; color: #854d0e; text-transform: uppercase;">SIGNATURE</span>
                            <span style="font-size: 0.52rem; color: #ca8a04; font-family: monospace;">${w}×${h}</span>
                        </div>
                    `;
                }
            }

            const styleStr = `
                position: absolute;
                left: ${el.x}%;
                top: ${el.y}%;
                width: ${w}px;
                height: ${h}px;
                cursor: move;
                border: ${isSelected ? '2.5px solid #2563eb' : '1.5px dashed rgba(37,99,235,0.6)'};
                border-radius: ${r};
                box-shadow: ${isSelected ? '0 0 16px rgba(37,99,235,0.8), 0 4px 10px rgba(0,0,0,0.2)' : '0 2px 5px rgba(0,0,0,0.1)'};
                z-index: ${isSelected ? 25 : 5};
                touch-action: none;
                box-sizing: border-box;
            `;

            return `<div class="draggable-canvas-item draggable-media-item" data-id="${el.id}" style="${styleStr}">${content}${resizeHandleHTML}</div>`;
        }

        // Text element rendering
        let textValue = replaceShortcodes(el.label || el.tag, shortcodeCtx);
        if (studioCanvasRenderMode === "tags") {
            textValue = `${scDef.icon || "🏷️"} ${el.label || el.tag}`;
        }

        const styleStr = `
            position: absolute;
            left: ${el.x}%;
            top: ${el.y}%;
            font-size: ${el.fontSize || 12}px;
            font-weight: ${el.fontWeight || '600'};
            color: ${el.color || '#0f172a'};
            cursor: move;
            padding: ${studioCanvasRenderMode === 'realistic' ? '1px 3px' : '3px 6px'};
            border: ${isSelected ? '2px solid #38bdf8' : (studioCanvasRenderMode === 'realistic' ? '1px dashed rgba(56,189,248,0.4)' : '1px dashed rgba(37,99,235,0.5)')};
            background: ${isSelected ? 'rgba(56,189,248,0.35)' : (studioCanvasRenderMode === 'realistic' ? 'transparent' : 'rgba(255,255,255,0.9)')};
            border-radius: 4px;
            box-shadow: ${isSelected ? '0 0 12px rgba(56,189,248,0.9)' : 'none'};
            white-space: nowrap;
            z-index: ${isSelected ? 20 : 3};
            touch-action: none;
            line-height: 1.25;
            user-select: none;
        `;

        return `<div class="draggable-canvas-item" data-id="${el.id}" style="${styleStr}">${textValue}${resizeHandleHTML}</div>`;
    }).join("");

    if (!bgUrl) {
        const emptyMsg = document.createElement("div");
        emptyMsg.style.cssText = "position: absolute; top: 6px; right: 8px; font-size: 0.62rem; color: #64748b; font-weight: 700; pointer-events: none;";
        emptyMsg.textContent = `${studioState.activeCanvasSide.toUpperCase()} CANVAS (No Image)`;
        interactiveCardCanvas.appendChild(emptyMsg);
    }

    // Attach Drag & Resize Listeners
    interactiveCardCanvas.querySelectorAll(".draggable-canvas-item").forEach((itemEl) => {
        itemEl.addEventListener("mousedown", (e) => {
            if (e.target.classList.contains("resize-corner-handle") || e.target.closest(".resize-corner-handle")) return;
            startDragging(e, itemEl);
        });
        itemEl.addEventListener("touchstart", (e) => {
            if (e.target.classList.contains("resize-corner-handle") || e.target.closest(".resize-corner-handle")) return;
            startDragging(e, itemEl);
        }, { passive: false });
    });

    interactiveCardCanvas.querySelectorAll(".resize-corner-handle").forEach((handle) => {
        handle.addEventListener("mousedown", (e) => startResizing(e, handle));
        handle.addEventListener("touchstart", (e) => startResizing(e, handle), { passive: false });
    });
}

function startResizing(e, handleEl) {
    e.preventDefault();
    e.stopPropagation();

    const id = handleEl.dataset.id;
    const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
    const targetEl = elements.find((el) => el.id === id);
    if (!targetEl) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const startW = targetEl.width || (targetEl.tag === "{photo}" ? 88 : (targetEl.tag === "{signature}" ? 110 : 55));
    const startH = targetEl.height || (targetEl.tag === "{photo}" ? 110 : (targetEl.tag === "{signature}" ? 38 : 55));

    function onResizeMove(moveEvent) {
        const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const curY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
        const deltaW = curX - clientX;
        const deltaH = curY - clientY;

        let newW = Math.max(25, Math.min(300, Math.round(startW + deltaW)));
        let newH = Math.max(20, Math.min(300, Math.round(startH + deltaH)));

        targetEl.width = newW;
        targetEl.height = newH;

        if (inspectorWidth) inspectorWidth.value = newW;
        if (inspectorHeight) inspectorHeight.value = newH;
        if (inspectorDimensionsLabel) {
            inspectorDimensionsLabel.textContent = `${newW} × ${newH} px`;
        }

        renderInteractiveCanvas();
        updateStudioLivePreview();
    }

    function onResizeEnd() {
        window.removeEventListener("mousemove", onResizeMove);
        window.removeEventListener("mouseup", onResizeEnd);
        window.removeEventListener("touchmove", onResizeMove);
        window.removeEventListener("touchend", onResizeEnd);
    }

    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("mouseup", onResizeEnd);
    window.addEventListener("touchmove", onResizeMove, { passive: false });
    window.addEventListener("touchend", onResizeEnd);
}

function startDragging(e, itemEl) {
    e.preventDefault();
    e.stopPropagation();

    const id = itemEl.dataset.id;
    studioState.selectedElementId = id;
    renderInteractiveCanvas();
    updateInspector();

    if (!interactiveCardCanvas) return;

    const rect = interactiveCardCanvas.getBoundingClientRect();
    const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
    const targetEl = elements.find((el) => el.id === id);
    if (!targetEl) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const startX = targetEl.x;
    const startY = targetEl.y;

    function onMove(moveEvent) {
        const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const curY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

        const deltaX = ((curX - clientX) / rect.width) * 100;
        const deltaY = ((curY - clientY) / rect.height) * 100;

        let newX = Math.round(Math.max(0, Math.min(85, startX + deltaX)));
        let newY = Math.round(Math.max(0, Math.min(85, startY + deltaY)));

        targetEl.x = newX;
        targetEl.y = newY;

        itemEl.style.left = newX + "%";
        itemEl.style.top = newY + "%";

        if (inspectorPosX) inspectorPosX.value = newX;
        if (inspectorPosY) inspectorPosY.value = newY;
        if (selectedCoordinatesHint) selectedCoordinatesHint.textContent = `X: ${newX}% | Y: ${newY}%`;

        updateStudioLivePreview();
    }

    function onEnd() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onEnd);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onEnd);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
}

// Inspector Controls Updater
function updateInspector() {
    if (!elementInspectorBox) return;

    const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
    const selected = elements.find((el) => el.id === studioState.selectedElementId);

    if (!selected) {
        elementInspectorBox.style.display = "none";
        if (selectedCoordinatesHint) selectedCoordinatesHint.textContent = "";
        return;
    }

    elementInspectorBox.style.display = "block";
    if (inspectorTagLabel) {
        inspectorTagLabel.textContent = `${selected.label || selected.tag} (${selected.tag})`;
    }

    if (inspectorPosX) inspectorPosX.value = selected.x ?? 0;
    if (inspectorPosY) inspectorPosY.value = selected.y ?? 0;
    if (selectedCoordinatesHint) selectedCoordinatesHint.textContent = `Selected: X: ${selected.x}% | Y: ${selected.y}%`;

    const isMedia = selected.tag === "{photo}" || selected.tag === "{qrCode}" || selected.tag === "{signature}";
    const colorGroup = document.getElementById("inspectorColorGroup");
    const fontGroup = document.getElementById("inspectorFontSizeGroup");
    const weightGroup = document.getElementById("inspectorFontWeightGroup");

    if (colorGroup) colorGroup.style.display = isMedia ? "none" : "block";
    if (fontGroup) fontGroup.style.display = isMedia ? "none" : "block";
    if (weightGroup) weightGroup.style.display = isMedia ? "none" : "block";

    if (inspectorFontSize) inspectorFontSize.value = selected.fontSize || 12;
    if (inspectorFontWeight) inspectorFontWeight.value = selected.fontWeight || "600";
    if (inspectorColor) inspectorColor.value = selected.color || "#0f172a";
    if (inspectorColorHex) inspectorColorHex.value = selected.color || "#0f172a";

    // Media Size Controls Configuration
    if (isMedia) {
        if (inspectorMediaSizeBlock) inspectorMediaSizeBlock.style.display = "block";
        const defaultW = selected.tag === "{photo}" ? 88 : (selected.tag === "{signature}" ? 110 : 55);
        const defaultH = selected.tag === "{photo}" ? 110 : (selected.tag === "{signature}" ? 38 : 55);
        const w = selected.width || defaultW;
        const h = selected.height || defaultH;
        const r = selected.borderRadius !== undefined ? selected.borderRadius : (selected.tag === "{photo}" ? 8 : (selected.tag === "{qrCode}" ? 6 : 0));

        if (inspectorWidth) inspectorWidth.value = w;
        if (inspectorHeight) inspectorHeight.value = h;
        if (inspectorBorderRadius) inspectorBorderRadius.value = r;
        if (inspectorDimensionsLabel) inspectorDimensionsLabel.textContent = `${w} × ${h} px`;

        if (inspectorQuickSizePresets) {
            let presets = [];
            if (selected.tag === "{photo}") {
                presets = [
                    { label: "Standard ID (88×110)", w: 88, h: 110, r: 8 },
                    { label: "Compact (75×95)", w: 75, h: 95, r: 6 },
                    { label: "Large (105×135)", w: 105, h: 135, r: 10 },
                    { label: "Square (90×90)", w: 90, h: 90, r: 12 },
                    { label: "Round Avatar (90×90)", w: 90, h: 90, r: 90 }
                ];
            } else if (selected.tag === "{signature}") {
                presets = [
                    { label: "Standard (110×38)", w: 110, h: 38, r: 0 },
                    { label: "Compact (85×30)", w: 85, h: 30, r: 0 },
                    { label: "Large (140×50)", w: 140, h: 50, r: 0 },
                    { label: "Wide Seal (165×55)", w: 165, h: 55, r: 0 }
                ];
            } else if (selected.tag === "{qrCode}") {
                presets = [
                    { label: "Compact (44×44)", w: 44, h: 44, r: 4 },
                    { label: "Standard (55×55)", w: 55, h: 55, r: 6 },
                    { label: "Medium (70×70)", w: 70, h: 70, r: 6 },
                    { label: "Large (88×88)", w: 88, h: 88, r: 8 }
                ];
            }

            inspectorQuickSizePresets.innerHTML = presets.map((p) => `
                <button type="button" class="btn-size-preset" data-w="${p.w}" data-h="${p.h}" data-r="${p.r}" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; cursor: pointer; color: #334155; margin: 2px;">
                    ${p.label}
                </button>
            `).join("");

            inspectorQuickSizePresets.querySelectorAll(".btn-size-preset").forEach((b) => {
                b.addEventListener("click", () => {
                    const nw = parseInt(b.dataset.w, 10);
                    const nh = parseInt(b.dataset.h, 10);
                    const nr = parseInt(b.dataset.r, 10);
                    selected.width = nw;
                    selected.height = nh;
                    selected.borderRadius = nr;
                    if (inspectorWidth) inspectorWidth.value = nw;
                    if (inspectorHeight) inspectorHeight.value = nh;
                    if (inspectorBorderRadius) inspectorBorderRadius.value = nr;
                    if (inspectorDimensionsLabel) inspectorDimensionsLabel.textContent = `${nw} × ${nh} px`;
                    renderInteractiveCanvas();
                    updateStudioLivePreview();
                });
            });
        }
    } else {
        if (inspectorMediaSizeBlock) inspectorMediaSizeBlock.style.display = "none";
    }
}

// Precision coordinate inputs
if (inspectorPosX) {
    inspectorPosX.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val)) return;
        const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
        const selected = elements.find((el) => el.id === studioState.selectedElementId);
        if (selected) {
            selected.x = Math.max(0, Math.min(95, val));
            renderInteractiveCanvas();
            updateStudioLivePreview();
        }
    });
}

if (inspectorPosY) {
    inspectorPosY.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val)) return;
        const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
        const selected = elements.find((el) => el.id === studioState.selectedElementId);
        if (selected) {
            selected.y = Math.max(0, Math.min(95, val));
            renderInteractiveCanvas();
            updateStudioLivePreview();
        }
    });
}

// Quick alignment bar clicks
document.querySelectorAll(".btn-quick-align").forEach((btn) => {
    btn.addEventListener("click", () => {
        const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
        const selected = elements.find((el) => el.id === studioState.selectedElementId);
        if (!selected) return;

        const alignType = btn.dataset.align;
        if (alignType === "left") selected.x = 8;
        if (alignType === "center-h") selected.x = 50;
        if (alignType === "right") selected.x = 80;
        if (alignType === "top") selected.y = 12;
        if (alignType === "center-v") selected.y = 50;
        if (alignType === "bottom") selected.y = 84;

        renderInteractiveCanvas();
        updateInspector();
        updateStudioLivePreview();
    });
});

// Duplicate Selected Tag
if (btnDuplicateElement) {
    btnDuplicateElement.addEventListener("click", () => {
        const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
        const selected = elements.find((el) => el.id === studioState.selectedElementId);
        if (!selected) return;

        const dup = {
            ...selected,
            id: "el-" + Date.now(),
            x: Math.min(85, (selected.x || 0) + 4),
            y: Math.min(85, (selected.y || 0) + 4)
        };

        if (studioState.activeCanvasSide === "front") {
            studioState.frontElements.push(dup);
        } else {
            studioState.backElements.push(dup);
        }

        studioState.selectedElementId = dup.id;
        renderInteractiveCanvas();
        updateInspector();
        updateStudioLivePreview();
        showSuccess("Element duplicated!");
    });
}

// Keyboard Arrow Nudging for Selected Tag
window.addEventListener("keydown", (e) => {
    // Only nudge if not focused on an input/textarea and an element is selected
    const activeTagName = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
    if (activeTagName === "input" || activeTagName === "textarea" || activeTagName === "select") return;

    if (!studioState.selectedElementId) return;

    const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
    const selected = elements.find((el) => el.id === studioState.selectedElementId);
    if (!selected) return;

    const step = e.shiftKey ? 5 : 1;
    let handled = false;

    if (e.key === "ArrowLeft") {
        selected.x = Math.max(0, (selected.x || 0) - step);
        handled = true;
    } else if (e.key === "ArrowRight") {
        selected.x = Math.min(95, (selected.x || 0) + step);
        handled = true;
    } else if (e.key === "ArrowUp") {
        selected.y = Math.max(0, (selected.y || 0) - step);
        handled = true;
    } else if (e.key === "ArrowDown") {
        selected.y = Math.min(95, (selected.y || 0) + step);
        handled = true;
    }

    if (handled) {
        e.preventDefault();
        renderInteractiveCanvas();
        updateInspector();
        updateStudioLivePreview();
    }
});

// Inspector Event Listeners
if (inspectorFontSize) {
    inspectorFontSize.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (!val) return;
        const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
        const selected = elements.find((el) => el.id === studioState.selectedElementId);
        if (selected) {
            selected.fontSize = val;
            renderInteractiveCanvas();
            updateStudioLivePreview();
        }
    });
}

if (inspectorFontWeight) {
    inspectorFontWeight.addEventListener("change", (e) => {
        const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
        const selected = elements.find((el) => el.id === studioState.selectedElementId);
        if (selected) {
            selected.fontWeight = e.target.value;
            renderInteractiveCanvas();
            updateStudioLivePreview();
        }
    });
}

if (inspectorColor) {
    inspectorColor.addEventListener("input", (e) => {
        const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
        const selected = elements.find((el) => el.id === studioState.selectedElementId);
        if (selected) {
            selected.color = e.target.value;
            if (inspectorColorHex) inspectorColorHex.value = e.target.value;
            renderInteractiveCanvas();
            updateStudioLivePreview();
        }
    });
}

if (inspectorColorHex) {
    inspectorColorHex.addEventListener("input", (e) => {
        const hex = e.target.value;
        if (hex.startsWith("#") && hex.length === 7) {
            const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
            const selected = elements.find((el) => el.id === studioState.selectedElementId);
            if (selected) {
                selected.color = hex;
                if (inspectorColor) inspectorColor.value = hex;
                renderInteractiveCanvas();
                updateStudioLivePreview();
            }
        }
    });
}

// Media Sizing Input Event Listeners
if (inspectorWidth) {
    inspectorWidth.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 20) return;
        const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
        const selected = elements.find((el) => el.id === studioState.selectedElementId);
        if (selected) {
            selected.width = val;
            if (inspectorDimensionsLabel) {
                inspectorDimensionsLabel.textContent = `${val} × ${selected.height || val} px`;
            }
            renderInteractiveCanvas();
            updateStudioLivePreview();
        }
    });
}

if (inspectorHeight) {
    inspectorHeight.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 20) return;
        const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
        const selected = elements.find((el) => el.id === studioState.selectedElementId);
        if (selected) {
            selected.height = val;
            if (inspectorDimensionsLabel) {
                inspectorDimensionsLabel.textContent = `${selected.width || val} × ${val} px`;
            }
            renderInteractiveCanvas();
            updateStudioLivePreview();
        }
    });
}

if (inspectorBorderRadius) {
    inspectorBorderRadius.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 0) return;
        const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
        const selected = elements.find((el) => el.id === studioState.selectedElementId);
        if (selected) {
            selected.borderRadius = val;
            renderInteractiveCanvas();
            updateStudioLivePreview();
        }
    });
}

if (btnDeleteSelectedElement) {
    btnDeleteSelectedElement.addEventListener("click", () => {
        if (!studioState.selectedElementId) return;

        if (studioState.activeCanvasSide === "front") {
            studioState.frontElements = studioState.frontElements.filter((el) => el.id !== studioState.selectedElementId);
        } else {
            studioState.backElements = studioState.backElements.filter((el) => el.id !== studioState.selectedElementId);
        }

        studioState.selectedElementId = null;
        renderInteractiveCanvas();
        updateInspector();
        updateStudioLivePreview();
    });
}

// Canvas Side Toggle Buttons
if (btnSideFront) {
    btnSideFront.addEventListener("click", () => {
        studioState.activeCanvasSide = "front";
        btnSideFront.classList.add("active");
        btnSideFront.style.background = "#2563eb";
        btnSideFront.style.color = "white";

        if (btnSideBack) {
            btnSideBack.classList.remove("active");
            btnSideBack.style.background = "white";
            btnSideBack.style.color = "#334155";
        }

        if (canvasSideBadge) canvasSideBadge.textContent = "FRONT CANVAS";
        studioState.selectedElementId = null;
        renderInteractiveCanvas();
        updateInspector();
    });
}

if (btnSideBack) {
    btnSideBack.addEventListener("click", () => {
        studioState.activeCanvasSide = "back";
        btnSideBack.classList.add("active");
        btnSideBack.style.background = "#2563eb";
        btnSideBack.style.color = "white";

        if (btnSideFront) {
            btnSideFront.classList.remove("active");
            btnSideFront.style.background = "white";
            btnSideFront.style.color = "#334155";
        }

        if (canvasSideBadge) canvasSideBadge.textContent = "BACK CANVAS";
        studioState.selectedElementId = null;
        renderInteractiveCanvas();
        updateInspector();
    });
}

// Custom Template Checkbox toggle
if (useCustomTemplateCheckbox) {
    useCustomTemplateCheckbox.addEventListener("change", (e) => {
        studioState.useCustomTemplate = e.target.checked;
        if (e.target.checked) {
            const customCard = layoutPresetGrid?.querySelector('.layout-preset-card[data-preset="custom"]');
            if (customCard) customCard.click();
        }
        updateStudioLivePreview();
    });
}

// File Upload Handlers for Background Images
if (frontBgFileInput) {
    frontBgFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const url = await uploadIdCardTemplateImage("front", file);
            studioState.frontBgUrl = url;
            studioState.useCustomTemplate = true;
            if (useCustomTemplateCheckbox) useCustomTemplateCheckbox.checked = true;
            if (frontBgStatus) frontBgStatus.style.display = "block";

            const customCard = layoutPresetGrid?.querySelector('.layout-preset-card[data-preset="custom"]');
            if (customCard) customCard.click();

            renderInteractiveCanvas();
            updateStudioLivePreview();
            showSuccess("Front background template image uploaded and set!");
        } catch (err) {
            console.error("Front bg upload error:", err);
            showError("Failed to upload front background image.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

if (backBgFileInput) {
    backBgFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const url = await uploadIdCardTemplateImage("back", file);
            studioState.backBgUrl = url;
            studioState.useCustomTemplate = true;
            if (useCustomTemplateCheckbox) useCustomTemplateCheckbox.checked = true;
            if (backBgStatus) backBgStatus.style.display = "block";

            const customCard = layoutPresetGrid?.querySelector('.layout-preset-card[data-preset="custom"]');
            if (customCard) customCard.click();

            renderInteractiveCanvas();
            updateStudioLivePreview();
            showSuccess("Back background template image uploaded and set!");
        } catch (err) {
            console.error("Back bg upload error:", err);
            showError("Failed to upload back background image.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

function getStudioCurrentConfig() {
    const activeOrientationCard = cardOrientationSelector?.querySelector(".orientation-choice-card.active");
    const orientation = activeOrientationCard ? activeOrientationCard.dataset.orientation : (studioState.orientation || "vertical");
    const activePresetCard = layoutPresetGrid?.querySelector(".layout-preset-card.active");
    let preset = activePresetCard ? activePresetCard.dataset.preset : (orientation === "horizontal" ? "svpp-horizontal" : "svpp-vertical");
    const primaryColor = studioCustomHexText?.value?.trim() || studioCustomColor?.value || "#2563eb";
    const useCustom = useCustomTemplateCheckbox ? useCustomTemplateCheckbox.checked : (preset === "custom");

    if (preset === "custom") {
        studioState.useCustomTemplate = true;
    }

    const allElements = [...(studioState.frontElements || []), ...(studioState.backElements || [])];
    const photoEl = allElements.find((el) => el.tag === "{photo}");
    const sigEl = allElements.find((el) => el.tag === "{signature}");
    const qrEl = allElements.find((el) => el.tag === "{qrCode}");

    return {
        orientation: orientation,
        cardOrientation: orientation,
        preset: preset,
        primaryColor: primaryColor,
        headerStyle: "saffron-wave",
        showBloodGroup: toggleBloodGroup ? toggleBloodGroup.checked : true,
        showFatherName: toggleFatherName ? toggleFatherName.checked : true,
        showDob: toggleDob ? toggleDob.checked : true,
        showAddress: toggleAddress ? toggleAddress.checked : true,
        showQrCode: toggleQrCode ? toggleQrCode.checked : true,
        showIssueDate: toggleIssueDate ? toggleIssueDate.checked : true,
        showSignatory: toggleSignatory ? toggleSignatory.checked : true,
        photoWidth: photoEl?.width || dashboardState.layoutConfig?.photoWidth || (orientation === "horizontal" ? 82 : 90),
        photoHeight: photoEl?.height || dashboardState.layoutConfig?.photoHeight || (orientation === "horizontal" ? 102 : 110),
        photoRadius: photoEl?.borderRadius !== undefined ? photoEl.borderRadius : (dashboardState.layoutConfig?.photoRadius ?? 8),
        signatureWidth: sigEl?.width || dashboardState.layoutConfig?.signatureWidth || 120,
        signatureHeight: sigEl?.height || dashboardState.layoutConfig?.signatureHeight || 34,
        qrCodeSize: qrEl?.width || dashboardState.layoutConfig?.qrCodeSize || (orientation === "horizontal" ? 44 : 48),
        useCustomTemplate: useCustom || studioState.useCustomTemplate,
        frontBgUrl: studioState.frontBgUrl || "",
        backBgUrl: studioState.backBgUrl || "",
        frontElements: studioState.frontElements || [],
        backElements: studioState.backElements || []
    };
}

function getStudioSelectedMemberData() {
    const selectedKey = studioPreviewMemberSelect ? studioPreviewMemberSelect.value : "default";

    if (selectedKey.startsWith("member-")) {
        const memId = selectedKey.replace("member-", "");
        const found = dashboardState.members.find((m) => m.id === memId);
        if (found) return found;
    }

    if (selectedKey === "president") {
        return {
            fullName: "Dr. Arvind V. Patel",
            fatherName: "Shri Vallabhdas Patel",
            dob: "1972-04-14",
            memberNumber: "SVPP-PRES-0001",
            designation: "National President & Working Committee Head",
            bloodGroup: "B+",
            mobile: "+91 94250 99881",
            email: "president@svpparty.co",
            address: "Sardar Patel Bhawan, 14 Constitution Avenue, New Delhi - 110001",
            memberType: "office-bearer",
            status: "approved",
            approvedAt: new Date()
        };
    }

    if (selectedKey === "long-name") {
        return {
            fullName: "Thiru K. S. Somasundaram Balasubramaniam",
            fatherName: "Thiru Somasundaram Pillai",
            dob: "1988-12-05",
            memberNumber: "SVPP-2026-8821",
            designation: "State Organization & Public Outreach Secretary",
            bloodGroup: "AB+",
            mobile: "+91 98401 77654",
            email: "somu.balasubramaniam@svpparty.co",
            address: "No. 42/B, Anna Salai West, T. Nagar, Chennai, Tamil Nadu - 600017",
            memberType: "active-member",
            status: "approved",
            approvedAt: new Date()
        };
    }

    // Default Sample
    return {
        fullName: "Shri Rajeshwar Verma",
        fatherName: "Late Ramakant Verma",
        dob: "1984-10-31",
        memberNumber: "SVPP-2026-9041",
        designation: "State Executive Member",
        bloodGroup: "O+",
        mobile: "+91 98201 54321",
        email: "rajeshwar.verma@svpparty.co",
        address: "House 108, Sardar Vallabhbhai Patel Marg, Lucknow, UP - 226001",
        memberType: "active-member",
        status: "approved",
        approvedAt: new Date()
    };
}

function updateStudioLivePreview() {
    if (!studioLiveCardPreviewContainer) return;

    const currentConfig = getStudioCurrentConfig();
    const memberData = getStudioSelectedMemberData();

    studioLiveCardPreviewContainer.innerHTML = buildIdCardHTML(
        memberData,
        dashboardState.orgSettings,
        dashboardState.assetSettings,
        currentConfig,
        studioPreviewMode
    );
}

// Live Preview Mode Switcher Buttons
function setPreviewModeUI(mode) {
    studioPreviewMode = mode;
    document.querySelectorAll(".preview-mode-pill").forEach((btn) => {
        if (btn.dataset.mode === mode) {
            btn.classList.add("active");
            btn.style.background = "#0F2B5C";
            btn.style.color = "white";
        } else {
            btn.classList.remove("active");
            btn.style.background = "transparent";
            btn.style.color = "#475569";
        }
    });
    updateStudioLivePreview();
}

if (btnPreviewModeBoth) btnPreviewModeBoth.addEventListener("click", () => setPreviewModeUI("both"));
if (btnPreviewModeFront) btnPreviewModeFront.addEventListener("click", () => setPreviewModeUI("front"));
if (btnPreviewModeBack) btnPreviewModeBack.addEventListener("click", () => setPreviewModeUI("back"));
if (btnPreviewModeFlip) btnPreviewModeFlip.addEventListener("click", () => setPreviewModeUI("3d-flip"));

if (studioPreviewMemberSelect) {
    studioPreviewMemberSelect.addEventListener("change", updateStudioLivePreview);
}

// Test Export Actions in Layout Studio
if (btnStudioTestPng) {
    btnStudioTestPng.addEventListener("click", async () => {
        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const target = studioLiveCardPreviewContainer.querySelector(".id-card-double-wrapper") || studioLiveCardPreviewContainer.querySelector(".member-id-card") || studioLiveCardPreviewContainer;
            
            if (!window.html2canvas) {
                showWarning("Canvas generator is loading, please try again in a moment.");
                return;
            }

            const canvas = await window.html2canvas(target, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
            const link = document.createElement("a");
            link.download = `SVPP-ID-Preview-${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            showSuccess("High-Resolution ID Card PNG downloaded!");
        } catch (err) {
            console.error("Test PNG export error:", err);
            showError("Failed to export preview PNG.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

if (btnStudioTestPdf) {
    btnStudioTestPdf.addEventListener("click", async () => {
        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const target = studioLiveCardPreviewContainer.querySelector(".id-card-double-wrapper") || studioLiveCardPreviewContainer.querySelector(".member-id-card") || studioLiveCardPreviewContainer;

            if (!window.html2canvas || !window.jspdf) {
                showWarning("PDF export library loading, please try in a moment.");
                return;
            }

            const canvas = await window.html2canvas(target, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL("image/png");

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: studioState.orientation === "horizontal" ? "landscape" : "portrait",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * (pdfWidth - 40)) / imgProps.width;

            pdf.addImage(imgData, "PNG", 20, 20, pdfWidth - 40, imgHeight);
            pdf.save(`SVPP-ID-Card-Preview.pdf`);
            showSuccess("PDF ID Card generated and downloaded!");
        } catch (err) {
            console.error("Test PDF export error:", err);
            showError("Failed to generate PDF.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

if (btnStudioTestPrint) {
    btnStudioTestPrint.addEventListener("click", () => {
        window.print();
    });
}

// Orientation selector click handlers
if (cardOrientationSelector) {
    cardOrientationSelector.addEventListener("click", (e) => {
        const card = e.target.closest(".orientation-choice-card");
        if (!card) return;

        const orientation = card.dataset.orientation || "vertical";
        setStudioOrientationUI(orientation);

        // Synchronize preset card if on default SVPP presets
        if (layoutPresetGrid) {
            const currentActivePreset = layoutPresetGrid.querySelector(".layout-preset-card.active")?.dataset.preset;
            if (orientation === "horizontal" && currentActivePreset === "svpp-vertical") {
                const horizPresetCard = layoutPresetGrid.querySelector('.layout-preset-card[data-preset="svpp-horizontal"]');
                if (horizPresetCard) {
                    layoutPresetGrid.querySelectorAll(".layout-preset-card").forEach((c) => {
                        c.classList.remove("active");
                        c.style.borderColor = "#e2e8f0";
                        c.style.background = "#ffffff";
                    });
                    horizPresetCard.classList.add("active");
                    horizPresetCard.style.borderColor = "#2563eb";
                    horizPresetCard.style.background = "#eff6ff";
                }
            } else if (orientation === "vertical" && currentActivePreset === "svpp-horizontal") {
                const vertPresetCard = layoutPresetGrid.querySelector('.layout-preset-card[data-preset="svpp-vertical"]');
                if (vertPresetCard) {
                    layoutPresetGrid.querySelectorAll(".layout-preset-card").forEach((c) => {
                        c.classList.remove("active");
                        c.style.borderColor = "#e2e8f0";
                        c.style.background = "#ffffff";
                    });
                    vertPresetCard.classList.add("active");
                    vertPresetCard.style.borderColor = "#2563eb";
                    vertPresetCard.style.background = "#eff6ff";
                }
            }
        }

        renderInteractiveCanvas();
        updateStudioLivePreview();
    });
}

// Preset selection clicks
if (layoutPresetGrid) {
    layoutPresetGrid.addEventListener("click", (e) => {
        const card = e.target.closest(".layout-preset-card");
        if (!card) return;

        layoutPresetGrid.querySelectorAll(".layout-preset-card").forEach((c) => {
            c.classList.remove("active");
            c.style.borderColor = "#e2e8f0";
            c.style.background = "#ffffff";
        });

        card.classList.add("active");
        card.style.borderColor = "#2563eb";
        card.style.background = "#eff6ff";

        const preset = card.dataset.preset;
        if (preset === "svpp-horizontal") {
            setStudioOrientationUI("horizontal");
        } else if (preset === "svpp-vertical" || preset === "classic") {
            setStudioOrientationUI("vertical");
        }

        renderInteractiveCanvas();
        updateStudioLivePreview();
    });
}

// Color swatch clicks
if (colorSwatches) {
    colorSwatches.addEventListener("click", (e) => {
        const swatch = e.target.closest(".color-swatch");
        if (!swatch) return;

        const color = swatch.dataset.color;
        if (studioCustomColor) studioCustomColor.value = color;
        if (studioCustomHexText) studioCustomHexText.value = color;

        colorSwatches.querySelectorAll(".color-swatch").forEach((s) => {
            s.style.borderColor = "white";
            s.style.borderWidth = "2px";
        });
        swatch.style.borderColor = "#0f172a";
        swatch.style.borderWidth = "3px";

        updateStudioLivePreview();
    });
}

// Custom color inputs
if (studioCustomColor) {
    studioCustomColor.addEventListener("input", (e) => {
        if (studioCustomHexText) studioCustomHexText.value = e.target.value;
        updateStudioLivePreview();
    });
}

if (studioCustomHexText) {
    studioCustomHexText.addEventListener("input", (e) => {
        if (studioCustomColor && e.target.value.startsWith("#") && e.target.value.length === 7) {
            studioCustomColor.value = e.target.value;
        }
        updateStudioLivePreview();
    });
}

// Checkboxes change
[
    toggleBloodGroup,
    toggleFatherName,
    toggleDob,
    toggleAddress,
    toggleQrCode,
    toggleIssueDate,
    toggleSignatory
].forEach((el) => {
    if (el) {
        el.addEventListener("change", updateStudioLivePreview);
    }
});

// Save Layout Settings Button
if (saveLayoutSettingsBtn) {
    saveLayoutSettingsBtn.addEventListener("click", async () => {
        if (!dashboardState.isSuperAdmin) {
            showWarning("Only Super Administrators can change the ID Card layout.");
            return;
        }

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const config = getStudioCurrentConfig();
            await setDocument(COLLECTIONS.SETTINGS, "idCardLayout", {
                ...config,
                updatedAt: serverTimestamp()
            }, { merge: true });

            dashboardState.layoutSettings = config;
            showSuccess("ID Card Layout configuration saved and applied globally!");
        } catch (err) {
            console.error("Save layout error:", err);
            showError("Failed to save ID Card Layout configuration.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

// Reset Layout Settings Button
if (resetLayoutSettingsBtn) {
    resetLayoutSettingsBtn.addEventListener("click", () => {
        dashboardState.layoutSettings = { ...DEFAULT_LAYOUT_CONFIG };
        loadIdCardStudio();
        showSuccess("Reset ID Card layout controls to defaults.");
    });
}

// ========================================
// MEMBER EDIT & LIVE PREVIEW MODAL
// ========================================

const editMemberPreviewModal = document.getElementById("editMemberPreviewModal");
const closeEditMemberModalBtn = document.getElementById("closeEditMemberModalBtn");
const cancelEditMemberBtn = document.getElementById("cancelEditMemberBtn");
const editMemberForm = document.getElementById("editMemberForm");
const editModalMemberIdBadge = document.getElementById("editModalMemberIdBadge");
const editFormMemberDocId = document.getElementById("editFormMemberDocId");
const editFullName = document.getElementById("editFullName");
const editMemberNumber = document.getElementById("editMemberNumber");
const editDesignation = document.getElementById("editDesignation");
const editMemberType = document.getElementById("editMemberType");
const editFatherName = document.getElementById("editFatherName");
const editBloodGroup = document.getElementById("editBloodGroup");
const editMobile = document.getElementById("editMobile");
const editDob = document.getElementById("editDob");
const editAddress = document.getElementById("editAddress");
const editPhotoFileInput = document.getElementById("editPhotoFileInput");
const editPhotoUrlInput = document.getElementById("editPhotoUrlInput");
const editMemberPhotoThumb = document.getElementById("editMemberPhotoThumb");
const editMemberCardPreviewContainer = document.getElementById("editMemberCardPreviewContainer");

const btnEditPreviewBoth = document.getElementById("btnEditPreviewBoth");
const btnEditPreviewFront = document.getElementById("btnEditPreviewFront");
const btnEditPreviewBack = document.getElementById("btnEditPreviewBack");

const btnEditModalDownloadPng = document.getElementById("btnEditModalDownloadPng");
const btnEditModalDownloadPdf = document.getElementById("btnEditModalDownloadPdf");
const btnEditModalPrint = document.getElementById("btnEditModalPrint");

let editModalPreviewSide = "both";
let activeEditingMember = null;

function getEditModalMemberSnapshot() {
    if (!activeEditingMember) return null;

    return {
        ...activeEditingMember,
        fullName: editFullName?.value?.trim() || activeEditingMember.fullName,
        memberNumber: editMemberNumber?.value?.trim() || activeEditingMember.memberNumber || "SVPP-PENDING",
        designation: editDesignation?.value?.trim() || activeEditingMember.designation || "",
        memberType: editMemberType?.value || activeEditingMember.memberType || "active-member",
        fatherName: editFatherName?.value?.trim() || activeEditingMember.fatherName || "",
        bloodGroup: editBloodGroup?.value || activeEditingMember.bloodGroup || "",
        mobile: editMobile?.value?.trim() || activeEditingMember.mobile || "",
        dob: editDob?.value || activeEditingMember.dob || "",
        address: editAddress?.value?.trim() || activeEditingMember.address || "",
        photoUrl: editPhotoUrlInput?.value?.trim() || activeEditingMember.photoUrl || ""
    };
}

function updateEditMemberLivePreview() {
    if (!editMemberCardPreviewContainer) return;
    const memberData = getEditModalMemberSnapshot();
    if (!memberData) return;

    editMemberCardPreviewContainer.innerHTML = buildIdCardHTML(
        memberData,
        dashboardState.orgSettings,
        dashboardState.assetSettings,
        dashboardState.layoutSettings || DEFAULT_LAYOUT_CONFIG,
        editModalPreviewSide
    );
}

function setEditModalPreviewSide(side) {
    editModalPreviewSide = side;
    [btnEditPreviewBoth, btnEditPreviewFront, btnEditPreviewBack].forEach((btn) => {
        if (!btn) return;
        if (btn.id.toLowerCase().includes(side)) {
            btn.style.background = "#0F2B5C";
            btn.style.color = "white";
            btn.style.border = "none";
        } else {
            btn.style.background = "white";
            btn.style.color = "#334155";
            btn.style.border = "1px solid #cbd5e1";
        }
    });
    updateEditMemberLivePreview();
}

if (btnEditPreviewBoth) btnEditPreviewBoth.addEventListener("click", () => setEditModalPreviewSide("both"));
if (btnEditPreviewFront) btnEditPreviewFront.addEventListener("click", () => setEditModalPreviewSide("front"));
if (btnEditPreviewBack) btnEditPreviewBack.addEventListener("click", () => setEditModalPreviewSide("back"));

function openEditMemberModal(memberId) {
    const member = dashboardState.members.find((m) => m.id === memberId);
    if (!member) {
        showError("Member record not found.");
        return;
    }

    activeEditingMember = JSON.parse(JSON.stringify(member));

    if (editFormMemberDocId) editFormMemberDocId.value = member.id;
    if (editModalMemberIdBadge) editModalMemberIdBadge.textContent = `ID: ${member.memberNumber || member.id}`;
    if (editFullName) editFullName.value = member.fullName || "";
    if (editMemberNumber) editMemberNumber.value = member.memberNumber || "";
    if (editDesignation) editDesignation.value = member.designation || "";
    if (editMemberType) editMemberType.value = member.memberType || "active-member";
    if (editFatherName) editFatherName.value = member.fatherName || "";
    if (editBloodGroup) editBloodGroup.value = member.bloodGroup || "";
    if (editMobile) editMobile.value = member.mobile || "";
    if (editDob) editDob.value = member.dob || "";
    if (editAddress) editAddress.value = member.address || "";
    if (editPhotoUrlInput) editPhotoUrlInput.value = member.photoUrl || "";

    if (editMemberPhotoThumb) {
        editMemberPhotoThumb.innerHTML = `<img src="${member.photoUrl || 'images/default-user.jpg'}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />`;
    }

    setEditModalPreviewSide("both");

    if (editMemberPreviewModal) {
        editMemberPreviewModal.style.display = "flex";
    }
}

function closeEditMemberModal() {
    if (editMemberPreviewModal) {
        editMemberPreviewModal.style.display = "none";
    }
    activeEditingMember = null;
}

if (closeEditMemberModalBtn) closeEditMemberModalBtn.addEventListener("click", closeEditMemberModal);
if (cancelEditMemberBtn) cancelEditMemberBtn.addEventListener("click", closeEditMemberModal);

if (editMemberPreviewModal) {
    editMemberPreviewModal.addEventListener("click", (e) => {
        if (e.target === editMemberPreviewModal) closeEditMemberModal();
    });
}

// Synchronous live updates on input
[
    editFullName,
    editMemberNumber,
    editDesignation,
    editMemberType,
    editFatherName,
    editBloodGroup,
    editMobile,
    editDob,
    editAddress,
    editPhotoUrlInput
].forEach((inputEl) => {
    if (inputEl) {
        inputEl.addEventListener("input", updateEditMemberLivePreview);
        inputEl.addEventListener("change", updateEditMemberLivePreview);
    }
});

// Photo File Input in Edit Modal
if (editPhotoFileInput) {
    editPhotoFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            if (activeEditingMember) {
                activeEditingMember.photoUrl = dataUrl;
            }
            if (editPhotoUrlInput) editPhotoUrlInput.value = dataUrl;
            if (editMemberPhotoThumb) {
                editMemberPhotoThumb.innerHTML = `<img src="${dataUrl}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />`;
            }
            updateEditMemberLivePreview();
        };
        reader.readAsDataURL(file);
    });
}

// Edit Member Form Submit (Save changes to Firestore)
if (editMemberForm) {
    editMemberForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const docId = editFormMemberDocId?.value;
        if (!docId) return;

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";

            let photoUrl = editPhotoUrlInput?.value?.trim() || activeEditingMember?.photoUrl || "";

            // If a new photo file was picked, upload to Firebase Storage if needed
            if (editPhotoFileInput && editPhotoFileInput.files && editPhotoFileInput.files[0]) {
                try {
                    photoUrl = await uploadMemberPhoto(docId, editPhotoFileInput.files[0]);
                } catch (uploadErr) {
                    console.warn("Storage upload fallback:", uploadErr);
                }
            }

            const updatedData = {
                fullName: editFullName.value.trim(),
                memberNumber: editMemberNumber.value.trim(),
                designation: editDesignation.value.trim(),
                memberType: editMemberType.value,
                fatherName: editFatherName.value.trim(),
                bloodGroup: editBloodGroup.value,
                mobile: editMobile.value.trim(),
                dob: editDob.value,
                address: editAddress.value.trim(),
                photoUrl: photoUrl,
                updatedAt: serverTimestamp()
            };

            await updateDocument(COLLECTIONS.MEMBERS, docId, updatedData);

            // Update in-memory state
            const memIndex = dashboardState.members.findIndex((m) => m.id === docId);
            if (memIndex !== -1) {
                dashboardState.members[memIndex] = {
                    ...dashboardState.members[memIndex],
                    ...updatedData
                };
            }

            showSuccess(`Member "${updatedData.fullName}" profile updated successfully!`);
            closeEditMemberModal();
            await loadApprovedMembers();
            populateStudioMemberSelect();
            updateStudioLivePreview();
        } catch (err) {
            console.error("Save member changes error:", err);
            showError("Failed to save member profile changes.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

// Modal Export Actions
if (btnEditModalDownloadPng) {
    btnEditModalDownloadPng.addEventListener("click", async () => {
        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const target = editMemberCardPreviewContainer.querySelector(".id-card-double-wrapper") || editMemberCardPreviewContainer.querySelector(".member-id-card") || editMemberCardPreviewContainer;

            if (!window.html2canvas) {
                showWarning("Canvas generator is loading, please retry in a moment.");
                return;
            }

            const canvas = await window.html2canvas(target, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
            const link = document.createElement("a");
            const memNumber = editMemberNumber?.value || "MEMBER";
            link.download = `${memNumber}-ID-Card.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            showSuccess("High-Resolution ID Card PNG downloaded!");
        } catch (err) {
            console.error("Export PNG error:", err);
            showError("Failed to export PNG.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

if (btnEditModalDownloadPdf) {
    btnEditModalDownloadPdf.addEventListener("click", async () => {
        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";
            const target = editMemberCardPreviewContainer.querySelector(".id-card-double-wrapper") || editMemberCardPreviewContainer.querySelector(".member-id-card") || editMemberCardPreviewContainer;

            if (!window.html2canvas || !window.jspdf) {
                showWarning("PDF generator is loading, please retry in a moment.");
                return;
            }

            const canvas = await window.html2canvas(target, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL("image/png");

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: dashboardState.layoutSettings?.orientation === "horizontal" ? "landscape" : "portrait",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * (pdfWidth - 40)) / imgProps.width;

            pdf.addImage(imgData, "PNG", 20, 20, pdfWidth - 40, imgHeight);
            const memNumber = editMemberNumber?.value || "MEMBER";
            pdf.save(`${memNumber}-ID-Card.pdf`);
            showSuccess("PDF ID Card generated and downloaded!");
        } catch (err) {
            console.error("Export PDF error:", err);
            showError("Failed to export PDF.");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

if (btnEditModalPrint) {
    btnEditModalPrint.addEventListener("click", () => {
        window.print();
    });
}

// Global click delegation for "btn-edit-member-preview"
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-edit-member-preview") || e.target.closest(".btn-edit-member-preview")) {
        const btn = e.target.classList.contains("btn-edit-member-preview") ? e.target : e.target.closest(".btn-edit-member-preview");
        const memberId = btn.dataset.id;
        if (memberId) openEditMemberModal(memberId);
    }
});

// ========================================
// DETAIL MODAL LOGIC
// ========================================

function showDetailModal(title, fields) {
    if (!detailModal || !detailModalBody) return;

    if (detailModalTitle) detailModalTitle.textContent = title;

    detailModalBody.innerHTML = fields
        .map((field) => {
            if (field.isImage) {
                return `
                    <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                        <strong style="color: #475569; display: block; margin-bottom: 6px;">${escapeHtml(field.label)}:</strong>
                        <img src="${field.value}" alt="Preview" class="modal-detail-img" />
                    </div>
                `;
            }

            if (field.isGovProof) {
                if (!field.value) {
                    return `
                        <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                            <strong style="color: #475569; display: block; margin-bottom: 6px;">${escapeHtml(field.label)}:</strong>
                            <span style="color: #94a3b8; font-style: italic;">No government document attached or already purged</span>
                        </div>
                    `;
                }

                return `
                    <div style="padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; margin-top: 8px;">
                        <strong style="color: #1e40af; display: block; margin-bottom: 8px;">🔒 ${escapeHtml(field.label)} (Secure Viewer):</strong>
                        <div style="margin-bottom: 10px;">
                            <img src="${field.value}" alt="Government ID Proof" class="modal-detail-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                            <div style="display: none; color: #475569; font-size: 0.9rem; margin-bottom: 8px;">(PDF / Document file)</div>
                        </div>
                        <a
                            href="${field.value}"
                            target="_blank"
                            rel="noopener noreferrer"
                            style="display: inline-flex; align-items: center; gap: 6px; background: #2563eb; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.9rem;"
                        >
                            🔗 Open Document in Secure Tab
                        </a>
                    </div>
                `;
            }

            return `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; gap: 15px;">
                    <strong style="color: #475569; width: 40%;">${escapeHtml(field.label)}:</strong>
                    <span style="color: #0f172a; width: 60%; word-break: break-word;">${escapeHtml(field.value || "-")}</span>
                </div>
            `;
        })
        .join("");

    detailModal.style.display = "flex";
}

function closeDetailModal() {
    if (detailModal) detailModal.style.display = "none";
}

if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", closeDetailModal);
if (detailModal) {
    detailModal.addEventListener("click", (e) => {
        if (e.target === detailModal) closeDetailModal();
    });
}

// ========================================
// MOBILE SIDEBAR TOGGLE
// ========================================

if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        if (sidebarOverlay) sidebarOverlay.classList.toggle("active");
    });
}

if (sidebarOverlay && sidebar) {
    sidebarOverlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
    });
}

// ========================================
// UTILS
// ========================================

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

