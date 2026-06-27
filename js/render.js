





const DASHBOARD_TUTORIALS = [
    {
        title: "HOW TO LOG A REPORT",
        detail: "Add vivid descriptors (stickers, engravings, passcodes) to help admins verify faster.",
        action: "Review report tips"
    },
    {
        title: "SPEED UP CLAIM APPROVAL",
        detail: "Upload proof photos or receipts before submitting a claim for instant verification cues.",
        action: "Prep documents"
    },
    {
        title: "FOLLOW UP LIKE A PRO",
        detail: "Check this dashboard daily. Approved items appear here before the public feed updates.",
        action: "Enable notifications"
    }
];

function renderDashboardTips() {
    const tipsEl = document.getElementById('dashboardTips');
    if (!tipsEl) return;
    tipsEl.innerHTML = DASHBOARD_TUTORIALS.map(t => `
        <div class="tip-card">
            <span>${t.action}</span>
            <strong>${t.title}</strong>
            <p>${t.detail}</p>
        </div>
    `).join('');
}
window.renderDashboardTips = renderDashboardTips;

function updateActiveFilters({ searchTokens = [], category = "", location = "" }) {
    const filtersEl = document.getElementById('activeFilters');
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (!filtersEl || !clearBtn) return;

    const tags = [];
    if (searchTokens.length) {
        tags.push(`Keywords: ${searchTokens.join(', ')}`);
    }
    if (category) {
        tags.push(`Category: ${category}`);
    }
    if (location) {
        tags.push(`Location: ${location}`);
    }

    if (!tags.length) {
        filtersEl.textContent = "No filters active.";
        clearBtn.classList.add('hidden');
        return;
    }

    filtersEl.innerHTML = tags.map(tag => `<span class="filter-chip">${tag}</span>`).join('');
    clearBtn.classList.remove('hidden');
}
window.updateActiveFilters = updateActiveFilters;

function updateResultsStatus(totalApproved, shownCount, { searchTokens = [], category = "", location = "" }) {
    const statusEl = document.getElementById('resultsStatus');
    if (!statusEl) return;

    if (totalApproved === 0) {
        statusEl.textContent = "Awaiting approved inventory.";
        return;
    }

    if (!searchTokens.length && !category && !location) {
        statusEl.textContent = "Most recent first.";
        return;
    }

    const bits = [];
    if (searchTokens.length) bits.push(`keywords "${searchTokens.join(', ')}"`);
    if (category) bits.push(`category ${category}`);
    if (location) bits.push(`location "${location}"`);

    statusEl.textContent = `Filtered ${shownCount} of ${totalApproved} via ${bits.join(' + ')}`;
}
window.updateResultsStatus = updateResultsStatus;

function clearFilters() {
    const searchField = document.getElementById('searchFilter');
    const categoryField = document.getElementById('categoryFilter');
    const locationField = document.getElementById('locationFilter');
    const sortField = document.getElementById('sortFilter');

    if (searchField) searchField.value = "";
    if (categoryField) categoryField.value = "";
    if (locationField) locationField.value = "";
    if (sortField) sortField.value = "newest";

    renderFound();
}
window.clearFilters = clearFilters;

