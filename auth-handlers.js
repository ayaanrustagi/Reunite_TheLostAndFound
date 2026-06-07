
const SUPABASE_URL = "https://izoyxyekflrnyheuxppk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YHpGZHSw6XfnoC3Kg4QplQ_Wz5Hp3hw";

// EmailJS Configuration from your settings
const EMAILJS_SERVICE_ID = "service_gpf5o4g";
const EMAILJS_OTP_TEMPLATE_ID = "template_35ebnrp"; // Your new template ID
const EMAILJS_PUBLIC_KEY = "vQdFZ_3TQhMLDP1z3";

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

let authMode = 'login';
let authStep = 'send'; // 'send' or 'verify'
let generatedOTP = null;
const ADMIN_CODE_REQUIRED = "FBLA2025";

function setAuthMode(mode) {
    authMode = mode;
    authStep = 'send';
    generatedOTP = null;

    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${mode}`).classList.add('active');

    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const nameGroup = document.getElementById('nameGroup');
    const otpGroup = document.getElementById('otpGroup');
    const resendBtn = document.getElementById('resendBtn');
    const status = document.getElementById('authStatus');

    status.textContent = "";
    otpGroup.classList.add('hidden');
    resendBtn.classList.add('hidden');
    submitBtn.textContent = "SEND CODE";

    if (mode === 'signup') {
        title.textContent = "CREATE ACCOUNT";
        subtitle.textContent = "Join the network to find lost items.";
        nameGroup.classList.remove('hidden');
    } else {
        title.textContent = "WELCOME BACK";
        subtitle.textContent = "Please enter your email to receive a login code.";
        nameGroup.classList.add('hidden');
    }
}

function toggleAdminAuth() {
    const isChecked = document.getElementById('isAdminAuth').checked;
    const codeWrap = document.getElementById('adminCodeAuthWrap');
    codeWrap.classList.toggle('hidden', !isChecked);
}

async function handleAuthStep() {
    if (authStep === 'send') {
        await sendOTP();
    } else {
        await verifyOTP();
    }
}

async function sendOTP() {
    const email = document.getElementById('authEmail').value.trim();
    const name = document.getElementById('authName').value.trim();
    const status = document.getElementById('authStatus');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (!email) {
        status.textContent = "EMAIL ADDRESS IS REQUIRED";
        status.className = "status-msg error";
        return;
    }

    if (authMode === 'signup' && !name) {
        status.textContent = "FULL NAME IS REQUIRED";
        status.className = "status-msg error";
        return;
    }

    status.textContent = "Sending verification code...";
    status.className = "status-msg";
    submitBtn.disabled = true;

    // Generate 6-digit OTP
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    const templateParams = {
        to_email: email,
        email: email, // Alias for template flexibility
        recipient: email, // Alias for template flexibility
        to_name: name || "REUNITE User",
        otp_code: generatedOTP, // Ensure your template uses {{otp_code}}
        subject: "Security Verification Code"
    };

    console.log("Attempting to send OTP to:", email, "with params:", templateParams);

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_OTP_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);

        status.textContent = "CODE SENT SUCCESSFULLY";
        status.className = "status-msg success";

        // Transition to Verification step
        authStep = 'verify';
        document.getElementById('otpGroup').classList.remove('hidden');
        document.getElementById('resendBtn').classList.remove('hidden');
        submitBtn.textContent = "VERIFY & SIGN " + (authMode === 'login' ? "IN" : "UP");
        submitBtn.disabled = false;

        // Auto-focus OTP field
        document.getElementById('authOTP').focus();
    } catch (err) {
        console.error("EmailJS Error:", err);
        const errorMsg = err?.text || err?.message || "CHECK SERVICE/TEMPLATE ID";
        status.textContent = "SEND FAILED: " + errorMsg.toUpperCase();
        status.className = "status-msg error";
        submitBtn.disabled = false;
    }
}

async function verifyOTP() {
    const enteredOTP = document.getElementById('authOTP').value.trim();
    const email = document.getElementById('authEmail').value.trim();
    const name = document.getElementById('authName').value.trim();
    const isAdmin = document.getElementById('isAdminAuth').checked;
    const adminCode = document.getElementById('adminCodeAuth').value;
    const status = document.getElementById('authStatus');

    if (enteredOTP !== generatedOTP) {
        status.textContent = "INVALID VERIFICATION CODE";
        status.className = "status-msg error";
        return;
    }

    if (isAdmin && adminCode !== ADMIN_CODE_REQUIRED) {
        status.textContent = "INVALID ADMIN ACCESS CODE";
        status.className = "status-msg error";
        return;
    }

    status.textContent = "Verifying...";
    status.className = "status-msg";

    try {
        // For Democratic/Demo purposes, we'll manually set the user session.
        // In a real Supabase app, you'd use passwordless auth, 
        // but this custom EmailJS flow handles the logic you requested.

        const userData = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            email: email,
            name: name || email.split('@')[0],
            role: isAdmin ? 'admin' : 'student'
        };

        // Cache the session locally so script.js recognizes it
        localStorage.setItem("reunite_session", JSON.stringify(userData));

        status.textContent = "ACCESS GRANTED. REDIRECTING...";
        status.className = "status-msg success";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);

    } catch (err) {
        status.textContent = "VERIFICATION ERROR";
        status.className = "status-msg error";
    }
}

// Global expose
window.setAuthMode = setAuthMode;
window.toggleAdminAuth = toggleAdminAuth;
window.handleAuthStep = handleAuthStep;
window.sendOTP = sendOTP;
