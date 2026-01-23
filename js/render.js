
// ------------------------------
// Rendering Logic
// ------------------------------

// Dashboard Tutorials Data
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
    // Stub implementation if original was missing
    // or checks for an element to render tips into
    console.log("Rendering dashboard tips...");
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

    // Get search inputs from both possible sources (header or page)
    const headerInput = document.getElementById('headerSearchInput');
    const headerSearchVal = headerInput?.value || "";
    const pageSearchVal = document.getElementById('searchFilter')?.value || "";

    // Toggle pure search mode if using header search is active (focused or has text)
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

    // Apply Fuzzy Search
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
        <div class="item-card" onclick="openItemModal('${item.id}')" style="contain: content;">
            ${item.image ? `<div class="card-image-wrap"><img src="${item.image}" class="card-thumb" alt="${item.title}" loading="lazy"></div>` : ''}
            <div class="card-content-wrap">
              <div class="card-meta">${item.category} / FOUND ${new Date(item.date_found).toLocaleDateString()}</div>
              <h3 class="card-title">${item.title}</h3>
              <p class="card-desc">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
              <div class="card-footer">
                  <span>${item.location}</span>
                  <span>ID: ${item.id.substring(0, 8)}</span>
              </div>
            </div>
        </div>
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

    const myReports = window.items.filter(i => i.contact_email === window.currentUser.email);
    const myClaims = window.claims.filter(c => c.claimant_email === window.currentUser.email);

    if (reportsEl) reportsEl.innerHTML = myReports.length ? myReports.map(r => `
        <div class="list-item">
            <div>
              <div style="font-family:var(--font-mono); font-size:0.6rem; color:var(--muted-text); margin-bottom:0.25rem;">REF: ${r.id.substring(5, 13).toUpperCase()}</div>
              <strong>${r.title}</strong>
            </div>
            <span class="status-tag" style="border-color:${(r.status || "").toLowerCase() === 'approved' ? '#0f0' : (r.status || "").toLowerCase() === 'rejected' ? '#f00' : 'var(--border-color)'}">
              ${(r.status || "PENDING").toUpperCase()}
            </span>
        </div>
    `).join('') : '<div class="status-msg">NO REPORTS LOGGED</div>';

    if (claimsEl) claimsEl.innerHTML = myClaims.length ? myClaims.map(c => {
        const item = window.items.find(i => i.id === c.item_id);
        return `
            <div class="list-item">
                <div>
                  <div style="font-family:var(--font-mono); font-size:0.6rem; color:var(--muted-text); margin-bottom:0.25rem;">CLAIM ID: ${c.id.substring(6, 14).toUpperCase()}</div>
                  <strong>${item?.title || 'Unknown Item'}</strong>
                </div>
                <span class="status-tag" style="border-color:${(c.status || "").toLowerCase() === 'approved' ? '#0f0' : 'var(--border-color)'}">
                  ${(c.status || "PENDING").toUpperCase()}
                </span>
            </div>
        `;
    }).join('') : '<div class="status-msg">NO CLAIMS IN PROGRESS</div>';
}
window.renderDashboard = renderDashboard;

function renderAdmin() {
    if (!window.currentUser || window.currentUser.role !== 'admin') return;

    const pendingEl = document.getElementById('adminPendingItems');
    const pending = window.items.filter(i => (i.status || "").toLowerCase().trim() === 'pending');
    if (pendingEl) pendingEl.innerHTML = pending.length ? pending.map(i => `
        <div class="list-item">
            <strong>${i.title}</strong>
            <div>
                <button onclick="approveItem('${i.id}')" class="btn-sm btn-outline">APPROVE</button>
                <button onclick="rejectItem('${i.id}')" class="btn-sm btn-outline">REJECT</button>
                <button onclick="deleteItem('${i.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">DELETE</button>
            </div>
        </div>
    `).join('') : 'NO PENDING ITEMS';

    const claimsEl = document.getElementById('adminClaims');
    const pendingClaims = window.claims.filter(c => (c.status || "").toLowerCase().trim() === 'pending');
    if (claimsEl) claimsEl.innerHTML = pendingClaims.length ? pendingClaims.map(c => {
        const item = window.items.find(it => it.id === c.item_id);
        return `
            <div class="list-item">
                <strong>${item?.title || 'Unknown Item'} / BY ${c.claimant_name}</strong>
                <button onclick="approveClaim('${c.id}')" class="btn-sm btn-outline">VERIFY</button>
            </div>
        `;
    }).join('') : 'NO PENDING CLAIMS';

    // Approved Inventory
    const approvedEl = document.getElementById('adminApprovedItems');
    const approved = window.items.filter(i => (i.status || "").toLowerCase().trim() === 'approved');
    if (approvedEl) approvedEl.innerHTML = approved.length ? approved.map(i => `
        <div class="list-item">
            <strong>${i.title}</strong>
            <button onclick="deleteItem('${i.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">DELETE</button>
        </div>
    `).join('') : 'EMPTY';

    // Verified Claims
    const verifiedEl = document.getElementById('adminVerifiedClaims');
    const verified = window.claims.filter(c => (c.status || "").toLowerCase().trim() === 'approved');
    if (verifiedEl) {
        verifiedEl.innerHTML = verified.length ? verified.map(c => {
            const item = window.items.find(it => it.id === c.item_id);
            return `
            <div class="list-item">
                <strong>${item?.title || 'Unknown Item'} / BY ${c.claimant_name}</strong>
                <button onclick="deleteClaim('${c.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">DELETE ENTRY</button>
            </div>
        `;
        }).join('') : 'EMPTY';
    }
}
window.renderAdmin = renderAdmin;