function renderFound() {
    // draw the item grid
    if (!window.items) return;
    const grid = document.getElementById('itemsGrid');
    if (!grid) return;


    const headerInput = document.getElementById('headerSearchInput');
    const headerSearchVal = headerInput?.value || "";
    const pageSearchVal = document.getElementById('searchFilter')?.value || "";


    const foundSection = document.getElementById('page-found');
    if (foundSection) {
        const isSearchFocused = document.activeElement === headerInput;
        const hasSearchText = headerSearchVal.trim().length > 0;

        if (hasSearchText || isSearchFocused) {
            foundSection.classList.add('search-active');
        } else {
            foundSection.classList.remove('search-active');
        }
    }

    const search = (pageSearchVal || headerSearchVal).toLowerCase().trim();
    const cat = document.getElementById('categoryFilter')?.value || "";
    const loc = document.getElementById('locationFilter')?.value.toLowerCase() || "";
    const sort = document.getElementById('sortFilter')?.value || "newest";

    console.log("renderFound called with:", { totalItems: window.items.length, search, cat, loc, sort });

    let filtered = window.items.filter(it => (it.status || "").toLowerCase().trim() === 'approved');

    // Separate claimed items
    const claimed = window.items.filter(it => (it.status || "").toLowerCase().trim() === 'claimed');
    renderClaimedItems(claimed);


    if (search) {
        const searchTokens = search.split(/\s+/);
        filtered = filtered.filter(item => {
            const titleMatch = searchTokens.every(token => window.isFuzzyMatch(item.title, token));
            const descMatch = searchTokens.every(token => window.isFuzzyMatch(item.description, token));
            const catMatch = searchTokens.every(token => window.isFuzzyMatch(item.category, token));
            return titleMatch || descMatch || catMatch;
        });
        updateActiveFilters({ searchTokens, category: cat, location: loc });
        updateResultsStatus(window.items.filter(it => it.status === 'approved').length, filtered.length, { searchTokens, category: cat, location: loc });
    } else {
        updateActiveFilters({ category: cat, location: loc });
        updateResultsStatus(window.items.filter(it => it.status === 'approved').length, filtered.length, { category: cat, location: loc });
    }

    if (cat) filtered = filtered.filter(i => i.category === cat);
    if (loc) filtered = filtered.filter(i => i.location.toLowerCase().includes(loc));

    if (sort === 'newest') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    console.log("Final filtered items to display:", filtered.length);

    const countEl = document.getElementById('itemsCount');
    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="status-msg">NO ITEMS FOUND IN DATABASE</div>';
        return;
    }

    grid.innerHTML = filtered.map((item, idx) => renderFpCard(item, idx)).join('');
}
window.renderFound = renderFound;

/* ---- pastel-striped card for the Browse / Visual Search page ---- */
const FP_CAT_HUE = {
    'keys': 50, 'wallet': 30, 'phone': 350, 'bag': 280,
    'bottle': 200, 'paper': 130, 'optical': 160, 'audio': 0,
    'cable': 240, 'apparel': 320, 'other': 220
};
function fpCategoryHue(cat) {
    const k = (cat || 'other').toString().toLowerCase().trim();
    return (FP_CAT_HUE[k] !== undefined) ? FP_CAT_HUE[k] : 220;
}
function fpRelativeTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    const h = Math.floor((Date.now() - d.getTime()) / 36e5);
    if (h < 1) return 'just now';
    if (h < 24) return h + 'h ago';
    const days = Math.floor(h / 24);
    if (days === 1) return 'yesterday';
    if (days < 7)   return d.toLocaleDateString(undefined, { weekday: 'short' });
    return d.toLocaleDateString();
}
function fpEscHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function renderFpCard(item, idx) {
    const hue = fpCategoryHue(item.category);
    const bg  = `oklch(0.88 0.06 ${hue})`;
    const fg  = `oklch(0.40 0.14 ${hue})`;
    const cat = (item.category || 'other').toString().toUpperCase();
    const title = fpEscHtml(item.title || 'Untitled');
    const loc   = fpEscHtml(item.location || '');
    const when  = fpRelativeTime(item.date_found || item.created_at);
    const patternId = 'fp-stp-' + fpEscHtml(item.id || idx);

    const photoInner = item.image
        ? `<img src="${fpEscHtml(item.image)}" alt="${title}" loading="lazy">`
        : `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
             <defs>
               <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                 <rect width="5" height="5" fill="${bg}"/>
                 <line x1="0" y1="0" x2="0" y2="5" stroke="${fg}" stroke-opacity="0.22" stroke-width="1"/>
               </pattern>
             </defs>
             <rect width="100" height="100" fill="url(#${patternId})"/>
           </svg>
           <div class="fp-photo-label" style="color:${fg}">${cat}</div>`;

    return `
        <button class="item-card" onclick="openItemModal('${fpEscHtml(item.id)}')" type="button"
                aria-label="View details for ${title}" title="View details for ${title}">
            <div class="fp-photo" style="background:${bg}">
                ${photoInner}
                <span class="fp-tag">${cat}</span>
            </div>
            <div class="fp-body">
                <h3 class="fp-title">${title}</h3>
                <div class="fp-meta">
                    <span>${loc}</span>
                    <span>${when}</span>
                </div>
            </div>
        </button>
    `;
}
window.renderFpCard = renderFpCard;

