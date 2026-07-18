





/**
 * @file render.js
 * @description Renders dynamic HTML views, including the Browse grid feed, dashboard stats, claim wizard summaries, messaging lists, admin consoles, and audit trails.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

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

/**
 * Render tips and guides inside the student dashboard.
 * 
 * @function renderDashboardTips
 * @returns {void}
 */
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

/**
 * Updates the active filter indicator chips dynamically on the Browse page.
 * 
 * @function updateActiveFilters
 * @param {Object} filterOptions
 * @param {Array<String>} [filterOptions.searchTokens] - Active keyword search words
 * @param {String} [filterOptions.category] - Chosen category name
 * @param {String} [filterOptions.location] - Selected school location
 * @returns {void}
 */
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

/**
 * Updates the text message displaying the count of filtered items versus total approved items.
 * 
 * @function updateResultsStatus
 * @param {Number} totalApproved - Total count of approved items in the inventory database
 * @param {Number} shownCount - Count of items matching active filter criteria
 * @param {Object} filterOptions
 * @param {Array<String>} [filterOptions.searchTokens] - Search query words
 * @param {String} [filterOptions.category] - Target category
 * @param {String} [filterOptions.location] - Target location
 * @returns {void}
 */
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

/**
 * Clear all search bar inputs, dropdown values, and trigger a browse grid re-render.
 * 
 * @function clearFilters
 * @returns {void}
 */
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

