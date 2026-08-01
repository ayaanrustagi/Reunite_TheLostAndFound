
async function sendEmailUpdate(to_email, to_name, subject, message, item_title) {
    // blast notifications via emailjs
    if (!window.EMAILS_ENABLED) return;
    const client = window.emailjs || (typeof emailjs !== "undefined" ? emailjs : null);
    if (!client) return;


    const finalEmail = (to_email && to_email.includes('@')) ? to_email : "ayaanrustagi2010@gmail.com";

    const templateParams = {
        to_email: finalEmail,
        email: finalEmail,
        recipient: finalEmail,
        to_name: to_name || "REUNITE User",
        subject: subject || "System Update",
        message: message || "New update regarding your lost and found item.",
        item_title: item_title || "Reported Item",
        site_link: window.location.origin
    };

    try {
        await client.send(window.EMAILJS_SERVICE_ID, window.EMAILJS_TEMPLATE_ID, templateParams, window.EMAILJS_PUBLIC_KEY);
    } catch (err) {
        console.error("EMAIL FAILED:", err);
        if (window.showError) window.showError("Email notification failed");
    }
}
window.sendEmailUpdate = sendEmailUpdate;
   