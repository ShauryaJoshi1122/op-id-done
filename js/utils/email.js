import { getCollection } from "../firebase/firestore.js";
import { COLLECTIONS } from "./constants.js";

// ==========================================================================
// EMAILJS CONFIGURATION
// ==========================================================================
export const EMAILJS_SERVICE_ID = "service_onnv3vn";
export const EMAILJS_ADMIN_TEMPLATE_ID = "template_3m0mo0f";
export const EMAILJS_USER_TEMPLATE_ID = "template_675gjmf";
export const EMAILJS_PUBLIC_KEY = "Kc4Mv6f6yrlvX1FJi";

// ==========================================================================
// ADMIN FALLBACK EMAIL CONFIGURATION
// ==========================================================================
export const ADMIN_FALLBACK_EMAIL = "lotus4helptn@gmail.com";


export async function sendAdminNotification({ subject, html }) {
    try {
        console.log("Fetching admin emails for notification...");
        let adminEmails = [];
        try {
            const admins = await getCollection(COLLECTIONS.ADMINS);
            adminEmails = admins.map(admin => admin.email).filter(Boolean);
        } catch (error) {
            console.warn("Could not retrieve admins collection. Using fallback.", error);
        }

        if (adminEmails.length === 0) {
            if (ADMIN_FALLBACK_EMAIL && ADMIN_FALLBACK_EMAIL !== "admin@example.com") {
                console.log(`Using fallback admin email: ${ADMIN_FALLBACK_EMAIL}`);
                adminEmails.push(ADMIN_FALLBACK_EMAIL);
            } else {
                console.warn("No admin email addresses found and fallback email is not configured.");
                return;
            }
        }

        console.log(`Sending admin notification via EmailJS to: ${adminEmails.join(", ")}`);

        if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY" || EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID") {
            console.warn("⚠️ EmailJS is not configured yet. Skipping actual API call. Set values in js/utils/email.js.");
            return;
        }

        for (const email of adminEmails) {
            const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    service_id: EMAILJS_SERVICE_ID,
                    template_id: EMAILJS_ADMIN_TEMPLATE_ID,
                    user_id: EMAILJS_PUBLIC_KEY,
                    template_params: {
                        to_email: email,
                        subject: subject,
                        message: html
                    }
                })
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(`EmailJS server returned error: ${response.status} - ${responseText}`);
            }
            console.log(`EmailJS notification successfully sent to: ${email}`);
        }
    } catch (error) {
        console.error("Error sending admin email notification via EmailJS:", error);
    }
}

/**
 * Sends a status confirmation email (Approved/Rejected) to a member using EmailJS.
 */
export async function sendMemberStatusNotification(memberEmail, status, name, memberNumber = null) {
    if (!memberEmail) {
        console.warn("Cannot send member notification: Member email is missing.");
        return;
    }

    try {
        let subject = "";
        let html = "";

        if (status === "approved") {
            subject = "உறுப்பினர் சேர்க்கை ஒப்புதல் | Member Registration Approved";
            html = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #4caf50; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">உறுப்பினர் சேர்க்கை ஒப்புதல் | Member Registration Approved</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>அன்புள்ள <strong>${name}</strong>,</p>
                        <p>தாமரை தொண்டு நிறுவன அறக்கட்டளையில் உறுப்பினராக இணைவதற்கான தங்களது விண்ணப்பம் <strong>ஒப்புதல் (Approved)</strong> செய்யப்பட்டுள்ளது என்பதை மகிழ்ச்சியுடன் தெரிவித்துக் கொள்கிறோம்.</p>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #4caf50;">
                            <p style="margin: 5px 0;"><strong>உறுப்பினர் எண் (Member ID):</strong> ${memberNumber}</p>
                            <p style="margin: 5px 0;"><strong>நிலை (Status):</strong> Approved (ஏற்றுக்கொள்ளப்பட்டது)</p>
                        </div>
                        <p>இப்போது நீங்கள் எங்கள் இணையதளத்தில் உள்நுழைந்து உங்களுக்கான டிஜிட்டல் அடையாள அட்டையை (ID Card) பதிவிறக்கம் செய்து கொள்ளலாம்.</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="https://thamarai-charitable-trust.firebaseapp.com/member-login.html" style="background-color: #4caf50; color: white; padding: 12px 24px; text-align: center; text-decoration: none; font-weight: bold; border-radius: 5px;">உள்நுழைக | Login</a>
                        </p>
                        <p>நன்றியுடன்,<br/>தாமரை தொண்டு நிறுவன அறக்கட்டளை</p>
                    </div>
                </div>
            `;
        } else if (status === "rejected") {
            subject = "விண்ணப்ப நிலை அறிக்கை | Application Status Update";
            html = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #f44336; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">விண்ணப்ப நிலை அறிக்கை | Application Status Update</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>அன்புள்ள <strong>${name}</strong>,</p>
                        <p>தாமரை தொண்டு நிறுவன அறக்கட்டளையில் உறுப்பினராக இணைவதற்கான தங்களது விண்ணப்பம் தகுந்த காரணங்களால் <strong>நிராகரிக்கப்பட்டுள்ளது (Rejected)</strong> என்பதை வருத்தத்துடன் தெரிவித்துக் கொள்கிறோம்.</p>
                        <p>தாங்கள் சமர்ப்பித்த ஆவணங்கள் அல்லது தகவல்கள் எங்கள் அமைப்பின் விதிகளுக்கு உட்படவில்லை. கூடுதல் விவரங்களுக்கு அல்லது ஏதேனும் சந்தேகம் இருந்தால் எங்களைத் தொடர்பு கொள்ளவும்.</p>
                        <p>நன்றியுடன்,<br/>தாமரை தொண்டு நிறுவன அறக்கட்டளை</p>
                    </div>
                </div>
            `;
        } else {
            console.warn(`Unknown member status type for email: ${status}`);
            return;
        }

        console.log(`Sending member status notification via EmailJS to: ${memberEmail} (${status})`);

        if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY" || EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID") {
            console.warn("⚠️ EmailJS is not configured yet. Skipping actual API call. Set values in js/utils/email.js.");
            return;
        }

        const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_USER_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                template_params: {
                    to_email: memberEmail,
                    subject: subject,
                    message: html
                }
            })
        });

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`EmailJS server returned error: ${response.status} - ${responseText}`);
        }
        console.log(`EmailJS status update sent successfully to: ${memberEmail}`);
    } catch (error) {
        console.error("Error sending member status notification email via EmailJS:", error);
    }
}
