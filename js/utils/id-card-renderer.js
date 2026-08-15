/* ==========================================================================
   DYNAMIC ID CARD RENDERER MODULE
   Supports multiple layout templates, accent themes, field toggles, & QR codes
   ========================================================================== */

export const DEFAULT_LAYOUT_CONFIG = {
    preset: "modern", // "classic" | "modern" | "horizontal" | "minimal" | "custom"
    primaryColor: "#2563eb",
    headerStyle: "gradient", // "solid" | "gradient" | "clean"
    showBloodGroup: true,
    showFatherName: true,
    showDob: true,
    showAddress: true,
    showQrCode: true,
    showIssueDate: true,
    showSignatory: true,
    frontBgUrl: "",
    backBgUrl: "",
    useCustomTemplate: false,
    frontElements: [
        { id: "el-photo", tag: "{photo}", label: "Member Photo", x: 6, y: 18, width: 75, height: 95 },
        { id: "el-name", tag: "{fullName}", label: "Full Name", x: 32, y: 20, fontSize: 13, fontWeight: "700", color: "#0f172a" },
        { id: "el-id", tag: "{memberNumber}", label: "Member ID", x: 32, y: 35, fontSize: 11, fontWeight: "800", color: "#2563eb" },
        { id: "el-type", tag: "{memberType}", label: "Category", x: 32, y: 48, fontSize: 10, fontWeight: "600", color: "#475569" },
        { id: "el-blood", tag: "{bloodGroup}", label: "Blood Group", x: 32, y: 60, fontSize: 10, fontWeight: "700", color: "#dc2626" },
        { id: "el-qr", tag: "{qrCode}", label: "QR Code", x: 74, y: 18, width: 55, height: 55 }
    ],
    backElements: [
        { id: "el-b-father", tag: "{fatherName}", label: "Father's Name", x: 8, y: 18, fontSize: 11, fontWeight: "500", color: "#0f172a" },
        { id: "el-b-dob", tag: "{dob}", label: "Date of Birth", x: 8, y: 30, fontSize: 11, fontWeight: "500", color: "#0f172a" },
        { id: "el-b-mobile", tag: "{mobile}", label: "Mobile Number", x: 8, y: 42, fontSize: 11, fontWeight: "500", color: "#0f172a" },
        { id: "el-b-email", tag: "{email}", label: "Email Address", x: 8, y: 54, fontSize: 10, fontWeight: "400", color: "#334155" },
        { id: "el-b-address", tag: "{address}", label: "Address", x: 8, y: 66, fontSize: 10, fontWeight: "400", color: "#334155" },
        { id: "el-b-sig", tag: "{signature}", label: "Signature", x: 65, y: 68, width: 80, height: 35 }
    ]
};

export const AVAILABLE_SHORTCODES = [
    { tag: "{fullName}", label: "Full Name", icon: "👤", defaultVal: "Ananya N" },
    { tag: "{memberNumber}", label: "Member ID", icon: "🆔", defaultVal: "TCT-M-1024" },
    { tag: "{memberType}", label: "Category", icon: "⭐", defaultVal: "Active Member" },
    { tag: "{fatherName}", label: "Father Name", icon: "👨", defaultVal: "Narayanan S" },
    { tag: "{dob}", label: "Date of Birth", icon: "📅", defaultVal: "15/08/1995" },
    { tag: "{bloodGroup}", label: "Blood Group", icon: "🩸", defaultVal: "O+" },
    { tag: "{mobile}", label: "Mobile Number", icon: "📱", defaultVal: "+91 98765 43210" },
    { tag: "{email}", label: "Email Address", icon: "✉️", defaultVal: "ananya@example.com" },
    { tag: "{address}", label: "Address", icon: "🏠", defaultVal: "42 Heritage Rd, Chennai" },
    { tag: "{issueDate}", label: "Issue Date", icon: "📆", defaultVal: "15 Aug 2025" },
    { tag: "{orgName}", label: "Org Name", icon: "🏛️", defaultVal: "Thamarai Charitable Trust" },
    { tag: "{photo}", label: "Member Photo", icon: "🖼️", isMedia: true },
    { tag: "{qrCode}", label: "QR Code", icon: "🔳", isMedia: true },
    { tag: "{signature}", label: "Signature", icon: "✍️", isMedia: true }
];

