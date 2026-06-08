

function initializeSupabase() {
    console.log("window.supabase available:", typeof window.supabase !== "undefined");


    if (typeof window.supabase === "undefined") {
        console.log("Loading Supabase dynamically...");
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.js';
        script.onload = () => {
            console.log("Supabase script loaded dynamically");
            createSupabaseClient();
        };
        script.onerror = () => {
            console.error("Failed to load Supabase script dynamically");
        };
        document.head.appendChild(script);
    } else {
        createSupabaseClient();
    }
}
window.initializeSupabase = initializeSupabase;

function createSupabaseClient() {
    console.log("Creating Supabase client...");
    if (typeof window.supabase !== "undefined" && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        try {
            window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            window.SUPABASE_ENABLED = !!window.supabaseClient;
            if (window.SUPABASE_ENABLED) {
                console.log("🟢 SUPABASE CLIENT INITIALIZED");

                checkInitialSession();

                window.supabaseClient.auth.onAuthStateChange((event, session) => {
                    console.log("Auth status change:", event);
                    handleSessionUpdate(session);
                });
            }
        } catch (e) {
            console.error("🔴 SUPABASE INIT ERROR:", e);
        }
    }
}
window.createSupabaseClient = createSupabaseClient;

async function checkInitialSession() {
    if (!window.supabaseClient) return;
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    handleSessionUpdate(session);
}
window.checkInitialSession = checkInitialSession;

function handleSessionUpdate(session) {
    if (session && session.user) {
        const user = session.user;
        window.currentUser = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            role: user.user_metadata?.role || 'student'
        };

        localStorage.setItem("reunite_session", JSON.stringify(window.currentUser));
    } else {

        const manualSession = localStorage.getItem("reunite_session");
        if (manualSession) {
            try {
                window.currentUser = JSON.parse(manualSession);
                console.log("🟢 USING MANUAL SESSION:", window.currentUser);
            } catch (e) {
                window.currentUser = null;
            }
        } else {
            window.currentUser = null;
        }
    }

    if (window.updateAuthUI) window.updateAuthUI();


    if (window.currentUser) {
        syncFromSupabase();
    }
}
window.handleSessionUpdate = handleSessionUpdate;


let isSyncing = false;
async function syncFromSupabase() {
    if (!window.SUPABASE_ENABLED || isSyncing) return;
    isSyncing = true;
    console.log("🔄 STARTING SMART SYNC...");

    try {
        const [itRes, clRes] = await Promise.all([
            window.supabaseClient.from('items').select('*'),
            window.supabaseClient.from('claims').select('*')
        ]);

        if (itRes.error) throw itRes.error;
        if (clRes.error) throw clRes.error;

        window.items = itRes.data || [];
        window.claims = clRes.data || [];


        window.items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        console.log(`✅ SYNC SUCCESS: ${window.items.length} items cached.`);


        requestAnimationFrame(() => {
            if (window.renderFound) window.renderFound();
            if (window.renderClaimSelect) window.renderClaimSelect();
            if (window.renderDashboard) window.renderDashboard();
            if (window.renderAdmin) window.renderAdmin();
            isSyncing = false;
        });

    } catch (err) {
        console.error('🔴 SYNC FAILED:', err.message || err);
        isSyncing = false;
    }
}
window.syncFromSupabase = syncFromSupabase;

async function supabaseUpsert(table, record) {
    if (!window.SUPABASE_ENABLED) {
        console.warn(`Supabase disabled. Cannot save to ${table}.`);
        return false;
    }
    try {
        console.log(`📤 SAVING TO ${table}...`, record);
        const { error } = await window.supabaseClient.from(table).upsert(record);

        if (error) {
            console.error(`🔴 SUPABASE ERROR (${table}):`, error.message);
            alert(`DATABASE ERROR: ${error.message}\n\nCheck if table columns match exactly and RLS is disabled.`);
            return false;
        }

        console.log(`✅ ${table} RECORD UPDATED SUCCESSFULLY`);
        return true;
    } catch (err) {
        console.error(`🔴 CRITICAL FAIL (${table}):`, err);
        return false;
    }
}
window.supabaseUpsert = supabaseUpsert;

async function supabaseDelete(table, id) {
    if (!window.SUPABASE_ENABLED) return;
    try {
        await window.supabaseClient.from(table).delete().eq('id', id);
    } catch (err) {
        console.warn(`Supabase delete failed for ${table}`, err);
    }
}
window.supabaseDelete = supabaseDelete;

async function handleLogout() {
    showLoading("Signing out...");


    if (window.SUPABASE_ENABLED && window.supabaseClient) {
        try {
            await window.supabaseClient.auth.signOut();
        } catch (error) {
            console.error("Supabase logout error:", error.message);
        }
    }


    localStorage.removeItem("reunite_session");
    window.currentUser = null;

    hideLoading();

    if (window.updateAuthUI) window.updateAuthUI();
    if (window.navigateToSection) window.navigateToSection('hero');
}
window.handleLogout = handleLogout;


function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const adminBtn = document.getElementById('adminBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileDashboardBtn = document.getElementById('mobileDashboardBtn');
    const mobileAdminBtn = document.getElementById('mobileAdminBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

    if (!loginBtn || !dashboardBtn || !adminBtn || !logoutBtn) return;

    if (window.currentUser) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
        if (mobileLogoutBtn) mobileLogoutBtn.classList.remove('hidden');

        if (window.currentUser.role === 'admin') {
            adminBtn.classList.remove('hidden');
            dashboardBtn.classList.add('hidden');
            if (mobileAdminBtn) mobileAdminBtn.classList.remove('hidden');
            if (mobileDashboardBtn) mobileDashboardBtn.classList.add('hidden');
        } else {
            dashboardBtn.classList.remove('hidden');
            adminBtn.classList.add('hidden');
            if (mobileDashboardBtn) mobileDashboardBtn.classList.remove('hidden');
            if (mobileAdminBtn) mobileAdminBtn.classList.add('hidden');
        }
    } else {
        loginBtn.classList.remove('hidden');
        dashboardBtn.classList.add('hidden');
        adminBtn.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        if (mobileLoginBtn) mobileLoginBtn.classList.remove('hidden');
        if (mobileDashboardBtn) mobileDashboardBtn.classList.add('hidden');
        if (mobileAdminBtn) mobileAdminBtn.classList.add('hidden');
        if (mobileLogoutBtn) mobileLogoutBtn.classList.add('hidden');
    }
}
window.updateAuthUI = updateAuthUI;
