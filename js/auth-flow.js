
// Default values if config not loaded (fallbacks)
const SUPABASE_URL = window.SUPABASE_URL || "https://izoyxyekflrnyheuxppk.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "sb_publishable_YHpGZHSw6XfnoC3Kg4QplQ_Wz5Hp3hw";

// EmailJS Configuration
const EMAILJS_SERVICE_ID = window.EMAILJS_SERVICE_ID || "service_gpf5o4g";
const EMAILJS_OTP_TEMPLATE_ID = "template_35ebnrp";
const EMAILJS_PUBLIC_KEY = window.EMAILJS_PUBLIC_KEY || "vQdFZ_3TQhMLDP1z3";

let authMode = 'login';
let authStep = 'send'; // 'send' or 'verify'
let generatedOTP = null;
const ADMIN_CODE_REQUIRED = "FBLA2025";

function setAuthMode(mode) {
    authMode = mode;
    authStep = 'send';
    generatedOTP = null;

    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const nameGroup = document.getElementById('nameGroup');
    const adminAuthGroup = document.getElementById('adminAuthGroup');
    const otpGroup = document.getElementById('otpGroup');
    const modeLink = document.getElementById('authModeLink');
    const status = document.getElementById('authStatus');

    if (status) status.textContent = "";
    if (otpGroup) otpGroup.classList.add('hidden');
    if (submitBtn) {
        submitBtn.textContent = "Continue";
        submitBtn.disabled = false;
    }

    // Reset admin checkbox
    const adminCheckbox = document.getElementById('isAdminAuth');
    const adminCodeWrap = document.getElementById('adminCodeAuthWrap');
    if (adminCheckbox) adminCheckbox.checked = false;
    if (adminCodeWrap) adminCodeWrap.classList.add('hidden');

    if (mode === 'signup') {
        if (title) title.textContent = "Create REUNITE Account";
        if (nameGroup) nameGroup.classList.remove('hidden');
        if (adminAuthGroup) adminAuthGroup.classList.remove('hidden');
        if (modeLink) {
            modeLink.textContent = "Already have an account? Sign In";
            modeLink.setAttribute('onclick', "event.preventDefault(); setAuthMode('login')");
            modeLink.setAttribute('href', "#");
        }
    } else {
        if (title) title.textContent = "Sign in with REUNITE Account";
        if (nameGroup) nameGroup.classList.add('hidden');
        if (adminAuthGroup) adminAuthGroup.classList.add('hidden');
        if (modeLink) {
            modeLink.textContent = "Create Your REUNITE Account";
            modeLink.setAttribute('onclick', "event.preventDefault(); setAuthMode('signup')");
            modeLink.setAttribute('href', "#");
        }
    }
}
window.setAuthMode = setAuthMode;

function toggleAdminAuth() {
    const isChecked = document.getElementById('isAdminAuth').checked;
    const codeWrap = document.getElementById('adminCodeAuthWrap');
    codeWrap.classList.toggle('hidden', !isChecked);
}
window.toggleAdminAuth = toggleAdminAuth;

