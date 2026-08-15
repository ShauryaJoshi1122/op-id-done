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
                        <a
                            href="id-card-template.html?memberId=${member.id}&download=true"
                            target="_blank"
                            class="btn-download-id"
                            title="Generate and download official PDF ID Card"
                        >
                            🎴 Download ID Card
                        </a>
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
            const payload = {
                orgName: orgNameInput?.value?.trim() || "Official Member Portal",
                tagline: orgTaglineInput?.value?.trim() || "Official Digital Identification Portal",
                phone: orgPhoneInput?.value?.trim() || "",
                email: orgEmailInput?.value?.trim() || "",
                address: orgAddressInput?.value?.trim() || "",
                leaderName: orgLeaderNameInput?.value?.trim() || "Authorized Signatory",
                leaderTitle: orgLeaderTitleInput?.value?.trim() || "President / General Secretary",
                updatedAt: serverTimestamp()
            };

            await setDocument(COLLECTIONS.SETTINGS, "organization", payload, { merge: true });
            showSuccess("Organization profile saved successfully!");
            await fetchDashboardData();
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
const inspectorFontSize = document.getElementById("inspectorFontSize");
const inspectorFontWeight = document.getElementById("inspectorFontWeight");
const inspectorColor = document.getElementById("inspectorColor");

let studioState = {
    activeCanvasSide: "front", // "front" | "back"
    selectedElementId: null,
    useCustomTemplate: false,
    frontBgUrl: "",
    backBgUrl: "",
    frontElements: [],
    backElements: []
};

function loadIdCardStudio() {
    const config = dashboardState.layoutSettings || DEFAULT_LAYOUT_CONFIG;

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

    renderShortcodePalette();
    renderInteractiveCanvas();
    updateInspector();
    updateStudioLivePreview();
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
        width: sc.tag === "{photo}" ? 75 : (sc.tag === "{qrCode}" ? 55 : (sc.tag === "{signature}" ? 80 : undefined)),
        height: sc.tag === "{photo}" ? 95 : (sc.tag === "{qrCode}" ? 55 : (sc.tag === "{signature}" ? 35 : undefined))
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

    interactiveCardCanvas.innerHTML = elements.map((el) => {
        const isSelected = el.id === studioState.selectedElementId;
        const scDef = AVAILABLE_SHORTCODES.find((s) => s.tag === el.tag) || {};

        let content = `${scDef.icon || "🏷️"} ${el.label || el.tag}`;
        if (el.tag === "{photo}") content = `🖼️ Member Photo`;
        if (el.tag === "{qrCode}") content = `🔳 QR Code`;
        if (el.tag === "{signature}") content = `✍️ Signature`;

        const styleStr = `
            position: absolute;
            left: ${el.x}%;
            top: ${el.y}%;
            font-size: ${el.fontSize || 12}px;
            font-weight: ${el.fontWeight || '600'};
            color: ${el.color || '#0f172a'};
            cursor: move;
            padding: 3px 6px;
            border: ${isSelected ? '2px solid #38bdf8' : '1px dashed rgba(37,99,235,0.5)'};
            background: ${isSelected ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.85)'};
            border-radius: 4px;
            box-shadow: ${isSelected ? '0 0 10px rgba(56,189,248,0.8)' : '0 1px 3px rgba(0,0,0,0.1)'};
            white-space: nowrap;
            z-index: ${isSelected ? 10 : 2};
            touch-action: none;
        `;

        return `<div class="draggable-canvas-item" data-id="${el.id}" style="${styleStr}">${content}</div>`;
    }).join("");

    if (!bgUrl) {
        const emptyMsg = document.createElement("div");
        emptyMsg.style.cssText = "position: absolute; top: 6px; right: 8px; font-size: 0.62rem; color: #64748b; font-weight: 700; pointer-events: none;";
        emptyMsg.textContent = `${studioState.activeCanvasSide.toUpperCase()} CANVAS (No Image)`;
        interactiveCardCanvas.appendChild(emptyMsg);
    }

    // Attach Drag Listeners
    interactiveCardCanvas.querySelectorAll(".draggable-canvas-item").forEach((itemEl) => {
        itemEl.addEventListener("mousedown", (e) => startDragging(e, itemEl));
        itemEl.addEventListener("touchstart", (e) => startDragging(e, itemEl), { passive: false });
    });
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

function updateInspector() {
    if (!elementInspectorBox) return;

    const elements = studioState.activeCanvasSide === "back" ? studioState.backElements : studioState.frontElements;
    const selected = elements.find((el) => el.id === studioState.selectedElementId);

    if (!selected) {
        elementInspectorBox.style.display = "none";
        return;
    }

    elementInspectorBox.style.display = "block";
    if (inspectorTagLabel) {
        inspectorTagLabel.textContent = `Tag: ${selected.label || selected.tag} (${selected.tag})`;
    }

    if (inspectorFontSize) inspectorFontSize.value = selected.fontSize || 12;
    if (inspectorFontWeight) inspectorFontWeight.value = selected.fontWeight || "600";
    if (inspectorColor) inspectorColor.value = selected.color || "#0f172a";
}

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
            // Select custom preset card
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

            // Select Custom Preset Card
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

            // Select Custom Preset Card
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
    const activePresetCard = layoutPresetGrid?.querySelector(".layout-preset-card.active");
    let preset = activePresetCard ? activePresetCard.dataset.preset : "modern";
    const primaryColor = studioCustomHexText?.value?.trim() || studioCustomColor?.value || "#2563eb";
    const useCustom = useCustomTemplateCheckbox ? useCustomTemplateCheckbox.checked : (preset === "custom");

    if (preset === "custom") {
        studioState.useCustomTemplate = true;
    }

    return {
        preset: preset,
        primaryColor: primaryColor,
        headerStyle: "gradient",
        showBloodGroup: toggleBloodGroup ? toggleBloodGroup.checked : true,
        showFatherName: toggleFatherName ? toggleFatherName.checked : true,
        showDob: toggleDob ? toggleDob.checked : true,
        showAddress: toggleAddress ? toggleAddress.checked : true,
        showQrCode: toggleQrCode ? toggleQrCode.checked : true,
        showIssueDate: toggleIssueDate ? toggleIssueDate.checked : true,
        showSignatory: toggleSignatory ? toggleSignatory.checked : true,
        useCustomTemplate: useCustom || studioState.useCustomTemplate,
        frontBgUrl: studioState.frontBgUrl || "",
        backBgUrl: studioState.backBgUrl || "",
        frontElements: studioState.frontElements || [],
        backElements: studioState.backElements || []
    };
}

function updateStudioLivePreview() {
    if (!studioLiveCardPreviewContainer) return;

    const currentConfig = getStudioCurrentConfig();

    // Sample member or first approved member for realistic demonstration
    const sampleMember = dashboardState.members.find((m) => m.status === MEMBER_STATUS.APPROVED) || {
        fullName: "Dr. Ananya Natarajan",
        fatherName: "K. Natarajan",
        dob: "1994-06-15",
        memberNumber: "TCT-M-1008",
        bloodGroup: "O+",
        mobile: "+91 98401 23456",
        email: "ananya.n@example.com",
        address: "42 Heritage Road, Central District, Chennai - 600001",
        memberType: "active-member",
        status: "approved",
        approvedAt: new Date()
    };

    studioLiveCardPreviewContainer.innerHTML = buildIdCardHTML(
        sampleMember,
        dashboardState.orgSettings,
        dashboardState.assetSettings,
        currentConfig
    );
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