function renderClaimedItems(claimedItems) {
    const grid = document.getElementById('claimedItemsGrid');
    if (!grid) return;

    if (claimedItems.length === 0) {
        grid.innerHTML = '<div class="status-msg">NO RECENTLY CLAIMED ITEMS</div>';
        return;
    }

    // Compact archive rows — claimed items are history, not browsable inventory
    grid.innerHTML = claimedItems.map(item => {
        const hue = fpCategoryHue(item.category);
        const bg  = `oklch(0.88 0.06 ${hue})`;
        const fg  = `oklch(0.40 0.14 ${hue})`;
        const cat = (item.category || 'other').toString().slice(0, 4).toUpperCase();
        const title = fpEscHtml(item.title || 'Untitled');
        const loc   = fpEscHtml(item.location || '—');
        const when  = fpRelativeTime(item.date_found || item.created_at);
        const thumb = item.image
            ? `<img class="cl-thumb" src="${fpEscHtml(item.image)}" alt="" loading="lazy">`
            : `<div class="cl-thumb cl-thumb-ph" style="background:${bg};color:${fg}">${cat}</div>`;
        return `
            <div class="cl-row">
                ${thumb}
                <div class="cl-info">
                    <div class="cl-title">${title}</div>
                    <div class="cl-meta">${loc} &middot; ${when}</div>
                </div>
                <span class="cl-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Retrieved
                </span>
            </div>
        `;
    }).join('');
}
window.renderClaimedItems = renderClaimedItems;

function toggleClaimedItems() {
    const wrapper = document.getElementById('claimedItemsWrapper');
    const btn = document.getElementById('toggleClaimedBtn');
    if (!wrapper || !btn) return;

    const isHidden = wrapper.classList.toggle('hidden');
    btn.innerHTML = isHidden ?
        'SHOW PAST CLAIMED ITEMS <svg class="btn-icon" style="margin-left: 0.5rem;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>' :
        'HIDE PAST CLAIMED ITEMS <svg class="btn-icon" style="margin-left: 0.5rem;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';

    if (!isHidden) {
        // Scroll the content card so the claimed section comes into view
        const scrollContainer = document.querySelector('#page-found .content-wrapper');
        if (scrollContainer) {
            requestAnimationFrame(() => {
                scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
            });
        }
    }
}
window.toggleClaimedItems = toggleClaimedItems;

function renderClaimSelect() {
    const select = document.getElementById('claimItemId');
    if (!select) return;
    const approved = window.items.filter(i => i.status === 'approved');
    select.innerHTML = approved.map(i => `<option value="${i.id}">${i.title} (${i.location})</option>`).join('');

    const pre = sessionStorage.getItem('reunite_selected_id');
    if (pre) select.value = pre;
}
window.renderClaimSelect = renderClaimSelect;