/**
 * Renders the browse grid containing approved lost and found items.
 * Performs search token processing, fuzzy matching, categorization, and sorting filters.
 * 
 * @function renderFound
 * @returns {void}
 */
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

    let filtered = window.items.filter(it => (it.status || "").toLowerCase().trim() === 'approved');

    // Separate claimed items
    const claimed = window.items.filter(it => (it.status || "").toLowerCase().trim() === 'claimed');
    renderClaimedItems(claimed);

    if (search) {
        const searchTokens = search.split(/\s+/);
        filtered = filtered.filter(item => {
            return searchTokens.every(token => 
                window.isFuzzyMatch(item.title, token) ||
                window.isFuzzyMatch(item.description, token) ||
                window.isFuzzyMatch(item.category, token) ||
                window.isFuzzyMatch(item.location, token)
            );
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

/**
 * Return the color hue angle corresponding to the item category.
 * 
 * @function fpCategoryHue
 * @param {String} cat - Category name
 * @returns {Number} Hue degree angle
 */
function fpCategoryHue(cat) {
    const k = (cat || 'other').toString().toLowerCase().trim();
    return (FP_CAT_HUE[k] !== undefined) ? FP_CAT_HUE[k] : 220;
}

/**
 * Humanize a date string relative to current local time.
 * 
 * @function fpRelativeTime
 * @param {String} dateStr - Date string
 * @returns {String} Relative time string (e.g. '3h ago', 'yesterday', 'just now')
 */
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

/**
 * Escape HTML symbols inside target string.
 * 
 * @function fpEscHtml
 * @param {String} s - String to clean
 * @returns {String} Escaped clean HTML string
 */
function fpEscHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/**
 * Renders HTML for a specific browse item card.
 * Draws custom striped canvas backgrounds when image attachments are missing.
 * 
 * @function renderFpCard
 * @param {Object} item - Item record payload
 * @param {Number} idx - List array index
 * @returns {String} Compiled card HTML string
 */
function renderFpCard(item, idx) {
    // Use consistent clean color for all item cards
    const hue = 220; // fixed neutral blue
    const bg  = `oklch(0.96 0.02 ${hue})`; // premium light background
    const fg  = `oklch(0.40 0.10 ${hue})`;
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
            <div class="fp-photo" ${item.image ? '' : `style="background:${bg}"`}>
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
window.fpCategoryHue = fpCategoryHue;
window.FP_CAT_HUE = FP_CAT_HUE;

/**
 * Compile and render historical claimed items inside archive rows.
 * 
 * @function renderClaimedItems
 * @param {Array<Object>} claimedItems - List of historical claimed item documents
 * @returns {void}
 */
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

/**
 * Toggle the display and arrow indicators of the past claimed items history panel.
 * 
 * @function toggleClaimedItems
 * @returns {void}
 */
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

/**
 * Populates options inside the Claim Wizard's select dropdown.
 * 
 * @function renderClaimSelect
 * @returns {void}
 */
function renderClaimSelect() {
    const select = document.getElementById('claimItemId');
    if (!select) return;
    const approved = window.items.filter(i => i.status === 'approved');
    select.innerHTML = approved.map(i => `<option value="${i.id}">${i.title} (${i.location})</option>`).join('');

    const pre = sessionStorage.getItem('reunite_selected_id');
    if (pre) select.value = pre;
}
window.renderClaimSelect = renderClaimSelect;

/**
 * Compiles user reports, message inboxes, and interactive claim trackers inside the student dashboard view.
 * 
 * @async
 * @function renderDashboard
 * @returns {Promise<void>}
 */
async function renderDashboard() {
    // show user their history
    if (!window.currentUser) return;
    const reportsEl = document.getElementById('myReports');
    const claimsEl = document.getElementById('myClaims');
    const countActiveReportsEl = document.getElementById('countActiveReports');
    const countPendingClaimsEl = document.getElementById('countPendingClaims');
    const repCountEl = document.getElementById('repCount');
    const claimCountEl = document.getElementById('claimCount');
    const userNameEl = document.getElementById('dashboardUserName');
    
    // Message inbox DOM elements
    const messagesEl = document.getElementById('myMessages');
    const messageCountEl = document.getElementById('messageCount');

    const myReports = window.items.filter(i => i.contact_email === window.currentUser.email || i.finder_email === window.currentUser.email);
    const myClaims = window.claims.filter(c => c.claimant_email === window.currentUser.email || c.claimer_email === window.currentUser.email);

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

    if (claimsEl) {
        window.expandedClaims = window.expandedClaims || new Set();
        claimsEl.innerHTML = myClaims.length ? myClaims.map(c => {
            const item = window.items.find(i => i.id === c.item_id);
            const status = (c.status || 'pending').toLowerCase().trim();
            
            let step1Class = 'awaiting';
            let step2Class = 'awaiting';
            let step3Class = 'awaiting';
            let progressWidth = '0%';
            
            if (status === 'approved' || status === 'claimed') {
                step1Class = 'completed';
                step2Class = 'completed';
                step3Class = 'completed';
                progressWidth = '100%';
            } else if (status === 'under_review') {
                step1Class = 'completed';
                step2Class = 'active';
                step3Class = 'awaiting';
                progressWidth = '50%';
            } else {
                step1Class = 'active';
                step2Class = 'awaiting';
                step3Class = 'awaiting';
                progressWidth = '0%';
            }

            const claimIdUpper = c.id.substring(6, 14).toUpperCase();
            const itemTitle = item ? item.title : 'Unknown Item';
            const formattedDate = c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent';
            const itemLocation = item ? item.location : 'N/A';
            const itemCategory = item ? item.category : 'N/A';
            const itemDate = item && item.date_found ? new Date(item.date_found).toLocaleDateString() : 'N/A';
            const isExpanded = window.expandedClaims.has(c.id) ? 'expanded' : '';

            return `
                <div class="claim-container-card ${isExpanded}" id="claim-card-${c.id}">
                    <!-- Simulation Badge -->
                    <button class="claim-simulation-badge" onclick="event.stopPropagation(); window.toggleSimulationMenu(event, '${c.id}')" title="Simulate Status Change">
                        Simulate
                        <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                    </button>
                    
                    <!-- Floating Simulation Menu -->
                    <div class="claim-simulation-menu hidden" id="sim-menu-${c.id}" onclick="event.stopPropagation();">
                        <button onclick="window.simulateClaimStatus('${c.id}', 'pending')">Pending (Submitted)</button>
                        <button onclick="window.simulateClaimStatus('${c.id}', 'under_review')">Under Review</button>
                        <button onclick="window.simulateClaimStatus('${c.id}', 'approved')">Approved & Ready</button>
                    </div>

                    <div class="claim-card-header" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); this.click(); }" onclick="window.toggleClaimDetails('${c.id}')">
                        <div class="title-group">
                            <span class="ref-code">CLAIM ID: ${claimIdUpper}</span>
                            <h4>${itemTitle}</h4>
                        </div>
                        <button class="toggle-arrow" aria-label="Toggle Details">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    </div>

                    <!-- Stepper component -->
                    <div class="claim-stepper-container">
                        <div class="claim-stepper-track"></div>
                        <div class="claim-stepper-progress" style="width: ${progressWidth}"></div>
                        
                        <!-- Step 1 -->
                        <div class="claim-stepper-step ${step1Class}">
                            <div class="step-dot">
                                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            </div>
                            <span class="step-label">Submitted</span>
                            <div class="step-tooltip">Claim successfully received. Awaiting review by administrators.</div>
                        </div>
                        
                        <!-- Step 2 -->
                        <div class="claim-stepper-step ${step2Class}">
                            <div class="step-dot">
                                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            </div>
                            <span class="step-label">Under Review</span>
                            <div class="step-tooltip">Administrators are reviewing proof of ownership details.</div>
                        </div>
                        
                        <!-- Step 3 -->
                        <div class="claim-stepper-step ${step3Class}">
                            <div class="step-dot">
                                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            </div>
                            <span class="step-label">Ready for Pickup</span>
                            <div class="step-tooltip">Claim approved! Please visit the office to collect your item.</div>
                        </div>
                    </div>

                    <!-- Expanded Drawer -->
                    <div class="claim-details-expanded">
                        <div class="expanded-grid">
                            <div class="details-block">
                                <h5>Claim Information</h5>
                                <p><strong>Claimed On:</strong> ${formattedDate}</p>
                                <p><strong>Proof Description:</strong> ${c.description || 'No description provided.'}</p>
                                
                                <h5 style="margin-top: 0.75rem;">Item Details</h5>
                                <p><strong>Found On:</strong> ${itemDate}</p>
                                <p><strong>Found At:</strong> ${itemLocation}</p>
                                <p><strong>Category:</strong> ${itemCategory}</p>
                            </div>
                            <div class="details-block">
                                <h5>Proof Attachment</h5>
                                ${c.image || c.proof_image ? `
                                    <div class="proof-img-container" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); this.click(); }" onclick="window.openClaimLightbox('${c.image || c.proof_image}', '${itemTitle}')">
                                        <img src="${c.image || c.proof_image}" alt="Proof of ownership for ${itemTitle}">
                                    </div>
                                ` : '<p style="color: var(--muted-text); font-style: italic;">No proof image attached.</p>'}
                                
                                <h5 style="margin-top: 0.75rem;">Activity History</h5>
                                <div class="claim-activity-logs">
                                    <div class="log-entry">
                                        <div class="log-dot"></div>
                                        <div class="log-text">Claim initialized & submitted</div>
                                        <div class="log-time">${formattedDate}</div>
                                    </div>
                                    ${status === 'under_review' || status === 'approved' || status === 'claimed' ? `
                                        <div class="log-entry">
                                            <div class="log-dot"></div>
                                            <div class="log-text">Claim marked under review by admin</div>
                                            <div class="log-time">${formattedDate}</div>
                                        </div>
                                    ` : ''}
                                    ${status === 'approved' || status === 'claimed' ? `
                                        <div class="log-entry">
                                            <div class="log-dot"></div>
                                            <div class="log-text">Claim verified & item marked as claimed</div>
                                            <div class="log-time">${formattedDate}</div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="claim-card-actions">
                            <button class="btn-claim-action withdraw" onclick="window.withdrawClaim('${c.id}')">Withdraw Claim</button>
                            ${item ? `<button class="btn-claim-action message" onclick="window.messageAdminAboutItem('${item.id}')">Message Admin</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('') : '<div class="status-msg">NO CLAIMS IN PROGRESS</div>';
    }

    // Fetch and render messages
    if (messagesEl) {
        messagesEl.innerHTML = '<div class="status-msg">LOADING MESSAGES...</div>';
        if (window.apiGetMessages) {
            const myMessages = await window.apiGetMessages(window.currentUser.email);
            if (messageCountEl) messageCountEl.textContent = myMessages.length;
            
            messagesEl.innerHTML = myMessages.length ? myMessages.map(m => {
                const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Unknown Date';
                return `
                    <div class="list-item">
                        <div class="item-info" style="flex-grow: 1; margin-right: 1rem;">
                            <strong>From: ${m.sender_name} (<a href="mailto:${m.sender_email}" style="color: var(--accent-color); text-decoration: underline;">${m.sender_email}</a>)</strong>
                            <p style="font-size: 0.8rem; margin: 0.2rem 0; color: var(--muted-text);">Regarding item: ${m.item_title}</p>
                            <p style="font-size: 0.85rem; margin: 0.4rem 0 0 0; white-space: pre-wrap; line-height: 1.4; color: var(--text-color);">${m.message}</p>
                        </div>
                        <span style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--muted-text); white-space: nowrap;">${dateStr}</span>
                    </div>
                `;
            }).join('') : '<div class="status-msg">NO MESSAGES INBOX</div>';
        } else {
            messagesEl.innerHTML = '<div class="status-msg">MESSAGING CLIENT NOT LOADED</div>';
        }
    }

    renderDashboardTips();
}
window.renderDashboard = renderDashboard;

/**
 * Render administrative statistics, audit logs, pending items, and claim queues.
 * 
 * @async
 * @function renderAdmin
 * @returns {Promise<void>}
 */
async function renderAdmin() {
    // the master view
    if (!window.currentUser || window.currentUser.role !== 'admin') return;

    const pending = window.items.filter(i => (i.status || "").toLowerCase().trim() === 'pending');
    const pendingClaims = window.claims.filter(c => {
        const s = (c.status || "").toLowerCase().trim();
        return s === 'pending' || s === 'under_review';
    });
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
        <div class="list-item clickable" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); this.click(); }" onclick="openAdminDetailModal('report', '${i.id}')">
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
            <div class="list-item clickable" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); this.click(); }" onclick="openAdminDetailModal('claim', '${c.id}')">
                <div style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 0;">
                  ${c.image ? `<img src="${c.image}" class="admin-thumb" alt="Proof">` : `<div class="admin-thumb admin-thumb-missing" style="background: #fff3cd; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; color: #ff9500; border: 1px dashed #ff9500;">?</div>`}
                  <div class="item-info">
                    <div class="ref-code">CLAIM BY: ${c.claimant_name.toUpperCase()}</div>
                    <strong>${item?.title || 'Unknown Item'}</strong>
                    ${!c.image ? '<span style="font-size: 0.65rem; color: #ff9500; display: block;">NO PROOF IMAGE</span>' : ''}
                  </div>
                </div>
                <div class="admin-actions-inline" onclick="event.stopPropagation()">
                    ${(c.status || '').toLowerCase() === 'under_review' 
                        ? `<span style="font-size: 0.7rem; font-weight: bold; color: #ff9500; margin-right: 10px; border: 1px solid #ff9500; padding: 4px 8px; border-radius: 4px;">AWAITING DETAILS</span>` 
                        : `<button onclick="requestClaimDetails('${c.id}')" class="btn btn-sm btn-outline orange">REQUEST DETAILS</button>`}
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

    const adminMessagesEl = document.getElementById('adminMessages');
    const adminMessageCountEl = document.getElementById('adminMessageCount');

    if (adminMessagesEl) {
        adminMessagesEl.innerHTML = '<div class="status-msg">LOADING SYSTEM MESSAGES...</div>';
        if (window.apiGetMessages) {
            try {
                // Admin messages are sent to "admin@reunite.com"
                const adminMsgs = await window.apiGetMessages("admin@reunite.com");
                if (adminMessageCountEl) adminMessageCountEl.textContent = adminMsgs.length;
                
                adminMessagesEl.innerHTML = adminMsgs.length ? adminMsgs.map(m => {
                    const dateStr = new Date(m.created_at).toLocaleDateString();
                    return `
                        <div class="list-item">
                            <div class="item-info">
                                <strong>From: ${m.sender_name} (${m.sender_email})</strong>
                                <div style="font-size: 0.85rem; color: var(--muted-text); margin-top: 0.25rem;">Re: ${m.item_title}</div>
                                <div style="font-size: 0.9rem; margin-top: 0.5rem; white-space: pre-wrap;">${m.message}</div>
                            </div>
                            <div class="status-badge" style="background: transparent; color: var(--muted-text);">
                                ${dateStr}
                            </div>
                        </div>
                    `;
                }).join('') : '<div class="status-msg">NO SYSTEM MESSAGES</div>';
            } catch (err) {
                adminMessagesEl.innerHTML = '<div class="status-msg">FAILED TO LOAD MESSAGES</div>';
            }
        } else {
            adminMessagesEl.innerHTML = '<div class="status-msg">MESSAGING CLIENT NOT LOADED</div>';
        }
    }
}
window.renderAdmin = renderAdmin;

/**
 * Fetch and render recent security audit log entries.
 * 
 * @async
 * @function renderAdminAudit
 * @returns {Promise<void>}
 */
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

// =========================================================================
// Interactive Claims Stepper & Simulation Helper Handlers
// =========================================================================

/**
 * Toggle expanded card details for a specific claim inside the student dashboard.
 * 
 * @global
 * @function toggleClaimDetails
 * @param {String} claimId - Target claim ID
 * @returns {void}
 */
window.toggleClaimDetails = function(claimId) {
    const card = document.getElementById(`claim-card-${claimId}`);
    if (!card) return;
    
    window.expandedClaims = window.expandedClaims || new Set();
    if (window.expandedClaims.has(claimId)) {
        window.expandedClaims.delete(claimId);
        card.classList.remove('expanded');
    } else {
        window.expandedClaims.add(claimId);
        card.classList.add('expanded');
    }
};

/**
 * Toggle simulation dropdown overlays.
 * 
 * @global
 * @function toggleSimulationMenu
 * @param {Event} event - Dropdown toggle trigger event
 * @param {String} claimId - Target claim ID
 * @returns {void}
 */
window.toggleSimulationMenu = function(event, claimId) {
    event.stopPropagation();
    
    // Close other open simulation menus first
    document.querySelectorAll('.claim-simulation-menu').forEach(menu => {
        if (menu.id !== `sim-menu-${claimId}`) {
            menu.classList.add('hidden');
        }
    });

    const menu = document.getElementById(`sim-menu-${claimId}`);
    if (menu) {
        menu.classList.toggle('hidden');
    }
};

// Close simulation menus when clicking elsewhere
document.addEventListener('click', () => {
    document.querySelectorAll('.claim-simulation-menu').forEach(menu => {
        menu.classList.add('hidden');
    });
});

/**
 * Simulate status transitions for claims (toggles parent item statuses automatically).
 * 
 * @async
 * @global
 * @function simulateClaimStatus
 * @param {String} claimId - Target claim ID
 * @param {String} newStatus - Simulated status name ('pending'|'under_review'|'approved')
 * @returns {Promise<void>}
 */
window.simulateClaimStatus = async function(claimId, newStatus) {
    const claim = window.claims.find(c => c.id === claimId);
    if (!claim) return;
    
    const updatedClaim = { ...claim, status: newStatus };
    
    if (window.showLoading) window.showLoading(`Simulating status update to ${newStatus.replace('_', ' ')}...`);
    
    // Update local claims state immediately for smoother transition
    claim.status = newStatus;
    
    // Auto-update parent item status for logical flow
    if (newStatus === 'approved') {
        const item = window.items.find(i => i.id === claim.item_id);
        if (item) {
            item.status = 'claimed';
            await window.apiUpsert('items', item);
        }
    } else {
        const item = window.items.find(i => i.id === claim.item_id);
        if (item && item.status === 'claimed') {
            item.status = 'approved'; // Re-approve item for inventory
            await window.apiUpsert('items', item);
        }
    }
    
    const success = await window.apiUpsert('claims', updatedClaim);
    if (success) {
        await window.apiSync();
        if (window.showSuccess) window.showSuccess(`STATUS SET TO ${newStatus.toUpperCase()}`);
    } else {
        if (window.hideLoading) window.hideLoading();
    }
};

/**
 * Toggles messenger modals targeted at a specific item.
 * 
 * @global
 * @function messageAdminAboutItem
 * @param {String} itemId - Target item ID
 * @returns {void}
 */
window.messageAdminAboutItem = function(itemId) {
    sessionStorage.setItem('reunite_selected_id', itemId);
    if (window.openSendMessageModal) {
        window.openSendMessageModal();
    }
};

/**
 * Display full screen proof images inside a custom lightbox.
 * 
 * @global
 * @function openClaimLightbox
 * @param {String} imgSrc - Image source URL/Base64
 * @param {String} itemTitle - Item name/title
 * @returns {void}
 */
window.openClaimLightbox = function(imgSrc, itemTitle) {
    let lightbox = document.getElementById('claim-lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'claim-lightbox';
        lightbox.style.position = 'fixed';
        lightbox.style.top = '0';
        lightbox.style.left = '0';
        lightbox.style.width = '100vw';
        lightbox.style.height = '100vh';
        lightbox.style.background = 'rgba(15, 20, 25, 0.9)';
        lightbox.style.backdropFilter = 'blur(10px)';
        lightbox.style.webkitBackdropFilter = 'blur(10px)';
        lightbox.style.zIndex = '99999';
        lightbox.style.display = 'flex';
        lightbox.style.flexDirection = 'column';
        lightbox.style.alignItems = 'center';
        lightbox.style.justifyContent = 'center';
        lightbox.style.cursor = 'zoom-out';
        lightbox.style.opacity = '0';
        lightbox.style.transition = 'opacity 0.3s ease';
        
        lightbox.innerHTML = `
            <img id="claim-lightbox-img" src="" style="max-width: 90%; max-height: 85%; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); object-fit: contain;">
            <p id="claim-lightbox-title" style="color: #ffffff; font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; margin-top: 1.5rem;"></p>
        `;
        
        lightbox.addEventListener('click', () => {
            lightbox.style.opacity = '0';
            setTimeout(() => lightbox.style.display = 'none', 300);
        });
        
        document.body.appendChild(lightbox);
    }
    
    document.getElementById('claim-lightbox-img').src = imgSrc;
    document.getElementById('claim-lightbox-title').textContent = `Proof Image — ${itemTitle}`;
    lightbox.style.display = 'flex';
    requestAnimationFrame(() => {
        lightbox.style.opacity = '1';
    });
};


