import { getDocument } from "../firebase/firestore.js";
import { COLLECTIONS } from "./constants.js";

export const DEFAULT_FOOTER_SETTINGS = {
  logoTop: "खबर की",
  logoStar: "✨",
  logoBottom: "तहतक",
  email: "khabarkitahtak@gmail.com",
  phone: "94517 33981",
  address: "Head Office - Office No. 1743, First Floor Lekhraj Dollar, Near Ghazipur Police Station Faizabad Road, Indira Nagar Lucknow – 226016 Uttar Pradesh, India",
  copyright: "© 2021 All rights reserved by Fragron Infotech",
  fbUrl: "#",
  twitterUrl: "#",
  instaUrl: "#",
  youtubeUrl: "#",
  termsUrl: "#",
  privacyUrl: "#",
  disclaimerUrl: "#",
  refundUrl: "#"
};

export async function fetchFooterSettings() {
  try {
    const doc = await getDocument(COLLECTIONS.SETTINGS, "footer").catch(() => null);
    if (doc) {
      const merged = { ...DEFAULT_FOOTER_SETTINGS, ...doc };
      try {
        localStorage.setItem("app_footer_settings", JSON.stringify(merged));
      } catch (e) {}
      return merged;
    }
    const local = localStorage.getItem("app_footer_settings");
    if (local) {
      return { ...DEFAULT_FOOTER_SETTINGS, ...JSON.parse(local) };
    }
  } catch (err) {
    console.warn("Could not fetch footer settings from Firestore:", err);
  }
  return DEFAULT_FOOTER_SETTINGS;
}

export function applyFooterToPage(settings) {
  const finalSettings = { ...DEFAULT_FOOTER_SETTINGS, ...settings };

  // Update Logo
  const logoTopEl = document.getElementById("footerLogoTopEl");
  const logoStarEl = document.getElementById("footerLogoStarEl");
  const logoBottomEl = document.getElementById("footerLogoBottomEl");
  if (logoTopEl) logoTopEl.textContent = finalSettings.logoTop || DEFAULT_FOOTER_SETTINGS.logoTop;
  if (logoStarEl) logoStarEl.textContent = finalSettings.logoStar || DEFAULT_FOOTER_SETTINGS.logoStar;
  if (logoBottomEl) logoBottomEl.textContent = finalSettings.logoBottom || DEFAULT_FOOTER_SETTINGS.logoBottom;

  // Update Contact Info
  const emailLink = document.getElementById("footerEmailLink");
  const phoneLink = document.getElementById("footerPhoneLink");
  const addressText = document.getElementById("footerAddressText");

  if (emailLink) {
    const email = finalSettings.email || DEFAULT_FOOTER_SETTINGS.email;
    emailLink.textContent = email;
    emailLink.href = `mailto:${email}`;
  }
  if (phoneLink) {
    const phone = finalSettings.phone || DEFAULT_FOOTER_SETTINGS.phone;
    phoneLink.textContent = phone;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    phoneLink.href = `tel:${cleanPhone || phone}`;
  }
  if (addressText) {
    addressText.textContent = finalSettings.address || DEFAULT_FOOTER_SETTINGS.address;
  }

  // Update Links
  const termsLink = document.getElementById("footerTermsLink");
  const privacyLink = document.getElementById("footerPrivacyLink");
  const disclaimerLink = document.getElementById("footerDisclaimerLink");
  const refundLink = document.getElementById("footerRefundLink");

  if (termsLink) termsLink.href = finalSettings.termsUrl || "#";
  if (privacyLink) privacyLink.href = finalSettings.privacyUrl || "#";
  if (disclaimerLink) disclaimerLink.href = finalSettings.disclaimerUrl || "#";
  if (refundLink) refundLink.href = finalSettings.refundUrl || "#";

  // Update Social Links
  const fbLink = document.getElementById("footerFbLink");
  const twitterLink = document.getElementById("footerTwitterLink");
  const instaLink = document.getElementById("footerInstaLink");
  const youtubeLink = document.getElementById("footerYoutubeLink");

  if (fbLink) fbLink.href = finalSettings.fbUrl || "#";
  if (twitterLink) twitterLink.href = finalSettings.twitterUrl || "#";
  if (instaLink) instaLink.href = finalSettings.instaUrl || "#";
  if (youtubeLink) youtubeLink.href = finalSettings.youtubeUrl || "#";

  // Update Copyright
  const copyrightText = document.getElementById("footerCopyrightText");
  if (copyrightText) {
    copyrightText.textContent = finalSettings.copyright || DEFAULT_FOOTER_SETTINGS.copyright;
  }
}

export async function initFooterOnPage() {
  const settings = await fetchFooterSettings();
  applyFooterToPage(settings);
}