function renderDashboard() {
    // show user their history
    if (!window.currentUser) return;
    const reportsEl = document.getElementById('myReports');
    const claimsEl = document.getElementById('myClaims');
    const countActiveReportsEl = document.getElementById('countActiveReports');
    const countPendingClaimsEl = document.getElementById('countPendingClaims');
    const repCountEl = document.getElementById('repCount');
    const claimCountEl = document.getElementById('claimCount');
    const userNameEl = document.getElementById('dashboardUserName');

    const myReports = window.items.filter(i => i.contact_email === window.currentUser.email);
    const myClaims = window.claims.filter(c => c.claimant_email === window.currentUser.email);

    if (userNameEl) userNameEl.textContent = window.currentUser.full_name || window.currentUser.name || "User";
    if (countActiveReportsEl) countActiveReportsEl.textContent = myReports.length;
    if (repCountEl) repCountEl.textContent = myReports.length;
    if (countPendingClaimsEl) countPendingClaimsEl.textContent = myClaims.filter(c => c.status === 'pending').length;
    if (claimCountEl) claimCountEl.textContent = myClaims.length;

    if (reportsEl) reportsEl.innerHTML = myReports.length ? myReports.map(r => {
        const isAppr = (r.status || "").toLowerCase().trim() === 'approved';
        return `
            <div class="list-item">
                <div class="item-info">
                  <div class="ref-code">REF: ${r.id.substring(5, 13).toUpperCase()}</div>
                  <strong>${r.title}</strong>
                </div>
                <div class="status-badge ${isAppr ? 'approved' : 'pending'}">
                  ${(r.status || "PENDING").toUpperCase()}
                </div>
            </div>
        `;
    }).join('') : '<div class="status-msg">NO REPORTS LOGGED</div>';

    if (claimsEl) claimsEl.innerHTML = myClaims.length ? myClaims.map(c => {
        const item = window.items.find(i => i.id === c.item_id);
        const isAppr = (c.status || "").toLowerCase().trim() === 'approved';
        return `
            <div class="list-item">
                <div class="item-info">
                  <div class="ref-code">CLAIM ID: ${c.id.substring(6, 14).toUpperCase()}</div>
                  <strong>${item?.title || 'Unknown Item'}</strong>
                </div>
                <div class="status-badge ${isAppr ? 'approved' : 'pending'}">
                  ${(c.status || "PENDING").toUpperCase()}
                </div>
            </div>
        `;
    }).join('') : '<div class="status-msg">NO CLAIMS IN PROGRESS</div>';

    renderDashboardTips();
}
window.renderDashboard = renderDashboard;

