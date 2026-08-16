/* ==========================================================================
   OFFICIAL APPOINTMENT LETTER RENDERER MODULE
   SARDAR VALLABHBHAI PATEL PARTY (SVPP)
   High-resolution formal letterhead with real-time shortcode replacement & seals
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
    buildShortcodeContext,
    replaceShortcodes,
    formatToStandardDate
} from "./shortcodes.js";

export const DEFAULT_LETTER_TEMPLATE = `To,
<strong>{fullName}</strong> (Member ID: {memberNumber})
S/o or D/o: {fatherName}
Address: {address}
Mobile: {mobile} | Email: {email}

<strong><u>SUBJECT: OFFICIAL APPOINTMENT ORDER — {designation}</u></strong>

Dear <strong>{fullName}</strong>,

Jai Hind!

On behalf of the Central Executive Committee and the National Leadership of <strong>{orgName}</strong>, we take immense pride in conveying that you have been officially designated and appointed as <strong>{designation}</strong> with immediate effect from <strong>{appointmentDate}</strong>.

Your dedicated efforts, integrity, and patriotism towards grassroots empowerment exemplify the core values of Sardar Vallabhbhai Patel. As <strong>{designation}</strong>, you are empowered to lead public outreach initiatives, represent party forums, organize regional conventions, and uphold our solemn pledge: <em>"{slogan}"</em>.

<strong><u>TERMS OF APPOINTMENT:</u></strong>
1. <strong>Portfolio & Jurisdiction:</strong> You shall discharge duties assigned to the office of <strong>{designation}</strong> in accordance with the Party Constitution.
2. <strong>Reference Number:</strong> All official communications regarding this order must cite Reference ID: <strong>{refNumber}</strong>.
3. <strong>Validity:</strong> This appointment is effective from <strong>{appointmentDate}</strong> and stands valid up to <strong>{validUpto}</strong>, subject to standard performance review and constitutional guidelines.
4. <strong>Ethics & Representation:</strong> The appointee shall strictly adhere to party discipline, organizational decorum, and selfless public service.

We extend our heartfelt congratulations and best wishes for your impactful tenure in shaping the future of our nation.`;

/**
 * Builds HTML for the Appointment Letter canvas (A4 aspect layout)
 */
