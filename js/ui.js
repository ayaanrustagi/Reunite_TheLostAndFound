
// ------------------------------
// Navigation
// ------------------------------
function navigateToSection(sectionId) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`page-${sectionId}`);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }

    // Nav active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(sectionId));
    });

    // Lazy load/render logic
    if (sectionId === 'found' && window.renderFound) window.renderFound();
    if (sectionId === 'claim' && window.renderClaimSelect) window.renderClaimSelect();
    if (sectionId === 'dashboard' && window.renderDashboard) window.renderDashboard();
    if (sectionId === 'admin' && window.renderAdmin) window.renderAdmin();
    if (sectionId === 'how' && window.handleSplitScroll) {
        // Small delay to ensure DOM state is ready for rect calculations
        setTimeout(window.handleSplitScroll, 50);
    }

    // Store in location for browser back button
    window.history.pushState(null, null, `#${sectionId}`);

    // Focus Management - Set focus to primary interactive element for accessibility
    setTimeout(() => {
        setFocusForSection(sectionId);
    }, 100);
}
window.navigateToSection = navigateToSection;

// Focus management helper - sets initial focus when navigating to sections
function setFocusForSection(sectionId) {
    let focusTarget = null;

    switch (sectionId) {
        case 'found':
            // Focus on main search filter
            focusTarget = document.getElementById('searchFilter');
            break;
        case 'report':
            // Focus on first form field
            focusTarget = document.getElementById('itemTitle');
            break;
        case 'claim':
            // Focus on item selection dropdown
            focusTarget = document.getElementById('claimItemId');
            break;
        case 'hero':
            // Focus on primary CTA button
            focusTarget = document.querySelector('#page-hero .btn-primary');
            break;
        case 'dashboard':
        case 'admin':
            // Focus on section heading for screen reader context
            focusTarget = document.querySelector(`#page-${sectionId} h2`);
            if (focusTarget) focusTarget.setAttribute('tabindex', '-1');
            break;
        default:
            // No specific focus target
            break;
    }

    if (focusTarget) {
        focusTarget.focus({ preventScroll: true });
    }
}

function openItemModal(id) {
    const item = window.items.find(i => i.id === id);
    if (!item) return;

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
        modalImg.classList.add('hidden');
    }

    sessionStorage.setItem('reunite_selected_id', id);
    document.getElementById('itemModal').classList.remove('hidden');
}
window.openItemModal = openItemModal;

function closeModal() { document.getElementById('itemModal').classList.add('hidden'); }
window.closeModal = closeModal;

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

// ------------------------------
// Hero Text Rotation
// ------------------------------
function initHeroRotation() {
    const titles = [
        "CAN'T FIND IT",
        "LOST VALUABLES",
        "WHERE DID IT GO",
        "MISSING BELONGINGS",
        "LOST AN ITEM",
        "MISPLACED SOMETHING"
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

    setInterval(() => {
        // Prepare next indices
        tIndex = (tIndex + 1) % titles.length;
        sIndex = (sIndex + 1) % subs.length;

        // Start Slide Out
        titleEl.classList.remove('text-slide-in');
        subEl.classList.remove('text-slide-in');

        void titleEl.offsetWidth; // Trigger reflow

        titleEl.classList.add('text-slide-out');
        subEl.classList.add('text-slide-out');

        // Swap text and Slide In after Slide Out completes
        setTimeout(() => {
            titleEl.textContent = titles[tIndex];
            subEl.textContent = subs[sIndex];

            titleEl.classList.remove('text-slide-out');
            subEl.classList.remove('text-slide-out');

            titleEl.classList.add('text-slide-in');
            subEl.classList.add('text-slide-in');
        }, 500);

    }, 3000); // 3s total cycle
}
window.initHeroRotation = initHeroRotation;

// ------------------------------
// "How It Works" Interaction
// ------------------------------
// ------------------------------
// "How It Works" Interaction
// ------------------------------
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
    const section = document.getElementById('how-content-area');
    // Ensure element exists
    if (!section) return;

    const stepItems = document.querySelectorAll('.step-item');
    const previewTitle = document.getElementById('preview-title');
    const previewDesc = document.getElementById('preview-desc');

    const stepData = [
        { title: "INITIATE", desc: "Begin the recovery process by logging the details into our secure network." },
        { title: "ANALYZE", desc: "Our algorithm scans existing inventory using perceptual hashing to find potential matches." },
        { title: "RESOLVE", desc: "Verify ownership through our secure claim portal and arrange for item retrieval." }
    ];

    let currentStep = 0;

    // Check if we are at the bottom of the page
    const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50;

    if (isAtBottom) {
        currentStep = stepItems.length - 1;
    } else {
        // Find the active step based on scroll position
        // improved logic: find the step that is closest to the visually "active" center point (roughly 40% down screen)
        let minDiff = Infinity;

        stepItems.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const center = rect.top + (rect.height / 2);
            const target = window.innerHeight * 0.4; // Target area is 40% down the viewport
            const diff = Math.abs(center - target);

            if (diff < minDiff) {
                minDiff = diff;
                currentStep = index;
            }
        });
    }

    // Apply active class to the current step and remove from others
    stepItems.forEach((item, index) => {
        if (index === currentStep) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (previewTitle && stepData[currentStep]) {
        // Only update if text matches (prevents flickering if unnecessary)
        if (previewTitle.textContent !== stepData[currentStep].title) {
            previewTitle.textContent = stepData[currentStep].title;
            previewDesc.textContent = stepData[currentStep].desc;
        }
    }

    // Smoothly fade out the scroll hint
    const hint = section.querySelector('.scroll-hint');
    if (hint) {
        const sectionRect = section.getBoundingClientRect();
        // Calculate progress: 0 when top is at bottom of screen, 1 when top is at top of screen
        // We want to fade OUT as it approaches the top.
        // Let's say we fade out when the section top passes the middle of the viewport

        const triggerPoint = window.innerHeight * 0.5;
        if (sectionRect.top < triggerPoint) {
            const opacity = Math.max(0, (sectionRect.top + 200) / (triggerPoint + 200));
            // Logic: as top gets smaller (scrolling down), opacity decreases
            hint.style.opacity = sectionRect.top < 0 ? '0' : opacity.toFixed(2);
        } else {
            hint.style.opacity = '1';
        }
    }
}
window.handleSplitScroll = handleSplitScroll;