function renderAdmin() {
    // the master view
    if (!window.currentUser || window.currentUser.role !== 'admin') return;


    const pending = window.items.filter(i => (i.status || "").toLowerCase().trim() === 'pending');
    const pendingClaims = window.claims.filter(c => (c.status || "").toLowerCase().trim() === 'pending');
    const approved = window.items.filter(i => (i.status || "").toLowerCase().trim() === 'approved');
    const verified = window.claims.filter(c => (c.status || "").toLowerCase().trim() === 'approved');


    const stats = {
        'adminTotalReports': window.items.length,
        'adminPendingApprovals': pending.length,
        'adminPendingClaims': pendingClaims.length,
        'adminLiveInventory': approved.length,
        'adminPendingCount': pending.length,
        'adminClaimQueueCount': pendingClaims.length,
        'adminApprovedCount': approved.length,
        'adminVerifiedCount': verified.length
    };

    Object.entries(stats).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });

    renderAdminAudit();


    const pendingEl = document.getElementById('adminPendingItems');
    if (pendingEl) pendingEl.innerHTML = pending.length ? pending.map(i => `
        <div class="list-item clickable" onclick="openAdminDetailModal('report', '${i.id}')">
            <div style="display: flex; align-items: center; gap: 1rem;">
              ${i.image ? `<img src="${i.image}" class="admin-thumb" alt="Item">` : '<div class="admin-thumb admin-thumb-missing" style="background: #fff3cd; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; color: #ff9500; border: 1px dashed #ff9500;">?</div>'}
              <div class="item-info">
                <div class="ref-code">REF: ${i.id.substring(5, 13).toUpperCase()}</div>
                <strong>${i.title}</strong>
                ${!i.image ? '<span style="font-size: 0.65rem; color: #ff9500; display: block;">NO IMAGE ATTACHED</span>' : ''}
              </div>
            </div>
            <div class="admin-actions-inline" onclick="event.stopPropagation()">
                ${!i.image ? `<button onclick="requestItemPhoto('${i.id}')" class="btn btn-sm btn-outline orange">REQUEST PHOTO</button>` : ''}
                <button onclick="approveItem('${i.id}')" class="btn btn-sm btn-outline blue">APPROVE</button>
                <button onclick="rejectItem('${i.id}')" class="btn btn-sm btn-outline red">REJECT</button>
            </div>
        </div>
    `).join('') : '<div class="status-msg">NO PENDING REPORTS</div>';

    const claimsEl = document.getElementById('adminClaims');
    if (claimsEl) claimsEl.innerHTML = pendingClaims.length ? pendingClaims.map(c => {
        const item = window.items.find(it => it.id === c.item_id);
        return `
            <div class="list-item clickable" onclick="openAdminDetailModal('claim', '${c.id}')">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  ${c.image ? `<img src="${c.image}" class="admin-thumb" alt="Proof">` : `<div class="admin-thumb admin-thumb-missing" style="background: #fff3cd; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; color: #ff9500; border: 1px dashed #ff9500;">?</div>`}
                  <div class="item-info">
                    <div class="ref-code">CLAIM BY: ${c.claimant_name.toUpperCase()}</div>
                    <strong>${item?.title || 'Unknown Item'}</strong>
                    ${!c.image ? '<span style="font-size: 0.65rem; color: #ff9500; display: block;">NO PROOF IMAGE</span>' : ''}
                  </div>
                </div>
                <div class="admin-actions-inline" onclick="event.stopPropagation()">
                    <button onclick="requestClaimDetails('${c.id}')" class="btn btn-sm btn-outline orange">REQUEST DETAILS</button>
                    <button onclick="approveClaim('${c.id}')" class="btn btn-sm btn-outline blue">VERIFY</button>
                </div>
            </div>
        `;
    }).join('') : '<div class="status-msg">NO PENDING CLAIMS</div>';

    const approvedEl = document.getElementById('adminApprovedItems');
    if (approvedEl) approvedEl.innerHTML = approved.length ? approved.map(i => `
        <div class="list-item">
            <div class="item-info">
              <div class="ref-code">ID: ${i.id.substring(0, 8)}</div>
              <strong>${i.title}</strong>
            </div>
            <button onclick="deleteItem('${i.id}')" class="btn btn-sm btn-outline red">DELETE</button>
        </div>
    `).join('') : '<div class="status-msg">EMPTY</div>';

    const verifiedEl = document.getElementById('adminVerifiedClaims');
    if (verifiedEl) verifiedEl.innerHTML = verified.length ? verified.map(c => {
        const item = window.items.find(it => it.id === c.item_id);
        return `
            <div class="list-item">
                <div class="item-info">
                  <div class="ref-code">VERIFIED FOR: ${c.claimant_name.toUpperCase()}</div>
                  <strong>${item?.title || 'Unknown Item'}</strong>
                </div>
                <button onclick="deleteClaim('${c.id}')" class="btn btn-sm btn-outline red">PURGE</button>
            </div>
        `;
    }).join('') : '<div class="status-msg">EMPTY</div>';
}
window.renderAdmin = renderAdmin;
async function renderAdminAudit() {
    const listEl = document.getElementById('adminAuditList');
    if (!listEl) return;

    try {
        const logs = await window.apiGetAuditLogs();
        if (!logs || logs.length === 0) {
            listEl.innerHTML = '<div class="loading-text">NO AUDIT LOGS FOUND.</div>';
            return;
        }

        listEl.innerHTML = logs.map(log => {
            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let actionClass = 'action-update';
            if (log.action.includes('LOGIN')) actionClass = 'action-login';
            else if (log.action.includes('REGISTER')) actionClass = 'action-register';
            else if (log.action.includes('CREATE')) actionClass = 'action-create';
            else if (log.action.includes('DELETE')) actionClass = 'action-delete';

            return `
                <div class="audit-entry">
                    <div class="audit-time" data-label="Time">${timeStr}</div>
                    <div class="audit-user" data-label="User" title="${log.userEmail}">${log.userEmail.split('@')[0]}</div>
                    <div class="audit-action" data-label="Action">
                        <span class="audit-action-tag ${actionClass}">${log.action.replace('USER_', '').replace('ITEM_', '').replace('CLAIM_', '')}</span>
                    </div>
                    <div class="audit-resource" data-label="Resource" title="ID: ${log.resourceId || 'N/A'}">
                        ${log.resourceType}: ${log.details?.title || log.resourceId || 'N/A'}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Audit render failed:', err);
        listEl.innerHTML = '<div class="loading-text" style="color: #ff4d4d;">FAILED TO LOAD AUDIT LOGS.</div>';
    }
}
window.renderAdminAudit = renderAdminAudit;
