/* ==========================================================================
   OFFICIAL DIGITAL ID CARD RENDERER MODULE
   SARDAR VALLABHBHAI PATEL PARTY (SVPP)
   Vertical & Horizontal High-DPI Double-Sided ID Card Engine with Live Preview
   ========================================================================== */

import {
    DEFAULT_ORG_SETTINGS,
    PARTY_HEADER_ACCENT,
    PARTY_PRIMARY_BLUE,
    PARTY_ACCENT_GREEN,
    PARTY_WEBSITE,
    PARTY_SLOGAN
} from "./constants.js";

import {
    SHORTCODE_DEFINITIONS,
    buildShortcodeContext,
    replaceShortcodes,
    formatToStandardDate,
    computeValidUpto
} from "./shortcodes.js";

export const AVAILABLE_SHORTCODES = SHORTCODE_DEFINITIONS;

export const DEFAULT_LAYOUT_CONFIG = {
    orientation: "vertical", // "vertical" | "horizontal"
    cardOrientation: "vertical",
    preset: "svpp-vertical", // "svpp-vertical" | "svpp-horizontal" | "classic" | "horizontal" | "minimal" | "custom"
    primaryColor: PARTY_PRIMARY_BLUE,
    accentColor: PARTY_HEADER_ACCENT,
    greenColor: PARTY_ACCENT_GREEN,
    headerStyle: "saffron-wave",
    photoWidth: 90,
    photoHeight: 110,
    photoRadius: 8,
    signatureWidth: 120,
    signatureHeight: 34,
    qrCodeSize: 48,
    showBloodGroup: true,
    showFatherName: true,
    showDob: true,
    showAddress: true,
    showQrCode: true,
    showIssueDate: true,
    showValidUpto: true,
    showDesignation: true,
    showSignatory: true,
    frontBgUrl: "",
    backBgUrl: "",
    useCustomTemplate: false,
    frontElements: [
        { id: "el-photo", tag: "{photo}", label: "Member Photo", x: 7, y: 22, width: 88, height: 110, borderRadius: 8 },
        { id: "el-name", tag: "{fullName}", label: "Full Name", x: 38, y: 22, fontSize: 13, fontWeight: "800", color: "#0F2B5C" },
        { id: "el-id", tag: "{memberNumber}", label: "Member ID", x: 38, y: 35, fontSize: 11, fontWeight: "800", color: "#FF9933" },
        { id: "el-desig", tag: "{designation}", label: "Designation", x: 38, y: 46, fontSize: 10, fontWeight: "700", color: "#166534" },
        { id: "el-join", tag: "{joiningDate}", label: "Joining Date", x: 38, y: 57, fontSize: 9.5, fontWeight: "600", color: "#334155" },
        { id: "el-valid", tag: "{validUpto}", label: "Valid Upto", x: 38, y: 67, fontSize: 9.5, fontWeight: "700", color: "#dc2626" },
        { id: "el-qr", tag: "{qrCode}", label: "QR Code", x: 73, y: 22, width: 55, height: 55 }
    ],
    backElements: [
        { id: "el-b-father", tag: "{fatherName}", label: "Father's Name", x: 8, y: 15, fontSize: 10.5, fontWeight: "600", color: "#0F2B5C" },
        { id: "el-b-dob", tag: "{dob}", label: "Date of Birth", x: 8, y: 25, fontSize: 10.5, fontWeight: "600", color: "#0F2B5C" },
        { id: "el-b-mobile", tag: "{mobile}", label: "Mobile Number", x: 8, y: 35, fontSize: 10.5, fontWeight: "600", color: "#0F2B5C" },
        { id: "el-b-email", tag: "{email}", label: "Email Address", x: 8, y: 45, fontSize: 9.5, fontWeight: "500", color: "#334155" },
        { id: "el-b-address", tag: "{address}", label: "Address", x: 8, y: 55, fontSize: 9.5, fontWeight: "500", color: "#334155" },
        { id: "el-b-sig", tag: "{signature}", label: "Party Seal & Sign", x: 60, y: 68, width: 105, height: 42 }
    ]
};

/**
 * Deterministic SVG QR Matrix Generator
 */
