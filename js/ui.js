



function navigateToSection(sectionId) {
    // jump between pages
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`page-${sectionId}`);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }


    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(sectionId));
    });


    if (sectionId === 'found' && window.renderFound) window.renderFound();
    if (sectionId === 'claim' && window.renderClaimSelect) window.renderClaimSelect();
    if (sectionId === 'dashboard' && window.renderDashboard) window.renderDashboard();
    if (sectionId === 'admin' && window.renderAdmin) window.renderAdmin();
    if (sectionId === 'how' && window.handleSplitScroll) {

        setTimeout(window.handleSplitScroll, 50);
    }


    window.history.pushState(null, null, `#${sectionId}`);


    setTimeout(() => {
        setFocusForSection(sectionId);
    }, 100);
}
window.navigateToSection = navigateToSection;


function setFocusForSection(sectionId) {
    let focusTarget = null;

    switch (sectionId) {
        case 'found':

            focusTarget = document.getElementById('searchFilter');
            break;
        case 'report':

            focusTarget = document.getElementById('itemTitle');
            break;
        case 'claim':

            focusTarget = document.getElementById('claimItemId');
            break;
        case 'hero':

            focusTarget = document.querySelector('#page-hero .btn-primary');
            break;
        case 'dashboard':
        case 'admin':

            focusTarget = document.querySelector(`#page-${sectionId} h2`);
            if (focusTarget) focusTarget.setAttribute('tabindex', '-1');
            break;
        default:

            break;
    }

    if (focusTarget) {
        focusTarget.focus({ preventScroll: true });
    }
}

let lastFocusedElement = null;

function openItemModal(id) {
    // show item popover
    const item = window.items.find(i => i.id === id);
    if (!item) return;

    // Store element that opened modal
    lastFocusedElement = document.activeElement;

    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalLocation').textContent = item.location;
    document.getElementById('modalDescription').textContent = item.description;
    document.getElementById('modalContactName').textContent = item.contact_name;
    document.getElementById('modalDate').textContent = item.date_found;

    const modalImg = document.getElementById('modalImage');
    if (item.image) {
        modalImg.src = item.image;
        modalImg.classList.remove('hidden');
    } else {
        modalImg.src = "";
        modalImg.classList.add('hidden');
    }

    sessionStorage.setItem('reunite_selected_id', id);
    const modal = document.getElementById('itemModal');
    modal.classList.remove('hidden');

    // Move focus into the modal
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 50);
    }
}
window.openItemModal = openItemModal;

function closeModal() {
    document.getElementById('itemModal').classList.add('hidden');
    // Return focus to the element that opened it
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}
window.closeModal = closeModal;

function openAdminDetailModal(type, id) {
    let content = '';
    const modal = document.getElementById('adminDetailModal');
    const contentEl = document.getElementById('adminModalContent');
    const titleEl = document.getElementById('adminModalTitle');

    if (type === 'report') {
        const item = window.items.find(i => i.id === id);
        if (!item) return;
        titleEl.textContent = "REPORT DETAILS";
        content = `
            <div class="admin-detail-view">
                <div class="admin-detail-main">
                    <h2>${item.title}</h2>
                    <div class="meta-tags">
                        <span class="meta-tag">${item.category}</span>
                        <span class="meta-tag">${item.location}</span>
                        <span class="meta-tag">${new Date(item.date_found).toLocaleDateString()}</span>
                    </div>
                    ${item.image ? `<img src="${item.image}" class="modal-photo" alt="Item">` : '<div class="no-photo-placeholder">NO IMAGE ATTACHED</div>'}
                    <div class="detail-section">
                        <h4>DESCRIPTION</h4>
                        <p class="desc-text">${item.description || 'No description provided.'}</p>
                    </div>
                </div>
                <div class="admin-detail-sidebar">
                    <div class="detail-section">
                        <h4>REPORTER</h4>
                        <p><strong>Name:</strong> ${item.contact_name || item.finder_name || 'N/A'}</p>
                        <p><strong>Email:</strong> ${item.contact_email || item.finder_email || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${item.contact_phone || item.finder_phone || 'N/A'}</p>
                    </div>
                    <div class="detail-section">
                        <h4>ACTIONS</h4>
                        <div class="admin-actions-vertical">
                            <button onclick="approveItem('${item.id}'); closeAdminDetailModal();" class="btn-primary full-width">APPROVE REPORT</button>
                            <button onclick="rejectItem('${item.id}'); closeAdminDetailModal();" class="btn-outline full-width" style="border-color:#ff4d4d; color:#ff4d4d;">REJECT</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'claim') {
        const claim = window.claims.find(c => c.id === id);
        if (!claim) return;
        const item = window.items.find(it => it.id === claim.item_id);
        titleEl.textContent = "CLAIM DETAILS";
        content = `
            <div class="admin-detail-view">
                <div class="admin-detail-main">
                    <h2>Claim for: ${item?.title || 'Unknown Item'}</h2>
                    <div class="meta-tags">
                        <span class="meta-tag">ITEM ID: ${claim.item_id.substring(0, 8)}</span>
                        <span class="meta-tag">CLAIM STATUS: ${claim.status.toUpperCase()}</span>
                    </div>
                    ${claim.image ? `<img src="${claim.image}" class="modal-photo" alt="Proof">` : '<div class="no-photo-placeholder">NO PROOF IMAGE ATTACHED</div>'}
                    <div class="detail-section">
                        <h4>PROOF OF OWNERSHIP / DESCRIPTION</h4>
                        <p class="desc-text">${claim.description || claim.message || claim.claimer_message || 'No description provided.'}</p>
                    </div>
                </div>
                <div class="admin-detail-sidebar">
                    <div class="detail-section">
                        <h4>CLAIMANT</h4>
                        <p><strong>Name:</strong> ${claim.claimant_name || claim.claimer_name || 'N/A'}</p>
                        <p><strong>Email:</strong> ${claim.claimant_email || claim.claimer_email || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${claim.claimant_phone || claim.claimer_phone || 'N/A'}</p>
                    </div>
                    <div class="detail-section">
                        <h4>ACTIONS</h4>
                        <div class="admin-actions-vertical">
                            <button onclick="approveClaim('${claim.id}'); closeAdminDetailModal();" class="btn-primary full-width">VERIFY CLAIM</button>
                            <button onclick="requestClaimDetails('${claim.id}'); closeAdminDetailModal();" class="btn-outline full-width" style="border-color:#ff9500; color:#ff9500;">REQUEST MORE INFO</button>
                            <button onclick="deleteClaim('${claim.id}'); closeAdminDetailModal();" class="btn-outline full-width" style="border-color:#ff4d4d; color:#ff4d4d;">PURGE CLAIM</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    contentEl.innerHTML = content;
    modal.classList.remove('hidden');
    lastFocusedElement = document.activeElement;

    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 50);
    }
}
window.openAdminDetailModal = openAdminDetailModal;