export function buildAppointmentLetterHTML(member = {}, orgSettings = {}, letterParams = {}, assetSettings = {}) {
    const org = { ...DEFAULT_ORG_SETTINGS, ...orgSettings };
    const context = buildShortcodeContext(member, org, letterParams);

    const rawTemplate = letterParams?.letterBody || DEFAULT_LETTER_TEMPLATE;
    const renderedBody = replaceShortcodes(rawTemplate, context);

    const signatureUrl = assetSettings?.founderSignatureUrl || "images/signature.png";
    const partyLogoUrl = assetSettings?.logoUrl || "images/logo.jpg";

    return `
    <div class="appointment-letter-sheet" style="position: relative; width: 794px; min-height: 1123px; background: #ffffff; margin: 0 auto; padding: 36px 44px 44px; box-shadow: 0 10px 35px rgba(0,0,0,0.12); font-family: 'Outfit', sans-serif; color: #1e293b; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #e2e8f0;">
      
      <!-- Top Tricolor Ribbon -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 8px; display: flex;">
        <div style="flex: 1; background: #FF9933;"></div>
        <div style="flex: 1; background: #FFFFFF; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;"></div>
        <div style="flex: 1; background: #138808;"></div>
      </div>

      <!-- Main Document Content Container -->
      <div>
        
        <!-- Header Letterhead Block -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #0F2B5C; padding-bottom: 16px; margin-bottom: 20px;">
          
          <!-- Party Logo / Emblem -->
          <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 2.5px solid #FF9933; box-shadow: 0 4px 10px rgba(0,0,0,0.12); display: flex; align-items: center; justify-content: center; background: #ffffff; flex-shrink: 0;">
            <img src="${partyLogoUrl}" alt="Emblem" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/logo.jpg'" />
          </div>

          <!-- Central Party Identity -->
          <div style="text-align: center; flex: 1; padding: 0 16px;">
            <div style="font-size: 0.85rem; font-weight: 800; color: #FF9933; letter-spacing: 0.5px; margin-bottom: 2px;">
              🇮🇳 राष्ट्रीय राजनीतिक दल &bull; NATIONAL POLITICAL PARTY
            </div>
            <h1 style="margin: 0; font-size: 1.45rem; font-weight: 900; color: #0F2B5C; text-transform: uppercase; letter-spacing: 0.6px; line-height: 1.15;">
              ${org.orgName}
            </h1>
            <div style="font-size: 0.78rem; color: #475569; font-weight: 600; margin-top: 4px;">
              Central Headquarters: ${org.address || "New Delhi, India"} | Helpline: ${org.phone || "+91 98200 12345"}
            </div>
            <div style="font-size: 0.72rem; color: #166534; font-weight: 700; margin-top: 2px;">
              Official Portal: <u>https://${org.website || PARTY_WEBSITE}</u> | Email: ${org.email || "contact@svpparty.co"}
            </div>
          </div>

          <!-- Official Gold/Navy Seal Badge -->
          <div style="width: 80px; height: 80px; border-radius: 50%; border: 2.5px dashed #0F2B5C; background: #FFFBEB; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; flex-shrink: 0; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
            <div style="font-size: 0.5rem; font-weight: 800; color: #B45309; text-transform: uppercase;">OFFICIAL SEAL</div>
            <div style="font-size: 1.1rem; line-height: 1;">🏛️</div>
            <div style="font-size: 0.48rem; font-weight: 800; color: #0F2B5C;">SVPP &bull; APPOINTED</div>
          </div>

        </div>

        <!-- Dispatch Reference Bar & Date Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 14px; margin-bottom: 20px; font-size: 0.82rem;">
          <div>
            <span style="color: #64748b; font-weight: 600;">Dispatch Ref No:</span>
            <span style="color: #0F2B5C; font-weight: 800; font-family: monospace; letter-spacing: 0.4px; margin-left: 6px;">${context['{refNumber}']}</span>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">Date of Issue:</span>
            <span style="color: #0F2B5C; font-weight: 800; margin-left: 6px;">${context['{appointmentDate}']}</span>
          </div>
        </div>

        <!-- Letter Body Area -->
        <div class="appointment-letter-body-content" style="font-family: 'Times New Roman', Georgia, serif; font-size: 0.98rem; line-height: 1.65; color: #0f172a; text-align: justify; white-space: pre-line; margin-bottom: 30px;">
          ${renderedBody}
        </div>

      </div>

      <!-- Bottom Signatory, Seal, and Motto Section -->
      <div>
        
        <!-- Signatory Row -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px; border-top: 1px solid #e2e8f0; margin-bottom: 18px;">
          
          <!-- Seal & Verification -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #166534; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.52rem; font-weight: 800; color: #166534; text-align: center; background: #f0fdf4;">
              <span>SVPP</span>
              <span>VERIFIED</span>
              <span>CREDENTIAL</span>
            </div>
            <div style="font-size: 0.72rem; color: #64748b;">
              <div>Scan & verify this order at:</div>
              <div style="font-weight: 700; color: #0F2B5C;">svpparty.co/verify</div>
            </div>
          </div>

          <!-- Authorized Signature Block -->
          <div style="text-align: right; min-width: 220px;">
            <div style="min-height: 48px; display: flex; align-items: flex-end; justify-content: flex-end;">
              <img src="${signatureUrl}" alt="Authorized Signature" crossorigin="anonymous" style="max-height: 44px; max-width: 140px; object-fit: contain;" onerror="this.style.display='none'" />
            </div>
            <div style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.95rem; color: #0F2B5C; margin-top: 4px;">
              ${org.leaderName || "National President"}
            </div>
            <div style="font-family: 'Outfit', sans-serif; font-size: 0.76rem; font-weight: 700; color: #166534; text-transform: uppercase;">
              ${org.authorityTitle || "National General Secretary / President"}
            </div>
            <div style="font-family: 'Outfit', sans-serif; font-size: 0.72rem; color: #64748b;">
              ${org.orgName}
            </div>
          </div>

        </div>

        <!-- Script Slogan Footer Bar -->
        <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-family: 'Caveat', cursive, sans-serif; font-size: 1.35rem; font-weight: 700; color: #FF9933; margin-bottom: 2px;">
            "${org.slogan || PARTY_SLOGAN}"
          </div>
          <div style="font-size: 0.65rem; color: #64748b; font-weight: 600;">
            This is an official credential issued by ${org.orgName}. Valid for all organizational correspondence.
          </div>
        </div>

      </div>

    </div>`;
}
