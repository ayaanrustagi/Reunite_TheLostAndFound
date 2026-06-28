function loadAll() {
    window.items = [];
    window.claims = [];
}

function loadSession() {
    // restore login status
    const session = localStorage.getItem(window.LS_KEYS.session);
    if (session) {
        try {
            window.currentUser = JSON.parse(session);
            if (window.updateAuthUI) window.updateAuthUI();
        } catch (e) {
            console.error("Failed to restore manual session", e);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // kick things off
    (function initMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.querySelector('.main-nav');

        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                this.classList.toggle('active');
                mainNav.classList.toggle('mobile-open');
                document.body.style.overflow = mainNav.classList.contains('mobile-open') ? 'hidden' : '';
            });

            mainNav.querySelectorAll('.nav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    menuToggle.classList.remove('active');
                    mainNav.classList.remove('mobile-open');
                    document.body.style.overflow = '';
                });
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && mainNav.classList.contains('mobile-open')) {
                    menuToggle.classList.remove('active');
                    mainNav.classList.remove('mobile-open');
                    document.body.style.overflow = '';
                }
            });
        }
    })();


    loadAll();
    loadSession();
    if (window.loadAccessibilitySettings) window.loadAccessibilitySettings();
    if (window.updateAuthUI) window.updateAuthUI();

    const emailjs = window.emailjs;
    if (window.emailjs && window.EMAILS_ENABLED && window.EMAILJS_PUBLIC_KEY) {
        window.emailjs.init(window.EMAILJS_PUBLIC_KEY);
    }

    if (window.apiSync) window.apiSync();

    const hash = window.location.hash.replace('#', '');
    if (hash) {
        if (window.navigateToSection) window.navigateToSection(hash);
    } else {
        if (window.navigateToSection) window.navigateToSection('hero');
    }

    const howSection = document.getElementById('how-content-area');
    if (howSection && window.handleSplitScroll) {
        window.addEventListener('scroll', window.handleSplitScroll);

        // Also listen to horizontal scroll on mobile
        const splitRight = howSection.querySelector('.split-right');
        if (splitRight) {
            splitRight.addEventListener('scroll', window.handleSplitScroll);
        }
    }


    document.getElementById('reportForm')?.addEventListener('submit', window.handleReportSubmit);
    document.getElementById('claimForm')?.addEventListener('submit', window.handleClaimSubmit);

    const header = document.querySelector('.site-header');
    const trigger = document.querySelector('.persistent-trigger');

    window.addEventListener('scroll', () => {
        if (!header) return;
        const currentScrollY = window.scrollY;
        header.classList.toggle('scrolled', currentScrollY > 50);
    }, { passive: true });

    if (trigger) trigger.classList.remove('visible');

    window.header = header;
    window.showHeader = function () {
        header.classList.remove('header-hidden');
    };

    if (window.initHeroRotation) window.initHeroRotation();
    if (window.attachRealtimeValidation) window.attachRealtimeValidation();
    if (window.renderDashboardTips) window.renderDashboardTips();

});
   