function closeAdminDetailModal() {
    document.getElementById('adminDetailModal').classList.add('hidden');
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}
window.closeAdminDetailModal = closeAdminDetailModal;


// Keyboard "Escape" to Close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('itemModal');
        if (modal && !modal.classList.contains('hidden')) {
            closeModal();
        }
    }
});

function toggleOtherCat() {
    const cat = document.getElementById('itemCategory').value;
    document.getElementById('otherCategoryWrap').classList.toggle('hidden', cat !== 'Other');
}
window.toggleOtherCat = toggleOtherCat;

function toggleAdminField() {
    const isChecked = document.getElementById('isAdminToggle').checked;
    const roleSelect = document.getElementById('loginRole');
    const codeWrap = document.getElementById('adminCodeWrap');

    roleSelect.value = isChecked ? 'admin' : 'student';
    codeWrap.classList.toggle('hidden', !isChecked);
}
window.toggleAdminField = toggleAdminField;




function initHeroRotation() {
    const titles = [
        "LOST VALUABLES",
        "WHERE DID IT GO",
        "LOST AN ITEM",
        "CAN'T FIND IT",
    ];
    const subs = [
        "REUNITE YOUR WORLD FASTER",
        "BRING BACK WHAT'S YOURS",
        "FIND YOUR LOST ITEMS",
        "CONNECT WITH FINDERS",
        "RECOVER YOUR BELONGINGS"
    ];

    let tIndex = 0;
    let sIndex = 0;
    const titleEl = document.getElementById('hero-title');
    const subEl = document.getElementById('hero-subtitle');

    if (!titleEl || !subEl) return;

    // Ensure we start clean by removing initial reveal class which has a delay
    titleEl.classList.remove('text-reveal');
    subEl.classList.remove('text-reveal');

    // Reset styles that might have been set by the previous JS implementation
    titleEl.style.cssText = '';
    subEl.style.cssText = '';

    // Apply explicit 0 delay to ensure sync
    titleEl.style.animationDelay = '0s';
    subEl.style.animationDelay = '0s';

    setInterval(() => {
        tIndex = (tIndex + 1) % titles.length;
        sIndex = (sIndex + 1) % subs.length;

        // Add exit class
        titleEl.classList.remove('text-slide-in');
        subEl.classList.remove('text-slide-in');

        // Force reflow
        void titleEl.offsetWidth;

        titleEl.classList.add('text-slide-out');
        subEl.classList.add('text-slide-out');

        setTimeout(() => {
            // Swap text
            titleEl.textContent = titles[tIndex];
            subEl.textContent = subs[sIndex];

            // Remove exit, add enter
            titleEl.classList.remove('text-slide-out');
            subEl.classList.remove('text-slide-out');

            titleEl.classList.add('text-slide-in');
            subEl.classList.add('text-slide-in');
        }, 500); // 500ms matches the CSS animation duration

    }, 3500);
}
window.initHeroRotation = initHeroRotation;