async function handleAuthStep() {
    if (authStep === 'send') {
        await sendOTP();
    } else {
        await verifyOTP();
    }
}
window.handleAuthStep = handleAuthStep;

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

    // Validate admin code if admin checkbox is checked
    const isAdminChecked = document.getElementById('isAdminAuth')?.checked;
    const adminCodeInput = document.getElementById('adminCodeAuth');
    if (authMode === 'signup' && isAdminChecked) {
        const enteredCode = adminCodeInput ? adminCodeInput.value.trim() : "";
        if (enteredCode !== ADMIN_CODE_REQUIRED) {
            status.textContent = "INVALID ADMIN ACCESS CODE";
            status.className = "status-msg error";
            return;
        }
    }

    status.textContent = "Verifying account status...";
    status.className = "status-msg";
    submitBtn.disabled = true;

    // Use window.supabaseClient if available, otherwise creaate one locally for this flow
    // But login page should have initialized it via supabase-client.js
    const supabase = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // 1. Check if user exists in profiles table
        const { data: existingUser, error: queryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
            console.error("Supabase Query Error:", queryError);
        }

        if (authMode === 'signup' && existingUser) {
            status.textContent = "ACCOUNT ALREADY EXISTS. PLEASE SIGN IN.";
            status.className = "status-msg error";
            submitBtn.disabled = false;
            return;
        }

        if (authMode === 'login' && !existingUser) {
            status.textContent = "NO ACCOUNT FOUND. PLEASE SIGN UP FIRST.";
            status.className = "status-msg error";
            submitBtn.disabled = false;
            return;
        }

        status.textContent = "Sending verification code...";
    } catch (err) {
        console.error("Critical Auth Check Error:", err);
    }

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
        if (location.href.includes('login.html')) {
            const otpGroup = document.getElementById('otpGroup');
            if (otpGroup) otpGroup.classList.remove('hidden');
            const resend = document.getElementById('resendBtn');
            if (resend) resend.classList.remove('hidden');

            // Hide others
            const nameGroup = document.getElementById('nameGroup');
            if (nameGroup) nameGroup.classList.add('hidden');
            const emailInput = document.getElementById('authEmail');
            if (emailInput) emailInput.classList.add('hidden');
            const modeLink = document.getElementById('authModeLink');
            if (modeLink) modeLink.classList.add('hidden');

            if (document.getElementById('authTitle')) {
                document.getElementById('authTitle').textContent = "Verify Your Identity";
            }
        }

        status.textContent = `WE SENT A CODE TO ${email.toUpperCase()}`;
        status.className = "status-msg";

        submitBtn.textContent = "Verify";
        submitBtn.disabled = false;

        // Auto-focus OTP field
        const otpInput = document.getElementById('authOTP');
        if (otpInput) otpInput.focus();
    } catch (err) {
        console.error("EmailJS Error:", err);
        const errorMsg = err?.text || err?.message || "CHECK SERVICE/TEMPLATE ID";
        status.textContent = "SEND FAILED: " + errorMsg.toUpperCase();
        status.className = "status-msg error";
        submitBtn.disabled = false;
    }
}
window.sendOTP = sendOTP;

async function verifyOTP() {
    const otpInput = document.getElementById('authOTP');
    const enteredOTP = otpInput ? otpInput.value.trim() : "";
    const emailInput = document.getElementById('authEmail');
    const email = emailInput ? emailInput.value.trim() : "";
    const nameInput = document.getElementById('authName');
    const name = nameInput ? nameInput.value.trim() : "";

    const status = document.getElementById('authStatus');

    console.log("Verifying OTP:", { entered: enteredOTP, expected: generatedOTP });

    // Allow "000000" as a fallback for demo purposes if needed, or strictly check generatedOTP
    if (enteredOTP !== generatedOTP && enteredOTP !== "000000") {
        if (status) {
            status.textContent = "INVALID VERIFICATION CODE";
            status.className = "status-msg error";
        }
        return;
    }

    if (status) {
        status.textContent = "Verifying...";
        status.className = "status-msg";
    }

    const supabase = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        let userData = null;

        if (authMode === 'signup') {
            const newId = 'user_' + Math.random().toString(36).substr(2, 9);

            // Determine role based on admin checkbox
            const isAdminChecked = document.getElementById('isAdminAuth')?.checked;
            const userRole = isAdminChecked ? 'admin' : 'student';

            userData = {
                id: newId,
                email: email,
                full_name: name || email.split('@')[0],
                role: userRole,
                created_at: new Date().toISOString()
            };

            // Save to Supabase Profiles
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([userData]);

            if (insertError) throw insertError;
        } else {
            // Fetch existing profile
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', email)
                .single();

            if (fetchError) throw fetchError;

            userData = {
                id: profile.id,
                email: profile.email,
                name: profile.full_name || profile.name || profile.email.split('@')[0],
                role: profile.role || 'student'
            };
        }

        // Cache the session locally so app.js recognizes it
        localStorage.setItem("reunite_session", JSON.stringify(userData));

        if (status) {
            status.textContent = "ACCESS GRANTED. REDIRECTING...";
            status.className = "status-msg success";
        }

        setTimeout(() => {
            // Redirect to appropriate dashboard based on role
            const dashboardHash = userData.role === 'admin' ? '#admin' : '#dashboard';
            window.location.href = 'index.html' + dashboardHash;
        }, 1200);

    } catch (err) {
        console.error("Verification/DB Error:", err);
        if (status) {
            status.textContent = "DATABASE ERROR: " + (err.message || "COULD NOT SYNC PROFILE").toUpperCase();
            status.className = "status-msg error";
        }
    }
}
window.verifyOTP = verifyOTP;

// Initialization for Login Page
document.addEventListener('DOMContentLoaded', () => {
    // We expect supabase-client.js to have run initializeSupabase()
    if (window.initializeSupabase) window.initializeSupabase();

    // Initialize EmailJS
    const emailjs = window.emailjs;
    if (typeof emailjs !== "undefined") {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
});
