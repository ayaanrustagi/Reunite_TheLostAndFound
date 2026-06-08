
async function sendEmailUpdate(to_email, to_name, subject, message, item_title) {
    if (!window.EMAILS_ENABLED) return;
    const client = window.emailjs || (typeof emailjs !== "undefined" ? emailjs : null);
    if (!client) return;

    // MEGA-FIX: Ensure there is ALWAYS a valid recipient
    const finalEmail = (to_email && to_email.includes('@')) ? to_email : "ayaanrustagi2010@gmail.com";

    const templateParams = {
        to_email: finalEmail,
        email: finalEmail, // Alias
        recipient: finalEmail, // Alias
        to_name: to_name || "REUNITE User",
        subject: subject || "System Update",
        message: message || "New update regarding your lost and found item.",
        item_title: item_title || "Reported Item",
        site_link: "https://thereunite.netlify.app"
    };

    try {
        console.log("📤 SENDING EMAIL TO:", finalEmail);
        await client.send(window.EMAILJS_SERVICE_ID, window.EMAILJS_TEMPLATE_ID, templateParams, window.EMAILJS_PUBLIC_KEY);
        console.log(`✅ EMAIL SENT SUCCESSFULLY`);
    } catch (err) {
        console.error("🔴 EMAIL FAILED:", err);
        alert(`EMAIL ERROR: ${err.text || "Recipient missing"}\n\nFIX: Go to EmailJS Dashboard -> Settings Tab -> Set "To Email" to {{to_email}}`);
    }
}
window.sendEmailUpdate = sendEmailUpdate;
