





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
        statusEl.textContent = "Showing most recent approved records.";
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

    grid.innerHTML = filtered.map(item => `
        <button class="item-card" onclick="openItemModal('${item.id}')" type="button" aria-label="View details for ${item.title}">
            ${item.image ? `<div class="card-image-wrap"><img src="${item.image}" class="card-thumb" alt="${item.title}" loading="lazy"></div>` : ''}
            <div class="card-meta">${item.category} / FOUND ${new Date(item.date_found).toLocaleDateString()}</div>
            <h3 class="card-title">${item.title}</h3>
            <p class="card-desc">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
            <div class="card-footer">
                <span>${item.location}</span>
                <span>ID: ${item.id.substring(0, 8)}</span>
            </div>
        </button>
    `).join('');
}
window.renderFound = renderFound;

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


    const pendingEl = document.getElementById('adminPendingItems');
    if (pendingEl) pendingEl.innerHTML = pending.length ? pending.map(i => `
        <div class="list-item">
            <div style="display: flex; align-items: center; gap: 1rem;">
              ${i.image ? `<img src="${i.image}" class="admin-thumb" alt="Item">` : '<div class="admin-thumb admin-thumb-missing" style="background: #fff3cd; display: flex; align-items: center; justify-content: center; font-size: 1rem; border: 1px dashed #ff9500;">📷</div>'}
              <div class="item-info">
                <div class="ref-code">REF: ${i.id.substring(5, 13).toUpperCase()}</div>
                <strong>${i.title}</strong>
                ${!i.image ? '<span style="font-size: 0.65rem; color: #ff9500; display: block;">NO IMAGE ATTACHED</span>' : ''}
              </div>
            </div>
            <div class="admin-actions-inline">
                ${!i.image ? `<button onclick="requestItemPhoto('${i.id}')" class="btn-sm btn-outline" style="border-color:#ff9500; color:#ff9500;">REQUEST PHOTO</button>` : ''}
                <button onclick="approveItem('${i.id}')" class="btn-sm btn-outline">APPROVE</button>
                <button onclick="rejectItem('${i.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">REJECT</button>
            </div>
        </div>
    `).join('') : '<div class="status-msg">NO PENDING REPORTS</div>';

    const claimsEl = document.getElementById('adminClaims');
    if (claimsEl) claimsEl.innerHTML = pendingClaims.length ? pendingClaims.map(c => {
        const item = window.items.find(it => it.id === c.item_id);
        return `
            <div class="list-item">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  ${c.image ? `<img src="${c.image}" class="admin-thumb" alt="Proof">` : `<div class="admin-thumb admin-thumb-missing" style="background: #fff3cd; display: flex; align-items: center; justify-content: center; font-size: 1rem; border: 1px dashed #ff9500;">📷</div>`}
                  <div class="item-info">
                    <div class="ref-code">CLAIM BY: ${c.claimant_name.toUpperCase()}</div>
                    <strong>${item?.title || 'Unknown Item'}</strong>
                    ${!c.image ? '<span style="font-size: 0.65rem; color: #ff9500; display: block;">NO PROOF IMAGE</span>' : ''}
                  </div>
                </div>
                <div class="admin-actions-inline">
                    <button onclick="requestClaimDetails('${c.id}')" class="btn-sm btn-outline" style="border-color:#ff9500; color:#ff9500;">REQUEST DETAILS</button>
                    <button onclick="approveClaim('${c.id}')" class="btn-sm btn-outline">VERIFY</button>
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
            <button onclick="deleteItem('${i.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">DELETE</button>
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
                <button onclick="deleteClaim('${c.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">PURGE</button>
            </div>
        `;
    }).join('') : '<div class="status-msg">EMPTY</div>';
}
window.renderAdmin = renderAdmin;
