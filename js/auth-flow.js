
// Default values if config not loaded (fallbacks)
const SUPABASE_URL = window.SUPABASE_URL || "https://izoyxyekflrnyheuxppk.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "sb_publishable_YHpGZHSw6XfnoC3Kg4QplQ_Wz5Hp3hw";

// EmailJS Configuration
const EMAILJS_SERVICE_ID = window.EMAILJS_SERVICE_ID || "service_gpf5o4g";
const EMAILJS_OTP_TEMPLATE_ID = "template_35ebnrp";
const EMAILJS_PASSWORD_RESET_TEMPLATE_ID = "template_password_reset"; // User needs to create this
const EMAILJS_PUBLIC_KEY = window.EMAILJS_PUBLIC_KEY || "vQdFZ_3TQhMLDP1z3";

let authMode = 'login';
let authStep = 'credentials'; // 'credentials' or 'verify'
let generatedOTP = null;
let pendingUserData = null; // Store user data until OTP verified
const ADMIN_CODE_REQUIRED = "FBLA2025";

function setAuthMode(mode) {
    authMode = mode;
    authStep = 'credentials';
    generatedOTP = null;
    pendingUserData = null;

    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const nameGroup = document.getElementById('nameGroup');
    const adminAuthGroup = document.getElementById('adminAuthGroup');
    const otpGroup = document.getElementById('otpGroup');
    const modeLink = document.getElementById('authModeLink');
    const status = document.getElementById('authStatus');
    const passwordGroup = document.getElementById('passwordGroup');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const emailInput = document.getElementById('authEmail');

    // Reset fields
    if (status) status.textContent = "";
    if (otpGroup) otpGroup.classList.add('hidden');
    if (emailInput) emailInput.classList.remove('hidden');
    if (passwordGroup) passwordGroup.classList.remove('hidden');
    if (submitBtn) {
        submitBtn.textContent = "Continue";
        submitBtn.disabled = false;
    }

    // Reset admin checkbox
    const adminCheckbox = document.getElementById('isAdminAuth');
    const adminCodeWrap = document.getElementById('adminCodeAuthWrap');
    if (adminCheckbox) adminCheckbox.checked = false;
    if (adminCodeWrap) adminCodeWrap.classList.add('hidden');

    // Hide forgot password section if visible
    hideForgotPassword();

    if (mode === 'signup') {
        if (title) title.textContent = "Create REUNITE Account";
        if (nameGroup) nameGroup.classList.remove('hidden');
        if (adminAuthGroup) adminAuthGroup.classList.remove('hidden');
        if (confirmPasswordGroup) confirmPasswordGroup.classList.remove('hidden');
        if (forgotPasswordLink) forgotPasswordLink.style.display = 'none';
        if (modeLink) {
            modeLink.textContent = "Already have an account? Sign In";
            modeLink.setAttribute('onclick', "event.preventDefault(); setAuthMode('login')");
            modeLink.setAttribute('href', "#");
        }
    } else {
        if (title) title.textContent = "Sign in with REUNITE Account";
        if (nameGroup) nameGroup.classList.add('hidden');
        if (adminAuthGroup) adminAuthGroup.classList.add('hidden');
        if (confirmPasswordGroup) confirmPasswordGroup.classList.add('hidden');
        if (forgotPasswordLink) forgotPasswordLink.style.display = 'inline';
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

// Simple hash function for client-side password hashing (for demo purposes)
// In production, use a proper server-side hashing with bcrypt/argon2
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleAuthStep() {
    if (authStep === 'credentials') {
        await validateCredentials();
    } else {
        await verifyOTP();
    }
}
window.handleAuthStep = handleAuthStep;

async function validateCredentials() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName')?.value.trim() || "";
    const status = document.getElementById('authStatus');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (!email) {
        status.textContent = "EMAIL ADDRESS IS REQUIRED";
        status.className = "status-msg error";
        return;
    }

    if (!password) {
        status.textContent = "PASSWORD IS REQUIRED";
        status.className = "status-msg error";
        return;
    }

    if (authMode === 'signup') {
        if (!name) {
            status.textContent = "FULL NAME IS REQUIRED";
            status.className = "status-msg error";
            return;
        }

        const confirmPassword = document.getElementById('authConfirmPassword')?.value;
        if (password !== confirmPassword) {
            status.textContent = "PASSWORDS DO NOT MATCH";
            status.className = "status-msg error";
            return;
        }

        if (password.length < 6) {
            status.textContent = "PASSWORD MUST BE AT LEAST 6 CHARACTERS";
            status.className = "status-msg error";
            return;
        }
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

    status.textContent = "Verifying credentials...";
    status.className = "status-msg";
    submitBtn.disabled = true;

    const supabase = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Check if user exists in profiles table
        const { data: existingUser, error: queryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (queryError && queryError.code !== 'PGRST116') {
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

        // For login, verify password
        if (authMode === 'login') {
            const hashedPassword = await hashPassword(password);
            if (existingUser.password_hash !== hashedPassword) {
                status.textContent = "INVALID PASSWORD. PLEASE TRY AGAIN.";
                status.className = "status-msg error";
                submitBtn.disabled = false;
                return;
            }

            // Store user data for after OTP verification
            pendingUserData = {
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.full_name || existingUser.name || existingUser.email.split('@')[0],
                role: existingUser.role || 'student'
            };
        } else {
            // For signup, prepare new user data
            const hashedPassword = await hashPassword(password);
            const userRole = isAdminChecked ? 'admin' : 'student';

            pendingUserData = {
                id: 'user_' + Math.random().toString(36).substr(2, 9),
                email: email,
                full_name: name,
                role: userRole,
                password_hash: hashedPassword,
                created_at: new Date().toISOString()
            };
        }

        // Now send OTP for 2-factor verification
        await sendOTP();

    } catch (err) {
        console.error("Credential Validation Error:", err);
        status.textContent = "ERROR: " + (err.message || "VALIDATION FAILED");
        status.className = "status-msg error";
        submitBtn.disabled = false;
    }
}

async function sendOTP() {
    const email = document.getElementById('authEmail').value.trim();
    const name = document.getElementById('authName')?.value.trim() || pendingUserData?.name || "User";
    const status = document.getElementById('authStatus');
    const submitBtn = document.getElementById('authSubmitBtn');

    status.textContent = "Sending verification code...";
    status.className = "status-msg";

    // Generate 6-digit OTP
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    const templateParams = {
        to_email: email,
        email: email,
        recipient: email,
        to_name: name,
        otp_code: generatedOTP,
        subject: "Security Verification Code"
    };

    console.log("Sending OTP to:", email);

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_OTP_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);

        // Transition to Verification step
        authStep = 'verify';

        // Hide credentials, show OTP
        const otpGroup = document.getElementById('otpGroup');
        const passwordGroup = document.getElementById('passwordGroup');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        const emailInput = document.getElementById('authEmail');
        const nameGroup = document.getElementById('nameGroup');
        const adminAuthGroup = document.getElementById('adminAuthGroup');
        const resend = document.getElementById('resendBtn');
        const modeLink = document.getElementById('authModeLink');
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        const authLinksGroup = document.querySelector('.auth-links-group');

        if (otpGroup) otpGroup.classList.remove('hidden');
        if (resend) resend.classList.remove('hidden');
        if (passwordGroup) passwordGroup.classList.add('hidden');
        if (confirmPasswordGroup) confirmPasswordGroup.classList.add('hidden');
        if (emailInput) emailInput.classList.add('hidden');
        if (nameGroup) nameGroup.classList.add('hidden');
        if (adminAuthGroup) adminAuthGroup.classList.add('hidden');
        if (authLinksGroup) authLinksGroup.classList.add('hidden');

        if (document.getElementById('authTitle')) {
            document.getElementById('authTitle').textContent = "Verify Your Identity";
        }

        status.textContent = `VERIFICATION CODE SENT TO ${email.toUpperCase()}`;
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
    const status = document.getElementById('authStatus');

    console.log("Verifying OTP:", { entered: enteredOTP, expected: generatedOTP });

    // Allow "000000" as a fallback for demo/testing purposes
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
        if (authMode === 'signup') {
            // Save new user to Supabase Profiles
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([pendingUserData]);

            if (insertError) throw insertError;
        }

        // Create session data (without password hash)
        const sessionData = {
            id: pendingUserData.id,
            email: pendingUserData.email,
            name: pendingUserData.full_name || pendingUserData.name,
            role: pendingUserData.role
        };

        // Cache the session locally
        localStorage.setItem("reunite_session", JSON.stringify(sessionData));

        if (status) {
            status.textContent = "ACCESS GRANTED. REDIRECTING...";
            status.className = "status-msg success";
        }

        setTimeout(() => {
            // Redirect to appropriate dashboard based on role
            const dashboardHash = sessionData.role === 'admin' ? '#admin' : '#dashboard';
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

// Forgot Password Functions
function showForgotPassword() {
    const forgotSection = document.getElementById('forgotPasswordSection');
    const mainAuthButtons = document.getElementById('mainAuthButtons');
    const authLinksGroup = document.querySelector('.auth-links-group');
    const passwordGroup = document.getElementById('passwordGroup');
    const emailField = document.getElementById('authEmail');
    const title = document.getElementById('authTitle');

    if (forgotSection) forgotSection.classList.remove('hidden');
    if (mainAuthButtons) mainAuthButtons.classList.add('hidden');
    if (authLinksGroup) authLinksGroup.classList.add('hidden');
    if (passwordGroup) passwordGroup.classList.add('hidden');
    if (emailField) emailField.classList.add('hidden');
    if (title) title.textContent = "Reset Your Password";
}
window.showForgotPassword = showForgotPassword;

function hideForgotPassword() {
    const forgotSection = document.getElementById('forgotPasswordSection');
    const mainAuthButtons = document.getElementById('mainAuthButtons');
    const authLinksGroup = document.querySelector('.auth-links-group');
    const passwordGroup = document.getElementById('passwordGroup');
    const emailField = document.getElementById('authEmail');
    const title = document.getElementById('authTitle');

    if (forgotSection) forgotSection.classList.add('hidden');
    if (mainAuthButtons) mainAuthButtons.classList.remove('hidden');
    if (authLinksGroup) authLinksGroup.classList.remove('hidden');
    if (passwordGroup) passwordGroup.classList.remove('hidden');
    if (emailField) emailField.classList.remove('hidden');
    if (title) title.textContent = authMode === 'signup' ? "Create REUNITE Account" : "Sign in with REUNITE Account";
}
window.hideForgotPassword = hideForgotPassword;

async function sendPasswordReset() {
    const email = document.getElementById('forgotEmail').value.trim();
    const status = document.getElementById('authStatus');

    if (!email) {
        status.textContent = "PLEASE ENTER YOUR EMAIL ADDRESS";
        status.className = "status-msg error";
        return;
    }

    status.textContent = "Sending reset email...";
    status.className = "status-msg";

    // Generate reset token
    const resetToken = Math.random().toString(36).substr(2, 12);
    const resetLink = `${window.location.origin}/login.html?reset=${resetToken}&email=${encodeURIComponent(email)}`;

    const templateParams = {
        to_email: email,
        email: email,
        reset_link: resetLink,
        subject: "Password Reset Request"
    };

    try {
        // Note: User needs to create template_password_reset in EmailJS
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_PASSWORD_RESET_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);

        status.textContent = "PASSWORD RESET EMAIL SENT. CHECK YOUR INBOX.";
        status.className = "status-msg success";
    } catch (err) {
        console.error("Password Reset Email Error:", err);
        status.textContent = "FAILED TO SEND RESET EMAIL. " + (err.message || "");
        status.className = "status-msg error";
    }
}
window.sendPasswordReset = sendPasswordReset;

// Initialization for Login Page
document.addEventListener('DOMContentLoaded', () => {
    // We expect supabase-client.js to have run initializeSupabase()
    if (window.initializeSupabase) window.initializeSupabase();

    // Initialize EmailJS
    const emailjs = window.emailjs;
    if (typeof emailjs !== "undefined") {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }

    // Initialize dark mode
    if (window.initDarkMode) window.initDarkMode();
});
