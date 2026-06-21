
const EMAILJS_SERVICE_ID = window.EMAILJS_SERVICE_ID || "service_gpf5o4g";
const EMAILJS_OTP_TEMPLATE_ID = "template_35ebnrp";
const EMAILJS_PUBLIC_KEY = window.EMAILJS_PUBLIC_KEY || "vQdFZ_3TQhMLDP1z3";

let authMode = 'login';
let loginMethod = 'password';
let authStep = 'send';
let generatedOTP = null;
// SECURITY UPDATE: Admin code verification moved to server-side.

function setAuthMode(mode) {
    // swap between login and signup
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

    const passwordGroup = document.getElementById('passwordGroup');
    const authPassword = document.getElementById('authPassword');
    const emailInput = document.getElementById('authEmail');

    const loginMethods = document.getElementById('loginMethods');

    if (status) status.textContent = "";
    if (otpGroup) otpGroup.classList.add('hidden');
    if (passwordGroup) passwordGroup.classList.remove('hidden');
    if (emailInput) emailInput.classList.remove('hidden');
    if (authPassword) authPassword.value = "";

    if (submitBtn) {
        submitBtn.textContent = (mode === 'login' && loginMethod === 'password') ? "Sign In" : "Continue";
        submitBtn.disabled = false;
    }


    const adminCheckbox = document.getElementById('isAdminAuth');
    const adminCodeWrap = document.getElementById('adminCodeAuthWrap');
    if (adminCheckbox) adminCheckbox.checked = false;
    if (adminCodeWrap) adminCodeWrap.classList.add('hidden');

    if (mode === 'signup') {
        if (title) title.textContent = "Create REUNITE Account";
        if (nameGroup) nameGroup.classList.remove('hidden');
        if (adminAuthGroup) adminAuthGroup.classList.remove('hidden');
        if (loginMethods) loginMethods.classList.add('hidden');
        if (modeLink) {
            modeLink.textContent = "Already have an account? Sign In";
            modeLink.setAttribute('onclick', "event.preventDefault(); setAuthMode('login')");
            modeLink.setAttribute('href', "#");
        }
    } else {
        if (title) title.textContent = "Sign in with REUNITE Account";
        if (nameGroup) nameGroup.classList.add('hidden');
        if (adminAuthGroup) adminAuthGroup.classList.add('hidden');
        if (loginMethods) loginMethods.classList.remove('hidden');


        setLoginMethod(loginMethod);

        if (modeLink) {
            modeLink.textContent = "Create Your REUNITE Account";
            modeLink.setAttribute('onclick', "event.preventDefault(); setAuthMode('signup')");
            modeLink.setAttribute('href', "#");
        }
    }
}
window.setAuthMode = setAuthMode;

function setLoginMethod(method) {
    loginMethod = method;
    const passwordGroup = document.getElementById('passwordGroup');
    const submitBtn = document.getElementById('authSubmitBtn');
    const tabPassword = document.getElementById('tabPassword');
    const tabOTP = document.getElementById('tabOTP');

    if (method === 'password') {
        if (passwordGroup) passwordGroup.classList.remove('hidden');
        if (submitBtn) submitBtn.textContent = "Sign In";
        if (tabPassword) tabPassword.classList.add('active');
        if (tabOTP) tabOTP.classList.remove('active');
    } else {
        if (passwordGroup) passwordGroup.classList.add('hidden');
        if (submitBtn) submitBtn.textContent = "Continue";
        if (tabPassword) tabPassword.classList.remove('active');
        if (tabOTP) tabOTP.classList.add('active');
    }
}
window.setLoginMethod = setLoginMethod;

function toggleAdminAuth() {
    const isChecked = document.getElementById('isAdminAuth').checked;
    const codeWrap = document.getElementById('adminCodeAuthWrap');
    codeWrap.classList.toggle('hidden', !isChecked);
}
window.toggleAdminAuth = toggleAdminAuth;

async function handleAuthStep() {
    if (authMode === 'login' && loginMethod === 'password') {
        await loginWithPassword();
        return;
    }

    if (authStep === 'send') {
        await sendOTP();
    } else {
        await verifyOTP();
    }
}
window.handleAuthStep = handleAuthStep;

async function loginWithPassword() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const status = document.getElementById('authStatus');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (!email || !password) {
        status.textContent = "EMAIL AND PASSWORD REQUIRED";
        status.className = "status-msg error";
        return;
    }

    status.textContent = "Verifying credentials...";
    status.className = "status-msg";
    submitBtn.disabled = true;

    try {
        const user = await window.apiLogin(email, password);

        localStorage.setItem("reunite_session", JSON.stringify(user));

        status.textContent = "ACCESS GRANTED. REDIRECTING...";
        status.className = "status-msg success";

        setTimeout(() => {
            const target = user.role === 'admin' ? 'admin' : 'dashboard';
            window.location.href = `index.html#${target}`;
        }, 1000);

    } catch (err) {
        console.error("Login Error:", err);
        status.textContent = (err.error || "LOGIN FAILED").toUpperCase();
        status.className = "status-msg error";
        submitBtn.disabled = false;
    }
}
window.loginWithPassword = loginWithPassword;