function navigateToHow() {
    navigateToSection('hero');
    setTimeout(() => {
        const howSection = document.getElementById('how-content-area');
        if (howSection) {
            howSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100);
}
window.navigateToHow = navigateToHow;


function handleSplitScroll() {
    // handle the how-to scroll effect
    const section = document.getElementById('how-content-area');
    if (!section) return;

    const stepItems = document.querySelectorAll('.step-item');
    const previewTitle = document.getElementById('preview-title');
    const previewDesc = document.getElementById('preview-desc');
    const isMobile = window.innerWidth <= 1024;

    const stepData = [
        { title: "REPORT", desc: "Submit a detailed report with optional imagery." },
        { title: "MATCH", desc: "Our algorithm scans existing inventory to find potential matches." },
        { title: "REUNITE", desc: "Verify ownership and arrange for item retrieval." }
    ];

    let currentStep = 0;
    let minDiff = Infinity;

    stepItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        let diff;

        if (isMobile) {
            // Check horizontal center on mobile
            const center = rect.left + (rect.width / 2);
            const target = window.innerWidth * 0.5;
            diff = Math.abs(center - target);
        } else {
            // Check vertical center on desktop
            const center = rect.top + (rect.height / 2);
            const target = window.innerHeight * 0.5;
            diff = Math.abs(center - target);
        }

        if (diff < minDiff) {
            minDiff = diff;
            currentStep = index;
        }
    });

    // Update Step Items Active state
    stepItems.forEach((item, index) => {
        if (index === currentStep) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update sticky preview on desktop ONLY
    if (!isMobile) {
        if (previewTitle && stepData[currentStep]) {
            if (previewTitle.dataset.current !== stepData[currentStep].title) {
                previewTitle.textContent = stepData[currentStep].title;
                previewDesc.textContent = stepData[currentStep].desc;
                previewTitle.dataset.current = stepData[currentStep].title;

                previewTitle.style.animation = 'none';
                void previewTitle.offsetWidth;
                previewTitle.style.animation = 'textFadeIn 0.5s ease forwards';

                previewDesc.style.animation = 'none';
                void previewDesc.offsetWidth;
                previewDesc.style.animation = 'textFadeIn 0.5s ease forwards 0.1s';
            }
        }
    }

    const hint = section.querySelector('.scroll-hint');
    if (hint) {
        const sectionRect = section.getBoundingClientRect();
        const triggerPoint = window.innerHeight * 0.5;
        if (sectionRect.top < triggerPoint) {
            const opacity = Math.max(0, (sectionRect.top + 200) / (triggerPoint + 200));
            hint.style.opacity = sectionRect.top < 0 ? '0' : opacity.toFixed(2);
        } else {
            hint.style.opacity = '1';
        }
    }
}

window.handleSplitScroll = handleSplitScroll;


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

function handleLogout() {
    localStorage.removeItem("reunite_session");
    window.currentUser = null;
    if (window.updateAuthUI) window.updateAuthUI();
    if (window.navigateToSection) window.navigateToSection('hero');
}
window.handleLogout = handleLogout;

/**
 * Accessibility Settings Logic
 */
let fontScale = 100;

function toggleSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    const isVisible = !modal.classList.contains('hidden');
    if (isVisible) {
        modal.classList.add('hidden');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    } else {
        lastFocusedElement = document.activeElement;
        modal.classList.remove('hidden');
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) setTimeout(() => closeBtn.focus(), 50);

        // Sync toggles with current state
        document.getElementById('motionToggle').checked = document.body.classList.contains('reduced-motion');
        document.getElementById('contrastToggle').checked = document.body.classList.contains('high-contrast');
        document.getElementById('fontScaleDisplay').textContent = fontScale + '%';
    }
}
window.toggleSettingsModal = toggleSettingsModal;

function updateAccessibility(type, value) {
    const settings = JSON.parse(localStorage.getItem('reunite_accessibility') || '{}');

    if (type === 'motion') {
        const enabled = document.getElementById('motionToggle').checked;
        document.body.classList.toggle('reduced-motion', enabled);
        settings.reducedMotion = enabled;
    }
    else if (type === 'contrast') {
        const enabled = document.getElementById('contrastToggle').checked;
        document.body.classList.toggle('high-contrast', enabled);
        settings.highContrast = enabled;
    }
    else if (type === 'font') {
        if (value === 'up' && fontScale < 150) fontScale += 10;
        else if (value === 'down' && fontScale > 80) fontScale -= 10;

        document.documentElement.style.fontSize = (fontScale / 100 * 16) + 'px';
        document.getElementById('fontScaleDisplay').textContent = fontScale + '%';
        settings.fontScale = fontScale;
    }

    localStorage.setItem('reunite_accessibility', JSON.stringify(settings));
}
window.updateAccessibility = updateAccessibility;

function loadAccessibilitySettings() {
    const settings = JSON.parse(localStorage.getItem('reunite_accessibility') || '{}');

    if (settings.reducedMotion) {
        document.body.classList.add('reduced-motion');
    }
    if (settings.highContrast) {
        document.body.classList.add('high-contrast');
    }
    if (settings.fontScale) {
        fontScale = settings.fontScale;
        document.documentElement.style.fontSize = (fontScale / 100 * 16) + 'px';
    }
}
window.loadAccessibilitySettings = loadAccessibilitySettings;
