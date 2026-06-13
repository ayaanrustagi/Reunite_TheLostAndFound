const API_BASE = '/api';

async function apiSync() {
    console.log("🔄 STARTING API SYNC...");
    try {
        const [itemsRes, claimsRes] = await Promise.all([
            fetch(`${API_BASE}/items`),
            fetch(`${API_BASE}/claims`)
        ]);

        if (!itemsRes.ok) throw new Error("Failed to fetch items");
        if (!claimsRes.ok) throw new Error("Failed to fetch claims");

        window.items = await itemsRes.json();
        window.claims = await claimsRes.json();

        // Sort items by date desc
        window.items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        console.log(`✅ SYNC SUCCESS: ${window.items.length} items cached.`);

        requestAnimationFrame(() => {
            if (window.renderFound) window.renderFound();
            if (window.renderClaimSelect) window.renderClaimSelect();
            if (window.renderDashboard) window.renderDashboard();
            if (window.renderAdmin) window.renderAdmin();
        });

    } catch (err) {
        console.error("🔴 SYNC FAILED:", err);
    }
}
window.apiSync = apiSync;


async function apiUpsert(resource, record) {
    try {
        console.log(`📤 UPSERTING TO ${resource}...`, record);
        const method = 'POST'; // We will use POST for upsert logic handled by backend or PUT
        // Actually backend implementation uses POST to root for upsert

        const res = await fetch(`${API_BASE}/${resource}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Request failed");
        }

        const data = await res.json();
        console.log(`✅ ${resource} RECORD UPSERTED`, data);
        return true;
    } catch (err) {
        console.error(`🔴 API ERROR (${resource}):`, err);
        alert(`API ERROR: ${err.message}`);
        return false;
    }
}
window.apiUpsert = apiUpsert;

async function apiDelete(resource, id) {
    try {
        await fetch(`${API_BASE}/${resource}/${id}`, { method: 'DELETE' });
        console.log(`✅ ${resource} ${id} DELETED`);
    } catch (err) {
        console.error(`🔴 DELETE ERROR:`, err);
    }
}
window.apiDelete = apiDelete;

// Authorization related
async function apiLogin(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw await res.json();
    return await res.json();
}
window.apiLogin = apiLogin;

async function apiRegister(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    if (!res.ok) throw await res.json();
    return await res.json();
}
window.apiRegister = apiRegister;

async function apiGetProfile(email) {
    const res = await fetch(`${API_BASE}/auth/profile?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return await res.json();
}
window.apiGetProfile = apiGetProfile;

// Initial sync is handled by app.js
// but we expect window.items and window.claims to be available globally
window.items = window.items || [];
window.claims = window.claims || [];