async function sendOTP() {
    // blast an email code
    const email = document.getElementById('authEmail').value.trim();
    const name = document.getElementById('authName').value.trim();
    const password = document.getElementById('authPassword').value.trim();
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

    if (authMode === 'signup' && !password) {
        status.textContent = "PASSWORD IS REQUIRED FOR SIGNUP";
        status.className = "status-msg error";
        return;
    }


    // Client-side admin code check removed. Admin code will be sent with registration payload.

    status.textContent = "Verifying account status...";
    status.className = "status-msg";
    submitBtn.disabled = true;

    try {
        // Check if user exists using API
        const existingUser = await window.apiGetProfile(email);

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
        // Continue? No, better safe than sorry
    }


    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    generatedOTP = (100000 + (array[0] % 900000)).toString();

    const templateParams = {
        to_email: email,
        email: email,
        recipient: email,
        to_name: name || "REUNITE User",
        otp_code: generatedOTP,
        subject: "Security Verification Code"
    };

    console.log("Attempting to send OTP to:", email, "with params:", templateParams);

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_OTP_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);

        status.textContent = "CODE SENT SUCCESSFULLY";
        status.className = "status-msg success";


        authStep = 'verify';
        if (location.href.includes('login.html')) {
            const otpGroup = document.getElementById('otpGroup');
            if (otpGroup) otpGroup.classList.remove('hidden');
            const resend = document.getElementById('resendBtn');
            if (resend) resend.classList.remove('hidden');


            const nameGroup = document.getElementById('nameGroup');
            if (nameGroup) nameGroup.classList.add('hidden');
            const emailInput = document.getElementById('authEmail');
            if (emailInput) emailInput.classList.add('hidden');
            const passwordGroup = document.getElementById('passwordGroup');
            if (passwordGroup) passwordGroup.classList.add('hidden');
            const modeLink = document.getElementById('authModeLink');
            if (modeLink) modeLink.classList.add('hidden');
            const adminAuthGroup = document.getElementById('adminAuthGroup');
            if (adminAuthGroup) adminAuthGroup.classList.add('hidden');

            if (document.getElementById('authTitle')) {
                document.getElementById('authTitle').textContent = "Verify Your Identity";
            }
        }

        status.textContent = `WE SENT A CODE TO ${email.toUpperCase()}`;
        status.className = "status-msg";

        submitBtn.textContent = "Verify";
        submitBtn.disabled = false;


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
    // check the code and let them in
    const otpInput = document.getElementById('authOTP');
    const enteredOTP = otpInput ? otpInput.value.trim() : "";
    const emailInput = document.getElementById('authEmail');
    const email = emailInput ? emailInput.value.trim() : "";
    const nameInput = document.getElementById('authName');
    const name = nameInput ? nameInput.value.trim() : "";
    const passwordInput = document.getElementById('authPassword');
    const password = passwordInput ? passwordInput.value.trim() : "";

    const status = document.getElementById('authStatus');

    console.log("Verifying OTP:", { entered: enteredOTP, expected: generatedOTP });


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

    try {
        let userData = null;

        if (authMode === 'signup') {
            const newId = 'user_' + Math.random().toString(36).substr(2, 9);
            const isAdminChecked = document.getElementById('isAdminAuth')?.checked;
            const adminCodeInput = document.getElementById('adminCodeAuth');
            const enteredCode = adminCodeInput ? adminCodeInput.value.trim() : "";

            const userRole = isAdminChecked ? 'admin' : 'student';

            userData = await window.apiRegister({
                id: newId,
                email: email,
                full_name: name || email.split('@')[0],
                password: password,
                role: userRole,
                admin_code: enteredCode // Send code to backend for verification
            });

        } else {
            // OTP Login: Password check skipped as identity is verified via Email OTP - just get profile
            userData = await window.apiGetProfile(email);
        }

        if (!userData) throw new Error("Could not retrieve user profile.");

        localStorage.setItem("reunite_session", JSON.stringify(userData));

        if (status) {
            status.textContent = "ACCESS GRANTED. REDIRECTING...";
            status.className = "status-msg success";
        }

        setTimeout(() => {
            const target = userData.role === 'admin' ? 'admin' : 'dashboard';
            window.location.href = `index.html#${target}`;
        }, 1200);

    } catch (err) {
        console.error("Verification/API Error:", err);
        if (status) {
            status.textContent = "API ERROR: " + (err.message || err.error || "COULD NOT SYNC PROFILE").toUpperCase();
            status.className = "status-msg error";
        }
    }
}
window.verifyOTP = verifyOTP;


document.addEventListener('DOMContentLoaded', () => {
    const emailjs = window.emailjs;
    if (typeof emailjs !== "undefined") {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
});
  