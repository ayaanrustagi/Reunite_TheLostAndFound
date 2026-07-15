/**
 * @file api-client.js
 * @description Frontend API Client handling AJAX operations for authentication, item reports, claims, messages, and audit trails.
 * Synchronizes client-side state with the backend database.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const API_BASE = '/api';

/**
 * Synchronizes local in-memory items and claims with the backend.
 * Triggered on load and after major mutations to refresh lists across all active views.
 * 
 * @async
 * @function apiSync
 * @returns {Promise<void>}
 */
async function apiSync() {
    // pull data from the cloud
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

        requestAnimationFrame(() => {
            if (window.renderFound) window.renderFound();
            if (window.renderClaimSelect) window.renderClaimSelect();
            if (window.renderDashboard) window.renderDashboard();
            if (window.renderAdmin) window.renderAdmin();
        });

    } catch (err) {
        console.error("SYNC FAILED:", err);
    }
}
window.apiSync = apiSync;

/**
 * Create or update a resource record on the server (upsert).
 * Appends active session details as the requester metadata for security auditing.
 * 
 * @async
 * @function apiUpsert
 * @param {String} resource - The REST resource endpoint ('items', 'claims', etc.)
 * @param {Object} record - The payload body representing the entity to save
 * @returns {Promise<Boolean>} True if successful, false otherwise
 */
async function apiUpsert(resource, record) {
    // push new records
    try {
        const method = 'POST'; // We will use POST for upsert logic handled by backend or PUT
        // Actually backend implementation uses POST to root for upsert

        const session = JSON.parse(localStorage.getItem("reunite_session") || "null");
        if (session) {
            record._requester = {
                id: session.id,
                email: session.email
            };
        }

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
        return true;
    } catch (err) {
        console.error(`API ERROR (${resource}):`, err);
        if (window.showError) window.showError(err.message);
        return false;
    }
}
window.apiUpsert = apiUpsert;

/**
 * Delete a resource by ID. Appends requester credentials to satisfy backend audit logging.
 * 
 * @async
 * @function apiDelete
 * @param {String} resource - The REST endpoint resource ('items', 'claims')
 * @param {String} id - The specific document identifier to remove
 * @returns {Promise<void>}
 */
async function apiDelete(resource, id) {
    // nuke a record
    try {
        const session = JSON.parse(localStorage.getItem("reunite_session") || "null");
        const url = new URL(`${window.location.origin}${API_BASE}/${resource}/${id}`);
        if (session) {
            url.searchParams.append('requester_id', session.id);
            url.searchParams.append('requester_email', session.email);
        }

        await fetch(url.toString(), { method: 'DELETE' });
    } catch (err) {
        console.error(`DELETE ERROR:`, err);
    }
}
window.apiDelete = apiDelete;

/**
 * Authenticates user credentials with the backend.
 * 
 * @async
 * @function apiLogin
 * @param {String} email - User email address
 * @param {String} password - User password
 * @returns {Promise<Object>} The authenticated user object
 */
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

/**
 * Register a new user in the system.
 * 
 * @async
 * @function apiRegister
 * @param {Object} userData - Full user record payload including password, role, name, etc.
 * @returns {Promise<Object>} The newly created user object
 */
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

/**
 * Securely retrieve a user profile by email.
 * 
 * @async
 * @function apiGetProfile
 * @param {String} email - Email query parameter
 * @returns {Promise<Object|null>} Profile details or null if fetch fails
 */
async function apiGetProfile(email) {
    const res = await fetch(`${API_BASE}/auth/profile?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return await res.json();
}
window.apiGetProfile = apiGetProfile;

/**
 * Fetch the latest security audit logs for system overview.
 * 
 * @async
 * @function apiGetAuditLogs
 * @returns {Promise<Array>} List of recent audit log entries
 */
async function apiGetAuditLogs() {
    const res = await fetch(`${API_BASE}/audit`);
    if (!res.ok) return [];
    return await res.json();
}
window.apiGetAuditLogs = apiGetAuditLogs;

/**
 * Retrieve messages delivered to the designated email address.
 * Passes X-User-Id header for session validation.
 * 
 * @async
 * @function apiGetMessages
 * @param {String} email - Recipient email address
 * @returns {Promise<Array>} List of messages
 */
async function apiGetMessages(email) {
    try {
        const session = JSON.parse(localStorage.getItem("reunite_session") || "null");
        const headers = {};
        if (session && session.id) {
            headers['X-User-Id'] = session.id;
        }
        const res = await fetch(`${API_BASE}/messages?email=${encodeURIComponent(email)}`, {
            headers: headers
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        return await res.json();
    } catch (err) {
        console.error("GET MESSAGES FAILED:", err);
        return [];
    }
}
window.apiGetMessages = apiGetMessages;

/**
 * Sends a message related to a specific claim or general inquiry.
 * Generates a unique message ID and appends session headers.
 * 
 * @async
 * @function apiSendMessage
 * @param {Object} msgData - The message payload
 * @returns {Promise<Object>} Server response body
 */
async function apiSendMessage(msgData) {
    const session = JSON.parse(localStorage.getItem("reunite_session") || "null");
    const payload = {
        ...msgData,
        id: msgData.id || "msg_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now(),
        _requester: session ? { id: session.id, email: session.email } : { id: 'guest', email: msgData.sender_email || 'guest' }
    };
    const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw await res.json();
    return await res.json();
}
window.apiSendMessage = apiSendMessage;

// Initial sync is handled by app.js
// but we expect window.items and window.claims to be available globally
window.items = window.items || [];
window.claims = window.claims || [];

   