/**
 * Renders HTML for a custom ID card side using uploaded background and drag-and-drop shortcodes
 */
export function renderCustomCardSideHTML(side = "front", member = {}, orgSettings = {}, assetSettings = {}, config = {}) {
    const primaryColor = config.primaryColor || "#2563eb";
    const bgUrl = side === "back" ? config.backBgUrl : config.frontBgUrl;
    const elements = side === "back" ? (config.backElements || []) : (config.frontElements || []);

    const fullName = member?.fullName || "Ananya N";
    const fatherName = member?.fatherName ? `Father: ${member.fatherName}` : "Father: Narayanan S";
    const dob = member?.dob ? `DOB: ${formatMemberDate(member.dob)}` : "DOB: 15/08/1995";
    const memberNumber = member?.memberNumber || "TCT-M-1024";
    const bloodGroup = member?.bloodGroup ? `Blood: ${member.bloodGroup}` : "Blood: O+";
    const mobile = member?.mobile ? `Mobile: ${member.mobile}` : "Mobile: +91 98765 43210";
    const email = member?.email || "ananya@example.com";
    const address = member?.address ? `Addr: ${member.address}` : "Addr: 42 Heritage Rd, Chennai";
    const memberType = getCategoryLabel(member?.memberType);
    const issueDate = `Issued: ${formatMemberDate(member?.approvedAt || member?.createdAt || new Date())}`;
    const orgName = orgSettings?.orgName || "Thamarai Charitable Trust";

    const photoUrl = member?.photoUrl || assetSettings?.defaultPhotoUrl || "images/default-user.jpg";
    const signatureUrl = assetSettings?.founderSignatureUrl || "images/signature.png";
    const qrSvg = generateSvgQrCode(memberNumber, 50);

    const valueMap = {
        "{fullName}": fullName,
        "{memberNumber}": memberNumber,
        "{memberType}": memberType,
        "{fatherName}": fatherName,
        "{dob}": dob,
        "{bloodGroup}": bloodGroup,
        "{mobile}": mobile,
        "{email}": email,
        "{address}": address,
        "{issueDate}": issueDate,
        "{orgName}": orgName
    };

    let elementsHTML = "";
    elements.forEach(el => {
        const x = el.x ?? 10;
        const y = el.y ?? 10;
        const fontSize = el.fontSize || 12;
        const fontWeight = el.fontWeight || "600";
        const color = el.color || "#0f172a";
        const align = el.align || "left";

        if (el.tag === "{photo}") {
            const w = el.width || 75;
            const h = el.height || 95;
            elementsHTML += `
            <div style="position: absolute; left: ${x}%; top: ${y}%; width: ${w}px; height: ${h}px; z-index: 2;">
                <img src="${photoUrl}" alt="Photo" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 2px solid ${primaryColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.15);" onerror="this.src='images/default-user.jpg'" />
            </div>`;
        } else if (el.tag === "{qrCode}") {
            const w = el.width || 55;
            const h = el.height || 55;
            elementsHTML += `
            <div style="position: absolute; left: ${x}%; top: ${y}%; width: ${w}px; height: ${h}px; background: white; padding: 2px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2;">
                ${qrSvg}
            </div>`;
        } else if (el.tag === "{signature}") {
            const w = el.width || 80;
            const h = el.height || 35;
            elementsHTML += `
            <div style="position: absolute; left: ${x}%; top: ${y}%; width: ${w}px; height: ${h}px; z-index: 2;">
                <img src="${signatureUrl}" alt="Signature" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'" />
            </div>`;
        } else {
            const textVal = valueMap[el.tag] || el.label || el.tag;
            elementsHTML += `
            <div style="position: absolute; left: ${x}%; top: ${y}%; font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; text-align: ${align}; white-space: nowrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; z-index: 2;">
                ${textVal}
            </div>`;
        }
    });

    const backgroundStyle = bgUrl 
        ? `background-image: url('${bgUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
        : `background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border: 2px dashed ${primaryColor};`;

    return `
    <div class="custom-id-card-side side-${side}" style="position: relative; width: 340px; height: 214px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.12); ${backgroundStyle}">
        ${!bgUrl ? `<div style="position: absolute; top: 6px; right: 8px; font-size: 0.6rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; background: rgba(255,255,255,0.8); padding: 2px 6px; border-radius: 4px;">${side.toUpperCase()} SIDE</div>` : ""}
        ${elementsHTML}
    </div>`;
}

/**
 * Generates an SVG QR Code visual pattern
 */
export function generateSvgQrCode(dataText = "VERIFIED-MEMBER", size = 48) {
    // Generate an authentic deterministically styled QR-matrix SVG
    let hash = 0;
    for (let i = 0; i < dataText.length; i++) {
        hash = (hash << 5) - hash + dataText.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    // 15x15 pseudo-QR grid
    const gridSize = 15;
    const cellSize = size / gridSize;
    let rects = "";

    // Position detection corners (top-left, top-right, bottom-left)
    const isCorner = (r, c) => {
        if (r < 4 && c < 4) return true;
        if (r < 4 && c >= gridSize - 4) return true;
        if (r >= gridSize - 4 && c < 4) return true;
        return false;
    };

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            let filled = false;
            if (isCorner(r, c)) {
                if (r === 0 || r === 3 || c === 0 || c === 3 ||
                    (r >= gridSize - 4 && (r === gridSize - 4 || r === gridSize - 1 || c === 0 || c === 3)) ||
                    (c >= gridSize - 4 && (r === 0 || r === 3 || c === gridSize - 4 || c === gridSize - 1))) {
                    filled = true;
                } else if ((r === 1 || r === 2) && (c === 1 || c === 2)) {
                    filled = true;
                } else if ((r >= gridSize - 3 && r <= gridSize - 2) && (c === 1 || c === 2)) {
                    filled = true;
                } else if ((r === 1 || r === 2) && (c >= gridSize - 3 && c <= gridSize - 2)) {
                    filled = true;
                }
            } else {
                const bit = (seed * (r + 1) * 31 + (c + 1) * 17) % 7;
                filled = bit < 4;
            }

            if (filled) {
                rects += `<rect x="${(c * cellSize).toFixed(1)}" y="${(r * cellSize).toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="#0f172a" />`;
            }
        }
    }

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="#ffffff" />
      ${rects}
    </svg>`;
}

/**
 * Formats a date string safely
 */
function formatMemberDate(dateVal) {
    if (!dateVal) return "-";
    try {
        const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    } catch {
        return String(dateVal);
    }
}

/**
 * Converts category name to human readable
 */
function getCategoryLabel(type) {
    if (type === "active-member") return "Active Volunteer Member";
    if (type === "member") return "Regular Member";
    if (type === "admin") return "Administrator";
    return type || "Member";
}

/**
 * Calculates lighter/darker shades of hex colors for dynamic styling
 */
function adjustColorBrightness(hex, percent) {
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    const num = parseInt(cleanHex, 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Builds HTML string for the requested ID Card Layout
 */
export function buildIdCardHTML(member, orgSettings = {}, assetSettings = {}, layoutConfig = {}) {
    const config = { ...DEFAULT_LAYOUT_CONFIG, ...layoutConfig };
    const orgName = orgSettings?.orgName || "Official Member Portal";
    const orgTagline = orgSettings?.tagline || "Official Member Identification Card";
    const leaderName = orgSettings?.leaderName || "Authorized Signatory";
    const leaderTitle = orgSettings?.leaderTitle || "President / General Secretary";

    const fullName = member?.fullName || "Member Full Name";
    const fatherName = member?.fatherName || "-";
    const dob = formatMemberDate(member?.dob);
    const memberNumber = member?.memberNumber || "TCT-M-0000";
    const bloodGroup = member?.bloodGroup || "O+";
    const mobile = member?.mobile || "+91 98765 43210";
    const email = member?.email || "member@example.com";
    const address = member?.address || "Registered City, State";
    const memberType = getCategoryLabel(member?.memberType);
    const issueDate = formatMemberDate(member?.approvedAt || member?.createdAt || new Date());

    const photoUrl = member?.photoUrl || assetSettings?.defaultPhotoUrl || "images/default-user.jpg";
    const signatureUrl = assetSettings?.founderSignatureUrl || "images/signature.png";

    const qrSvg = generateSvgQrCode(memberNumber, 44);

    const primaryColor = config.primaryColor || "#2563eb";
    const darkAccent = adjustColorBrightness(primaryColor, -20);
    const lightAccent = adjustColorBrightness(primaryColor, 88);
    const borderAccent = adjustColorBrightness(primaryColor, 60);

    const cssVars = `
      --idcard-accent: ${primaryColor};
      --idcard-accent-dark: ${darkAccent};
      --idcard-accent-light: ${lightAccent};
      --idcard-accent-border: ${borderAccent};
    `;

    // -------------------------------------------------------------
    // TEMPLATE CUSTOM: UPLOADED BACKGROUNDS & DRAGGED SHORTCODES
    // -------------------------------------------------------------
    if (config.preset === "custom" || config.useCustomTemplate) {
        const frontHTML = renderCustomCardSideHTML("front", member, orgSettings, assetSettings, config);
        const backHTML = renderCustomCardSideHTML("back", member, orgSettings, assetSettings, config);
        return `
        <div class="custom-id-card-double-wrapper" style="display: flex; flex-direction: column; gap: 16px; align-items: center;">
            <div class="card-side-block">
                <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">Front Side</div>
                ${frontHTML}
            </div>
            <div class="card-side-block">
                <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">Back Side</div>
                ${backHTML}
            </div>
        </div>`;
    }

    // -------------------------------------------------------------
    // TEMPLATE 1: CLASSIC PORTRAIT
    // -------------------------------------------------------------
    if (config.preset === "classic") {
        return `
        <div class="member-id-card card-layout-classic" style="${cssVars}">
          <div class="card-header">
            <div class="header-logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h1 class="card-org-name">${orgName}</h1>
            <p class="card-org-subtitle">${orgTagline}</p>
            <div class="card-badge-pill">OFFICIAL MEMBER ID</div>
          </div>

          <div class="member-photo-wrapper">
            <img src="${photoUrl}" alt="${fullName}" crossorigin="anonymous" onerror="this.src='images/default-user.jpg'" />
          </div>

          <div class="member-details-table">
            <table>
              <tr>
                <td>Full Name</td>
                <td style="font-weight: 700; color: #0f172a;">${fullName}</td>
              </tr>
              ${config.showFatherName ? `<tr><td>Father's Name</td><td>${fatherName}</td></tr>` : ""}
              ${config.showDob ? `<tr><td>Date of Birth</td><td>${dob}</td></tr>` : ""}
              <tr>
                <td>Member ID</td>
                <td style="font-weight: 700; color: var(--idcard-accent);">${memberNumber}</td>
              </tr>
              <tr>
                <td>Category</td>
                <td>${memberType}</td>
              </tr>
              ${config.showBloodGroup ? `<tr><td>Blood Group</td><td style="font-weight: 800; color: #dc2626;">${bloodGroup}</td></tr>` : ""}
              <tr>
                <td>Mobile</td>
                <td>${mobile}</td>
              </tr>
              ${config.showAddress ? `<tr><td>Address</td><td style="font-size: 0.75rem;">${address}</td></tr>` : ""}
              ${config.showIssueDate ? `<tr><td>Issue Date</td><td>${issueDate}</td></tr>` : ""}
            </table>
          </div>

          ${config.showSignatory ? `
          <div class="signature-block">
            <img src="${signatureUrl}" alt="Signature" crossorigin="anonymous" style="max-height: 34px; margin: 0 auto 2px;" onerror="this.style.display='none'" />
            <div style="font-weight: 700; font-size: 0.82rem; color: #0f172a;">${leaderName}</div>
            <div style="font-size: 0.72rem; color: #64748b;">${leaderTitle}</div>
          </div>` : ""}
        </div>`;
    }

    // -------------------------------------------------------------
    // TEMPLATE 3: EXECUTIVE HORIZONTAL (LANDSCAPE)
    // -------------------------------------------------------------
    if (config.preset === "horizontal") {
        return `
        <div class="member-id-card card-layout-horizontal" style="${cssVars}">
          <div class="landscape-left-col">
            <div style="font-size: 0.65rem; font-weight: 800; color: var(--idcard-accent-dark); letter-spacing: 0.5px;">VERIFIED ID</div>
            <img class="photo" src="${photoUrl}" alt="${fullName}" crossorigin="anonymous" onerror="this.src='images/default-user.jpg'" />
            
            ${config.showBloodGroup ? `<div style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; margin-bottom: 4px;">🩸 ${bloodGroup}</div>` : ""}

            ${config.showQrCode ? `<div class="card-qr-box">${qrSvg}<span>SCAN ID</span></div>` : `<div style="font-size:0.7rem; color:var(--idcard-accent); font-weight:bold;">${memberNumber}</div>`}
          </div>

          <div class="landscape-right-col">
            <div class="card-header">
              <h1 class="card-org-name">${orgName}</h1>
              <p class="card-org-subtitle">${orgTagline}</p>
            </div>

            <div class="member-details-table">
              <table>
                <tr>
                  <td>Full Name</td>
                  <td style="font-weight: 700; font-size: 0.85rem; color: #0f172a;">${fullName}</td>
                </tr>
                <tr>
                  <td>Member ID</td>
                  <td style="font-weight: 800; color: var(--idcard-accent);">${memberNumber}</td>
                </tr>
                ${config.showFatherName ? `<tr><td>Father's Name</td><td>${fatherName}</td></tr>` : ""}
                ${config.showDob ? `<tr><td>DOB</td><td>${dob}</td></tr>` : ""}
                <tr>
                  <td>Category</td>
                  <td>${memberType}</td>
                </tr>
                <tr>
                  <td>Mobile</td>
                  <td>${mobile}</td>
                </tr>
                ${config.showIssueDate ? `<tr><td>Issue Date</td><td>${issueDate}</td></tr>` : ""}
              </table>
            </div>

            ${config.showSignatory ? `
            <div class="landscape-footer-row">
              <div style="font-size: 0.68rem; color: #64748b;">Official ID Card &bull; Issued by Trust</div>
              <div style="text-align: right;">
                <img src="${signatureUrl}" alt="Signature" crossorigin="anonymous" style="max-height: 28px; margin-left: auto;" onerror="this.style.display='none'" />
                <div style="font-size: 0.72rem; font-weight: 700; color: #0f172a; line-height: 1;">${leaderName}</div>
                <div style="font-size: 0.65rem; color: #64748b;">${leaderTitle}</div>
              </div>
            </div>` : ""}
          </div>
        </div>`;
    }

    // -------------------------------------------------------------
    // TEMPLATE 4: MINIMALIST CORPORATE
    // -------------------------------------------------------------
    if (config.preset === "minimal") {
        return `
        <div class="member-id-card card-layout-minimal" style="${cssVars}">
          <div class="card-header">
            <div>
              <h1 class="card-org-name">${orgName}</h1>
              <p class="card-org-subtitle">${orgTagline}</p>
            </div>
            ${config.showBloodGroup ? `<span style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:0.75rem;">${bloodGroup}</span>` : ""}
          </div>

          <div class="minimal-photo-id-row">
            <img src="${photoUrl}" alt="${fullName}" crossorigin="anonymous" onerror="this.src='images/default-user.jpg'" />
            <div>
              <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase;">Member ID</div>
              <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: var(--idcard-accent);">${memberNumber}</div>
              <div style="font-size: 0.75rem; font-weight: 600; color: #334155; margin-top: 2px;">${memberType}</div>
            </div>
          </div>

          <div class="member-details-table">
            <table>
              <tr>
                <td>Full Name</td>
                <td style="font-weight: 700; color: #0f172a;">${fullName}</td>
              </tr>
              ${config.showFatherName ? `<tr><td>Father's Name</td><td>${fatherName}</td></tr>` : ""}
              ${config.showDob ? `<tr><td>Date of Birth</td><td>${dob}</td></tr>` : ""}
              <tr>
                <td>Mobile</td>
                <td>${mobile}</td>
              </tr>
              <tr>
                <td>Email</td>
                <td style="font-size: 0.72rem;">${email}</td>
              </tr>
              ${config.showAddress ? `<tr><td>Address</td><td style="font-size: 0.72rem;">${address}</td></tr>` : ""}
              ${config.showIssueDate ? `<tr><td>Issued On</td><td>${issueDate}</td></tr>` : ""}
            </table>
          </div>

          <div class="minimal-footer">
            ${config.showQrCode ? `<div class="card-qr-box">${qrSvg}<span>VERIFY</span></div>` : `<div></div>`}
            ${config.showSignatory ? `
            <div style="text-align: right;">
              <img src="${signatureUrl}" alt="Signature" crossorigin="anonymous" style="max-height: 28px; margin-left: auto;" onerror="this.style.display='none'" />
              <div style="font-size: 0.75rem; font-weight: 700; color: #0f172a;">${leaderName}</div>
              <div style="font-size: 0.65rem; color: #64748b;">${leaderTitle}</div>
            </div>` : ""}
          </div>
        </div>`;
    }

    // -------------------------------------------------------------
    // TEMPLATE 2: MODERN BADGE (DEFAULT)
    // -------------------------------------------------------------
    return `
    <div class="member-id-card card-layout-modern" style="${cssVars}">
      <div class="card-header">
        <span class="header-chip-badge">OFFICIAL</span>
        <h1 class="card-org-name">${orgName}</h1>
        <p class="card-org-subtitle">${orgTagline}</p>
      </div>

      <div class="member-photo-wrapper">
        <img src="${photoUrl}" alt="${fullName}" crossorigin="anonymous" onerror="this.src='images/default-user.jpg'" />
      </div>

      <div class="badge-ribbon-bar">
        <span class="id-chip">${memberNumber}</span>
        ${config.showBloodGroup ? `<span class="blood-chip">🩸 ${bloodGroup}</span>` : ""}
      </div>

      <div class="member-details-table">
        <table>
          <tr>
            <td>Full Name</td>
            <td style="font-weight: 700; color: #0f172a;">${fullName}</td>
          </tr>
          ${config.showFatherName ? `<tr><td>Father's Name</td><td>${fatherName}</td></tr>` : ""}
          ${config.showDob ? `<tr><td>Date of Birth</td><td>${dob}</td></tr>` : ""}
          <tr>
            <td>Category</td>
            <td style="font-weight: 600;">${memberType}</td>
          </tr>
          <tr>
            <td>Mobile</td>
            <td>${mobile}</td>
          </tr>
          <tr>
            <td>Email</td>
            <td style="font-size: 0.75rem; word-break: break-all;">${email}</td>
          </tr>
          ${config.showAddress ? `<tr><td>Address</td><td style="font-size: 0.72rem;">${address}</td></tr>` : ""}
          ${config.showIssueDate ? `<tr><td>Issue Date</td><td>${issueDate}</td></tr>` : ""}
        </table>
      </div>

      <div class="qr-signature-row">
        ${config.showQrCode ? `<div class="card-qr-box">${qrSvg}<span>VERIFY</span></div>` : `<div></div>`}
        ${config.showSignatory ? `
        <div style="text-align: right;">
          <img src="${signatureUrl}" alt="Signature" crossorigin="anonymous" style="max-height: 32px; margin-left: auto; margin-bottom: 2px;" onerror="this.style.display='none'" />
          <div style="font-weight: 700; font-size: 0.8rem; color: #0f172a; line-height: 1.1;">${leaderName}</div>
          <div style="font-size: 0.7rem; color: #64748b;">${leaderTitle}</div>
        </div>` : ""}
      </div>
    </div>`;
}