export function generateSvgQrCode(dataText = "SVPP-VERIFIED", size = 48) {
    let hash = 0;
    for (let i = 0; i < dataText.length; i++) {
        hash = (hash << 5) - hash + dataText.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);
    const gridSize = 15;
    const cellSize = size / gridSize;
    let rects = "";

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
                rects += `<rect x="${(c * cellSize).toFixed(1)}" y="${(r * cellSize).toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="#0F2B5C" />`;
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
 * Builds the Official SVPP Vertical Front Side HTML (330px x 510px)
 */
export function renderSvppFrontSideHTML(member = {}, orgSettings = {}, assetSettings = {}, config = {}) {
    const org = { ...DEFAULT_ORG_SETTINGS, ...orgSettings };
    const context = buildShortcodeContext(member, org, config);

    const photoUrl = member?.photoUrl || assetSettings?.defaultPhotoUrl || "images/default-user.jpg";
    const signatureUrl = assetSettings?.founderSignatureUrl || "images/signature.png";
    const qrSize = config.qrCodeSize || 48;
    const qrSvg = generateSvgQrCode(context["{memberNumber}"], qrSize);

    const photoWidth = config.photoWidth || 90;
    const photoHeight = config.photoHeight || 110;
    const photoRadius = config.photoRadius !== undefined ? (typeof config.photoRadius === 'number' ? `${config.photoRadius}px` : config.photoRadius) : "8px";
    const signatureHeight = config.signatureHeight || 34;
    const signatureWidth = config.signatureWidth || 120;

    return `
    <div class="svpp-id-card svpp-card-front svpp-card-vertical" style="position: relative; width: 330px; height: 510px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(15,43,92,0.18); border: 1px solid #e2e8f0; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; justify-content: space-between; user-select: none;">
      
      <!-- Top Tricolor Ribbon -->
      <div style="display: flex; height: 5px; width: 100%; z-index: 10;">
        <div style="flex: 1; background: #FF9933;"></div>
        <div style="flex: 1; background: #FFFFFF;"></div>
        <div style="flex: 1; background: #138808;"></div>
      </div>

      <!-- Saffron SVG Wave Header -->
      <div style="position: relative; background: linear-gradient(135deg, #FF9933 0%, #EA580C 100%); color: #ffffff; padding: 14px 12px 28px; text-align: center; border-bottom-left-radius: 50% 16px; border-bottom-right-radius: 50% 16px; box-shadow: 0 4px 14px rgba(234,88,12,0.3);">
        
        <!-- Circular Devanagari Flag Badge -->
        <div style="display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.95); color: #0F2B5C; padding: 2px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; margin-bottom: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid #FF9933;">
          <span style="margin-right: 4px;">🇮🇳</span> सरदार वल्लभभाई पटेल पार्टी
        </div>

        <div style="font-size: 0.96rem; font-weight: 900; letter-spacing: 0.4px; line-height: 1.15; text-transform: uppercase; color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
          ${org.orgName}
        </div>
        <div style="font-size: 0.65rem; color: #FFF7ED; font-weight: 600; letter-spacing: 0.8px; margin-top: 2px;">
          ${org.subtitle || "RASHTRIYA RAJNITIK DAL | NATIONAL POLITICAL PARTY"}
        </div>
        <div style="display: inline-block; background: #0F2B5C; color: #FF9933; font-size: 0.62rem; font-weight: 800; padding: 2px 10px; border-radius: 10px; letter-spacing: 0.8px; margin-top: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          OFFICIAL IDENTITY CARD
        </div>
      </div>

      <!-- Middle Photo & Primary Bio Row -->
      <div style="padding: 0 16px; margin-top: -16px; z-index: 5;">
        <div style="display: flex; gap: 14px; align-items: center; background: #f8fafc; padding: 10px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
          
          <!-- Photo Frame -->
          <div style="position: relative; width: ${photoWidth}px; height: ${photoHeight}px; border-radius: ${photoRadius}; overflow: hidden; border: 2.5px solid #0F2B5C; box-shadow: 0 4px 10px rgba(0,0,0,0.15); flex-shrink: 0; background: #ffffff;">
            <img src="${photoUrl}" alt="${context['{fullName}']}" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/default-user.jpg'" />
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15,43,92,0.9); color: white; font-size: 0.52rem; text-align: center; font-weight: 800; padding: 1px 0;">VERIFIED</div>
          </div>

          <!-- Quick Identifiers -->
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 1.05rem; font-weight: 900; color: #0F2B5C; line-height: 1.2; word-break: break-word;">
              ${context['{fullName}']}
            </div>
            
            <div style="font-size: 0.8rem; font-weight: 800; color: #FF9933; margin-top: 3px; font-family: monospace; letter-spacing: 0.5px;">
              ${context['{memberNumber}']}
            </div>

            <div style="display: inline-block; background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 4px; margin-top: 4px; line-height: 1.2;">
              🎖️ ${context['{designation}']}
            </div>

            ${config.showBloodGroup !== false ? `
            <div style="font-size: 0.68rem; font-weight: 700; color: #dc2626; margin-top: 4px;">
              🩸 Blood Group: <b>${context['{bloodGroup}']}</b>
            </div>` : ""}
          </div>

        </div>
      </div>

      <!-- Details Table / Grid -->
      <div style="padding: 6px 16px 0;">
        <table style="width: 100%; font-size: 0.72rem; border-collapse: collapse; color: #334155;">
          ${config.showFatherName !== false ? `
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 3px 0; color: #64748b; width: 38%; font-weight: 600;">Father / Guardian:</td>
            <td style="padding: 3px 0; font-weight: 700; color: #0F2B5C;">${context['{fatherName}']}</td>
          </tr>` : ""}

          ${config.showDob !== false ? `
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 3px 0; color: #64748b; font-weight: 600;">Date of Birth:</td>
            <td style="padding: 3px 0; font-weight: 700; color: #0F2B5C;">${context['{dob}']}</td>
          </tr>` : ""}

          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 3px 0; color: #64748b; font-weight: 600;">Joining Date:</td>
            <td style="padding: 3px 0; font-weight: 700; color: #0F2B5C;">${context['{joiningDate}']}</td>
          </tr>

          ${config.showValidUpto !== false ? `
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 3px 0; color: #64748b; font-weight: 600;">Valid Upto:</td>
            <td style="padding: 3px 0; font-weight: 800; color: #dc2626;">${context['{validUpto}']}</td>
          </tr>` : ""}

          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 3px 0; color: #64748b; font-weight: 600;">Mobile:</td>
            <td style="padding: 3px 0; font-weight: 700; color: #0F2B5C;">${context['{mobile}']}</td>
          </tr>

          ${config.showAddress !== false ? `
          <tr>
            <td style="padding: 3px 0; color: #64748b; font-weight: 600; vertical-align: top;">Address:</td>
            <td style="padding: 3px 0; font-weight: 600; color: #1e293b; font-size: 0.66rem; line-height: 1.25;">${context['{address}']}</td>
          </tr>` : ""}
        </table>
      </div>

      <!-- QR & Official Signatory Footer Block -->
      <div style="padding: 8px 16px 10px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end;">
        
        <!-- QR Code -->
        <div style="display: flex; flex-direction: column; align-items: center; background: #ffffff; padding: 3px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
          ${qrSvg}
          <span style="font-size: 0.52rem; font-weight: 800; color: #0F2B5C; margin-top: 1px; letter-spacing: 0.3px;">SCAN TO VERIFY</span>
        </div>

        <!-- Authorized Signatory Seal & Signature -->
        <div style="text-align: right; flex: 1; padding-left: 12px;">
          <div style="position: relative; display: inline-block;">
            <img src="${signatureUrl}" alt="Signature" crossorigin="anonymous" style="max-height: ${signatureHeight}px; max-width: ${signatureWidth}px; object-fit: contain; margin-bottom: 2px;" onerror="this.style.display='none'" />
            <div style="font-size: 0.72rem; font-weight: 800; color: #0F2B5C; line-height: 1;">${org.leaderName || "National President"}</div>
            <div style="font-size: 0.58rem; font-weight: 700; color: #166534; text-transform: uppercase; margin-top: 1px;">${org.authorityTitle || "Authorized Signatory"}</div>
          </div>
        </div>

      </div>

      <!-- Green Bottom Accent Wave -->
      <div style="height: 6px; width: 100%; background: linear-gradient(90deg, #138808 0%, #166534 100%);"></div>
    </div>`;
}

/**
 * Builds the Official SVPP Vertical Back Side HTML (330px x 510px)
 */
export function renderSvppBackSideHTML(member = {}, orgSettings = {}, assetSettings = {}, config = {}) {
    const org = { ...DEFAULT_ORG_SETTINGS, ...orgSettings };
    const context = buildShortcodeContext(member, org, config);

    return `
    <div class="svpp-id-card svpp-card-back svpp-card-vertical" style="position: relative; width: 330px; height: 510px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(15,43,92,0.18); border: 1px solid #e2e8f0; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; justify-content: space-between; user-select: none;">
      
      <!-- Top Saffron Bar -->
      <div style="height: 6px; width: 100%; background: linear-gradient(90deg, #FF9933 0%, #EA580C 100%);"></div>

      <!-- Top Header & Terms Pill -->
      <div style="padding: 12px 16px 0; text-align: center;">
        <div style="display: inline-block; background: #0F2B5C; color: #ffffff; font-size: 0.68rem; font-weight: 800; padding: 3px 12px; border-radius: 20px; letter-spacing: 0.8px; box-shadow: 0 2px 5px rgba(15,43,92,0.25);">
          TERMS & CONDITIONS
        </div>
      </div>

      <!-- 5 Official Bullet Rules -->
      <div style="padding: 8px 16px 0;">
        <ol style="margin: 0; padding-left: 18px; font-size: 0.65rem; color: #334155; line-height: 1.45; text-align: justify;">
          <li style="margin-bottom: 4px;">This digital identity card is the official property of <b>${org.orgName}</b> and is strictly non-transferable.</li>
          <li style="margin-bottom: 4px;">The cardholder must present this card on demand during party conventions, assemblies, and official outreach missions.</li>
          <li style="margin-bottom: 4px;">Loss, theft, or damage of this credential must be reported immediately to the National/State Secretariat.</li>
          <li style="margin-bottom: 4px;">Misrepresentation of party policies, unauthorized press statements, or misuse of credentials will invite disciplinary action.</li>
          <li>Valid until <b>${context['{validUpto}']}</b> or subject to periodic party membership renewal as per constitution.</li>
        </ol>
      </div>

      <!-- Emergency Helpline Contact Box -->
      <div style="padding: 0 16px;">
        <div style="background: #fff7ed; border: 1.5px dashed #fdba74; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 0.65rem; font-weight: 800; color: #c2410c; letter-spacing: 0.5px; text-transform: uppercase;">
            🚨 IN CASE OF EMERGENCY, CONTACT
          </div>
          <div style="font-size: 0.72rem; font-weight: 800; color: #0F2B5C; margin-top: 2px;">
            Central Helpline: ${org.phone || "+91 98200 12345"}
          </div>
          <div style="font-size: 0.62rem; color: #475569; margin-top: 1px;">
            Email: ${org.email || "contact@svpparty.co"} | HQ: New Delhi
          </div>
        </div>
      </div>

      <!-- Website Pill & Script Slogan -->
      <div style="padding: 6px 16px 12px; text-align: center;">
        <div style="display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 3px 12px; border-radius: 20px; font-size: 0.68rem; font-weight: 700; color: #0F2B5C; margin-bottom: 8px;">
          <span>🌐</span> <a href="https://${org.website || PARTY_WEBSITE}" target="_blank" style="color: #0F2B5C; text-decoration: none;">${org.website || PARTY_WEBSITE}</a>
        </div>

        <!-- Script Slogan in Caveat font -->
        <div style="font-family: 'Caveat', cursive, sans-serif; font-size: 1.15rem; color: #166534; font-weight: 700; line-height: 1.1;">
          "${org.slogan || PARTY_SLOGAN}"
        </div>
      </div>

      <!-- Bottom Green Wave Footer -->
      <div style="position: relative; background: linear-gradient(135deg, #138808 0%, #166534 100%); color: #ffffff; padding: 8px 12px; text-align: center; border-top-left-radius: 50% 12px; border-top-right-radius: 50% 12px;">
        <div style="font-size: 0.6rem; font-weight: 800; letter-spacing: 0.8px; color: #DCFCE7;">
          ${org.orgName} &bull; RASHTRIYA KARYALAYA
        </div>
      </div>

    </div>`;
}

/**
 * Builds the Official SVPP Horizontal Front Side HTML (520px x 328px Landscape CR80 standard)
 */
export function renderSvppHorizontalFrontSideHTML(member = {}, orgSettings = {}, assetSettings = {}, config = {}) {
    const org = { ...DEFAULT_ORG_SETTINGS, ...orgSettings };
    const context = buildShortcodeContext(member, org, config);

    const photoUrl = member?.photoUrl || assetSettings?.defaultPhotoUrl || "images/default-user.jpg";
    const signatureUrl = assetSettings?.founderSignatureUrl || "images/signature.png";
    const qrSize = config.qrCodeSize || 46;
    const qrSvg = generateSvgQrCode(context["{memberNumber}"], qrSize);

    const photoWidth = config.photoWidth || 88;
    const photoHeight = config.photoHeight || 105;
    const photoRadius = config.photoRadius !== undefined ? (typeof config.photoRadius === 'number' ? `${config.photoRadius}px` : config.photoRadius) : "8px";
    const signatureHeight = config.signatureHeight || 34;
    const signatureWidth = config.signatureWidth || 110;

    return `
    <div class="svpp-id-card svpp-card-front svpp-card-horizontal" style="position: relative; width: 520px; height: 328px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(15,43,92,0.18); border: 1px solid #e2e8f0; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; justify-content: space-between; user-select: none; box-sizing: border-box;">
      
      <!-- Top Tricolor Ribbon -->
      <div style="display: flex; height: 5px; width: 100%; z-index: 10;">
        <div style="flex: 1; background: #FF9933;"></div>
        <div style="flex: 1; background: #FFFFFF;"></div>
        <div style="flex: 1; background: #138808;"></div>
      </div>

      <!-- Saffron Landscape Header -->
      <div style="background: linear-gradient(135deg, #FF9933 0%, #EA580C 100%); color: #ffffff; padding: 7px 14px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(234,88,12,0.25);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="background: rgba(255,255,255,0.95); color: #0F2B5C; padding: 2px 8px; border-radius: 12px; font-size: 0.68rem; font-weight: 800; border: 1px solid #FF9933; display: flex; align-items: center; gap: 3px;">
            <span>🇮🇳</span> सरदार वल्लभभाई पटेल पार्टी
          </div>
          <div style="font-size: 0.88rem; font-weight: 900; letter-spacing: 0.3px; text-transform: uppercase; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.25);">
            ${org.orgName}
          </div>
        </div>

        <div style="background: #0F2B5C; color: #FF9933; font-size: 0.62rem; font-weight: 800; padding: 3px 10px; border-radius: 10px; letter-spacing: 0.6px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
          OFFICIAL IDENTITY CARD
        </div>
      </div>

      <!-- Main Horizontal Content Body (3 Columns: Photo+QR | Details | Signatory) -->
      <div style="display: flex; gap: 14px; padding: 8px 14px 4px; flex: 1; align-items: center; box-sizing: border-box;">
        
        <!-- Left Column: Photo & QR -->
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: ${Math.max(96, photoWidth + 8)}px; flex-shrink: 0;">
          <div style="position: relative; width: ${photoWidth}px; height: ${photoHeight}px; border-radius: ${photoRadius}; overflow: hidden; border: 2.5px solid #0F2B5C; box-shadow: 0 3px 8px rgba(0,0,0,0.12); background: #ffffff;">
            <img src="${photoUrl}" alt="${context['{fullName}']}" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/default-user.jpg'" />
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15,43,92,0.92); color: white; font-size: 0.5rem; text-align: center; font-weight: 800; padding: 1px 0;">VERIFIED</div>
          </div>

          <div style="display: flex; align-items: center; gap: 4px; background: #ffffff; padding: 2px 4px; border-radius: 4px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            ${qrSvg}
            <span style="font-size: 0.48rem; font-weight: 800; color: #0F2B5C; line-height: 1.1;">SCAN TO<br/>VERIFY</span>
          </div>
        </div>

        <!-- Center Column: Member Bio & Data Table -->
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
          <div>
            <div style="font-size: 1.1rem; font-weight: 900; color: #0F2B5C; line-height: 1.15; word-break: break-word;">
              ${context['{fullName}']}
            </div>

            <div style="display: flex; align-items: center; gap: 8px; margin-top: 3px; flex-wrap: wrap;">
              <span style="font-size: 0.8rem; font-weight: 800; color: #FF9933; font-family: monospace; letter-spacing: 0.5px;">
                ${context['{memberNumber}']}
              </span>
              <span style="display: inline-block; background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; font-size: 0.65rem; font-weight: 800; padding: 1px 6px; border-radius: 4px;">
                🎖️ ${context['{designation}']}
              </span>
              ${config.showBloodGroup !== false ? `
              <span style="font-size: 0.65rem; font-weight: 700; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; padding: 1px 6px; border-radius: 4px;">
                🩸 ${context['{bloodGroup}']}
              </span>` : ""}
            </div>
          </div>

          <!-- Key Details Grid -->
          <div style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 6px 8px; margin-top: 4px;">
            <table style="width: 100%; font-size: 0.68rem; border-collapse: collapse; color: #334155;">
              ${config.showFatherName !== false ? `
              <tr>
                <td style="padding: 1.5px 0; color: #64748b; font-weight: 600; width: 35%;">Father/Guardian:</td>
                <td style="padding: 1.5px 0; font-weight: 700; color: #0F2B5C;">${context['{fatherName}']}</td>
              </tr>` : ""}

              ${config.showDob !== false ? `
              <tr>
                <td style="padding: 1.5px 0; color: #64748b; font-weight: 600;">Date of Birth:</td>
                <td style="padding: 1.5px 0; font-weight: 700; color: #0F2B5C;">${context['{dob}']}</td>
              </tr>` : ""}

              <tr>
                <td style="padding: 1.5px 0; color: #64748b; font-weight: 600;">Joining / Valid:</td>
                <td style="padding: 1.5px 0; font-weight: 700; color: #0F2B5C;">${context['{joiningDate}']} &bull; <b style="color: #dc2626;">${context['{validUpto}']}</b></td>
              </tr>

              <tr>
                <td style="padding: 1.5px 0; color: #64748b; font-weight: 600;">Mobile:</td>
                <td style="padding: 1.5px 0; font-weight: 700; color: #0F2B5C;">${context['{mobile}']}</td>
              </tr>

              ${config.showAddress !== false ? `
              <tr>
                <td style="padding: 1.5px 0; color: #64748b; font-weight: 600; vertical-align: top;">Address:</td>
                <td style="padding: 1.5px 0; font-weight: 600; color: #1e293b; font-size: 0.62rem; line-height: 1.2;">${context['{address}']}</td>
              </tr>` : ""}
            </table>
          </div>
        </div>

        <!-- Right Column: Seal & Authorized Signatory -->
        <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; width: ${Math.max(100, signatureWidth)}px; flex-shrink: 0; text-align: right;">
          <div style="position: relative; display: inline-block;">
            <img src="${signatureUrl}" alt="Signature" crossorigin="anonymous" style="max-height: ${signatureHeight}px; max-width: ${signatureWidth}px; object-fit: contain; margin-bottom: 2px;" onerror="this.style.display='none'" />
            <div style="font-size: 0.68rem; font-weight: 800; color: #0F2B5C; line-height: 1;">${org.leaderName || "National President"}</div>
            <div style="font-size: 0.55rem; font-weight: 700; color: #166534; text-transform: uppercase; margin-top: 1px;">${org.authorityTitle || "Authorized Signatory"}</div>
          </div>
        </div>

      </div>

      <!-- Green Bottom Accent Wave -->
      <div style="height: 6px; width: 100%; background: linear-gradient(90deg, #138808 0%, #166534 100%);"></div>
    </div>`;
}

/**
 * Builds the Official SVPP Horizontal Back Side HTML (520px x 328px Landscape CR80 standard)
 */
export function renderSvppHorizontalBackSideHTML(member = {}, orgSettings = {}, assetSettings = {}, config = {}) {
    const org = { ...DEFAULT_ORG_SETTINGS, ...orgSettings };
    const context = buildShortcodeContext(member, org, config);

    return `
    <div class="svpp-id-card svpp-card-back svpp-card-horizontal" style="position: relative; width: 520px; height: 328px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(15,43,92,0.18); border: 1px solid #e2e8f0; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; justify-content: space-between; user-select: none; box-sizing: border-box;">
      
      <!-- Top Saffron Bar -->
      <div style="height: 5px; width: 100%; background: linear-gradient(90deg, #FF9933 0%, #EA580C 100%);"></div>

      <!-- Header Row -->
      <div style="padding: 7px 14px 4px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9;">
        <div style="display: inline-block; background: #0F2B5C; color: #ffffff; font-size: 0.65rem; font-weight: 800; padding: 2px 10px; border-radius: 12px; letter-spacing: 0.6px;">
          TERMS & CONDITIONS &bull; SVPP RULES
        </div>
        <div style="font-size: 0.68rem; font-weight: 800; color: #166534;">
          सरदार वल्लभभाई पटेल पार्टी &bull; CENTRAL REGISTRY
        </div>
      </div>

      <!-- 2-Column Split Body: Rules on Left | Contact & Slogan on Right -->
      <div style="display: grid; grid-template-columns: 1.28fr 1fr; gap: 14px; padding: 6px 14px 4px; flex: 1; align-items: center; box-sizing: border-box;">
        
        <!-- Left: 5 Official Bullet Rules -->
        <div>
          <ol style="margin: 0; padding-left: 16px; font-size: 0.62rem; color: #334155; line-height: 1.38; text-align: justify;">
            <li style="margin-bottom: 3px;">Official property of <b>${org.orgName}</b> and strictly non-transferable.</li>
            <li style="margin-bottom: 3px;">Must be presented on demand during party conventions and official missions.</li>
            <li style="margin-bottom: 3px;">Report loss or theft immediately to the Central/State Secretariat.</li>
            <li style="margin-bottom: 3px;">Misrepresentation or misuse invites disciplinary action.</li>
            <li>Valid until <b>${context['{validUpto}']}</b> or subject to constitutional renewal.</li>
          </ol>
        </div>

        <!-- Right: Emergency Contact & Caveat Slogan -->
        <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; padding-left: 6px; border-left: 1px dashed #cbd5e1;">
          <!-- Emergency Contact Box -->
          <div style="background: #fff7ed; border: 1.5px dashed #fdba74; border-radius: 8px; padding: 6px 8px; text-align: center;">
            <div style="font-size: 0.6rem; font-weight: 800; color: #c2410c; text-transform: uppercase;">
              🚨 EMERGENCY HELPLINE
            </div>
            <div style="font-size: 0.72rem; font-weight: 800; color: #0F2B5C; margin-top: 1px;">
              ${org.phone || "+91 98200 12345"}
            </div>
            <div style="font-size: 0.58rem; color: #475569; margin-top: 1px;">
              ${org.email || "contact@svpparty.co"} | HQ: New Delhi
            </div>
          </div>

          <!-- Website & Slogan -->
          <div style="text-align: center; margin-top: 4px;">
            <div style="display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 10px; border-radius: 12px; font-size: 0.65rem; font-weight: 700; color: #0F2B5C; margin-bottom: 4px;">
              <span>🌐</span> <a href="https://${org.website || PARTY_WEBSITE}" target="_blank" style="color: #0F2B5C; text-decoration: none;">${org.website || PARTY_WEBSITE}</a>
            </div>

            <div style="font-family: 'Caveat', cursive, sans-serif; font-size: 1.15rem; color: #166534; font-weight: 700; line-height: 1.1;">
              "${org.slogan || PARTY_SLOGAN}"
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Green Wave Footer -->
      <div style="background: linear-gradient(135deg, #138808 0%, #166534 100%); color: #ffffff; padding: 6px 14px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 0.58rem; font-weight: 800; letter-spacing: 0.6px; color: #DCFCE7;">
          ${org.orgName} &bull; RASHTRIYA KARYALAYA
        </div>
        <div style="font-size: 0.55rem; color: #FFFFFF; font-weight: 700;">
          NEW DELHI HEADQUARTERS
        </div>
      </div>

    </div>`;
}

/**
 * Custom template renderer using super-admin uploaded background images & dragged shortcodes
 */
export function renderCustomCardSideHTML(side = "front", member = {}, orgSettings = {}, assetSettings = {}, config = {}) {
    const primaryColor = config.primaryColor || PARTY_PRIMARY_BLUE;
    const bgUrl = side === "back" ? config.backBgUrl : config.frontBgUrl;
    const elements = side === "back" ? (config.backElements || []) : (config.frontElements || []);
    const context = buildShortcodeContext(member, orgSettings, config);

    const isHorizontal = config.orientation === "horizontal" || config.cardOrientation === "horizontal" || config.preset === "horizontal";
    const cardWidth = isHorizontal ? "520px" : "330px";
    const cardHeight = isHorizontal ? "328px" : "510px";

    const photoUrl = member?.photoUrl || assetSettings?.defaultPhotoUrl || "images/default-user.jpg";
    const signatureUrl = assetSettings?.founderSignatureUrl || "images/signature.png";
    const qrSvg = generateSvgQrCode(context["{memberNumber}"], 50);

    let elementsHTML = "";
    elements.forEach((el) => {
        const x = el.x ?? 10;
        const y = el.y ?? 10;
        const fontSize = el.fontSize || 12;
        const fontWeight = el.fontWeight || "600";
        const color = el.color || "#0F2B5C";
        const align = el.align || "left";

        if (el.tag === "{photo}") {
            const w = el.width || config.photoWidth || (isHorizontal ? 90 : 88);
            const h = el.height || config.photoHeight || 110;
            const r = el.borderRadius !== undefined ? (typeof el.borderRadius === 'number' ? `${el.borderRadius}px` : el.borderRadius) : (config.photoRadius !== undefined ? `${config.photoRadius}px` : "8px");
            elementsHTML += `
            <div style="position: absolute; left: ${x}%; top: ${y}%; width: ${w}px; height: ${h}px; z-index: 2;">
                <img src="${photoUrl}" alt="Photo" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; border-radius: ${r}; border: 2px solid ${primaryColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.15);" onerror="this.src='images/default-user.jpg'" />
            </div>`;
        } else if (el.tag === "{qrCode}") {
            const w = el.width || config.qrCodeSize || 55;
            const h = el.height || config.qrCodeSize || 55;
            const qrMatrixSize = Math.max(20, Math.min(w - 6, h - 6));
            elementsHTML += `
            <div style="position: absolute; left: ${x}%; top: ${y}%; width: ${w}px; height: ${h}px; background: white; padding: 2px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2; box-sizing: border-box;">
                ${generateSvgQrCode(context["{memberNumber}"], qrMatrixSize)}
            </div>`;
        } else if (el.tag === "{signature}") {
            const w = el.width || config.signatureWidth || 105;
            const h = el.height || config.signatureHeight || 42;
            elementsHTML += `
            <div style="position: absolute; left: ${x}%; top: ${y}%; width: ${w}px; height: ${h}px; z-index: 2; display: flex; align-items: center; justify-content: center;">
                <img src="${signatureUrl}" alt="Signature" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'" />
            </div>`;
        } else {
            const textVal = context[el.tag] || el.label || el.tag;
            elementsHTML += `
            <div style="position: absolute; left: ${x}%; top: ${y}%; font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; text-align: ${align}; white-space: nowrap; font-family: 'Outfit', sans-serif; z-index: 2;">
                ${textVal}
            </div>`;
        }
    });

    const backgroundStyle = bgUrl
        ? `background-image: url('${bgUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
        : `background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border: 2px dashed ${primaryColor};`;

    return `
    <div class="custom-id-card-side side-${side}" style="position: relative; width: ${cardWidth}; height: ${cardHeight}; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.15); ${backgroundStyle}">
        ${!bgUrl ? `<div style="position: absolute; top: 8px; right: 10px; font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; background: rgba(255,255,255,0.85); padding: 2px 8px; border-radius: 4px;">${side.toUpperCase()} SIDE (${isHorizontal ? "HORIZONTAL" : "VERTICAL"})</div>` : ""}
        ${elementsHTML}
    </div>`;
}

/**
 * Main function to build ID Card HTML with orientation (Vertical vs Horizontal) and side selector (Front, Back, Both, 3D-Flip)
 */
export function buildIdCardHTML(member, orgSettings = {}, assetSettings = {}, layoutConfig = {}, sideOption = "both") {
    const config = { ...DEFAULT_LAYOUT_CONFIG, ...layoutConfig };
    const orientation = config.orientation || config.cardOrientation || (config.preset === "horizontal" || config.preset === "svpp-horizontal" ? "horizontal" : "vertical");

    // If Custom Template is active
    if (config.preset === "custom" || config.useCustomTemplate) {
        const frontHTML = renderCustomCardSideHTML("front", member, orgSettings, assetSettings, { ...config, orientation });
        const backHTML = renderCustomCardSideHTML("back", member, orgSettings, assetSettings, { ...config, orientation });

        if (sideOption === "front") return frontHTML;
        if (sideOption === "back") return backHTML;

        if (sideOption === "3d-flip") {
            const cardW = orientation === "horizontal" ? "340px" : "240px";
            const cardH = orientation === "horizontal" ? "214px" : "370px";
            return `
            <div style="text-align: center; width: 100%;">
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; margin-bottom: 8px;">👆 Click on Card to Flip between Front & Back</div>
                <div class="card-flip-container" style="width: ${cardW}; height: ${cardH}; margin: 0 auto;" onclick="this.classList.toggle('is-flipped')">
                    <div class="card-flip-inner">
                        <div class="card-flip-front">${frontHTML}</div>
                        <div class="card-flip-back">${backHTML}</div>
                    </div>
                </div>
            </div>`;
        }

        return `
        <div class="id-card-double-wrapper id-card-orientation-${orientation}" style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; align-items: flex-start;">
            <div class="card-side-col">
                <div style="font-size: 0.75rem; font-weight: 800; color: #0F2B5C; margin-bottom: 6px; text-transform: uppercase; text-align: center; letter-spacing: 0.5px;">🖼️ FRONT SIDE</div>
                ${frontHTML}
            </div>
            <div class="card-side-col">
                <div style="font-size: 0.75rem; font-weight: 800; color: #0F2B5C; margin-bottom: 6px; text-transform: uppercase; text-align: center; letter-spacing: 0.5px;">🔄 BACK SIDE</div>
                ${backHTML}
            </div>
        </div>`;
    }

    // Horizontal Layout (Executive Landscape CR80 standard)
    if (orientation === "horizontal") {
        const frontHTML = renderSvppHorizontalFrontSideHTML(member, orgSettings, assetSettings, config);
        const backHTML = renderSvppHorizontalBackSideHTML(member, orgSettings, assetSettings, config);

        if (sideOption === "front") return frontHTML;
        if (sideOption === "back") return backHTML;

        if (sideOption === "3d-flip") {
            return `
            <div style="text-align: center; width: 100%;">
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; margin-bottom: 8px;">👆 Click on Card to Flip between Front & Back</div>
                <div class="card-flip-container" style="width: 340px; height: 214px; margin: 0 auto;" onclick="this.classList.toggle('is-flipped')">
                    <div class="card-flip-inner">
                        <div class="card-flip-front">${frontHTML}</div>
                        <div class="card-flip-back">${backHTML}</div>
                    </div>
                </div>
            </div>`;
        }

        return `
        <div class="id-card-double-wrapper id-card-orientation-horizontal" style="display: flex; flex-direction: column; gap: 24px; justify-content: center; align-items: center;">
            <div class="card-side-col" id="idCardFrontSideCol">
                <div style="font-size: 0.75rem; font-weight: 800; color: #0F2B5C; margin-bottom: 6px; text-transform: uppercase; text-align: center; letter-spacing: 0.5px;">🇮🇳 FRONT SIDE (HORIZONTAL)</div>
                ${frontHTML}
            </div>
            <div class="card-side-col" id="idCardBackSideCol">
                <div style="font-size: 0.75rem; font-weight: 800; color: #0F2B5C; margin-bottom: 6px; text-transform: uppercase; text-align: center; letter-spacing: 0.5px;">📜 BACK SIDE (TERMS & HELPLINE)</div>
                ${backHTML}
            </div>
        </div>`;
    }

    // Default: SVPP Official Vertical Double-Sided Layout (Portrait)
    const frontHTML = renderSvppFrontSideHTML(member, orgSettings, assetSettings, config);
    const backHTML = renderSvppBackSideHTML(member, orgSettings, assetSettings, config);

    if (sideOption === "front") return frontHTML;
    if (sideOption === "back") return backHTML;

    if (sideOption === "3d-flip") {
        return `
        <div style="text-align: center; width: 100%;">
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; margin-bottom: 8px;">👆 Click on Card to Flip between Front & Back</div>
            <div class="card-flip-container" style="width: 240px; height: 370px; margin: 0 auto;" onclick="this.classList.toggle('is-flipped')">
                <div class="card-flip-inner">
                    <div class="card-flip-front">${frontHTML}</div>
                    <div class="card-flip-back">${backHTML}</div>
                </div>
            </div>
        </div>`;
    }

    return `
    <div class="id-card-double-wrapper id-card-orientation-vertical" style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; align-items: flex-start;">
        <div class="card-side-col" id="idCardFrontSideCol">
            <div style="font-size: 0.75rem; font-weight: 800; color: #0F2B5C; margin-bottom: 6px; text-transform: uppercase; text-align: center; letter-spacing: 0.5px;">🇮🇳 FRONT SIDE (VERTICAL)</div>
            ${frontHTML}
        </div>
        <div class="card-side-col" id="idCardBackSideCol">
            <div style="font-size: 0.75rem; font-weight: 800; color: #0F2B5C; margin-bottom: 6px; text-transform: uppercase; text-align: center; letter-spacing: 0.5px;">📜 BACK SIDE (TERMS & HELPLINE)</div>
            ${backHTML}
        </div>
    </div>`;
}
