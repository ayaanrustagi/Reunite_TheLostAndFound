



function navigateToSection(sectionId) {
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




function initHeroRotation() {
    const titles = [
        "LOST VALUABLES",
        "WHERE DID IT GO",
        "LOST AN ITEM",
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
        tIndex = (tIndex + 1) % titles.length;
        sIndex = (sIndex + 1) % subs.length;

        // Slide up and fade out
        titleEl.style.opacity = '0';
        titleEl.style.transform = 'translateY(-20px)';
        subEl.style.opacity = '0';
        subEl.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            // Change text while hidden
            titleEl.textContent = titles[tIndex];
            subEl.textContent = subs[sIndex];

            // Position below then slide up
            titleEl.style.transform = 'translateY(20px)';
            subEl.style.transform = 'translateY(20px)';

            // Animate in on next frame
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    titleEl.style.opacity = '1';
                    titleEl.style.transform = 'translateY(0)';
                    subEl.style.opacity = '1';
                    subEl.style.transform = 'translateY(0)';
                });
            });
        }, 350);

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
    const section = document.getElementById('how-content-area');

    if (!section) return;

    const stepItems = document.querySelectorAll('.step-item');
    const previewTitle = document.getElementById('preview-title');
    const previewDesc = document.getElementById('preview-desc');

    const stepData = [
        { title: "REPORT", desc: "Submit a detailed report with optional imagery." },
        { title: "MATCH", desc: "Our algorithm scans existing inventory to find potential matches." },
        { title: "REUNITE", desc: "Verify ownership and arrange for item retrieval." }
    ];

    let currentStep = 0;

    // Determine current active step
    let minDiff = Infinity;
    stepItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const center = rect.top + (rect.height / 2);
        const target = window.innerHeight * 0.5;
        const diff = Math.abs(center - target);

        if (diff < minDiff) {
            minDiff = diff;
            currentStep = index;
        }
    });

    // Update Step Items Opacity/Active state
    stepItems.forEach((item, index) => {
        if (index === currentStep) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update sticky preview on desktop ONLY
    if (window.innerWidth > 1024) {
        if (previewTitle && stepData[currentStep]) {
            if (previewTitle.dataset.current !== stepData[currentStep].title) {
                previewTitle.textContent = stepData[currentStep].title;
                previewDesc.textContent = stepData[currentStep].desc;
                previewTitle.dataset.current = stepData[currentStep].title;

                // Add a small re-trigger animation class
                previewTitle.style.animation = 'none';
                void previewTitle.offsetWidth;
                previewTitle.style.animation = 'textFadeIn 0.5s ease forwards';
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
