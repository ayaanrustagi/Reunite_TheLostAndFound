
// ------------------------------
// Initialization & Main Logic
// ------------------------------

function loadAll() {
    // Supabase-only: don't load from localStorage
    window.items = [];
    window.claims = [];
}

function loadSession() {
    const session = localStorage.getItem(window.LS_KEYS.session);
    if (session) {
        try {
            window.currentUser = JSON.parse(session);
            console.log("🟢 MANUALLY RESTORED SESSION:", window.currentUser);
            if (window.updateAuthUI) window.updateAuthUI();
        } catch (e) {
            console.error("Failed to restore manual session", e);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle - RUN FIRST to ensure it works
    (function initMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.querySelector('.main-nav');

        console.log('Mobile Menu Init:', { menuToggle: !!menuToggle, mainNav: !!mainNav });

        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Menu toggle clicked!');

                this.classList.toggle('active');
                mainNav.classList.toggle('mobile-open');
                document.body.style.overflow = mainNav.classList.contains('mobile-open') ? 'hidden' : '';
            });

            // Close menu when clicking a nav button
            mainNav.querySelectorAll('.nav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    menuToggle.classList.remove('active');
                    mainNav.classList.remove('mobile-open');
                    document.body.style.overflow = '';
                });
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && mainNav.classList.contains('mobile-open')) {
                    menuToggle.classList.remove('active');
                    mainNav.classList.remove('mobile-open');
                    document.body.style.overflow = '';
                }
            });

            console.log('✅ Mobile menu initialized successfully');
        } else {
            console.error('❌ Mobile menu elements not found!');
        }
    })();

    if (window.initializeSupabase) window.initializeSupabase();
    loadAll();
    loadSession();
    if (window.updateAuthUI) window.updateAuthUI();

    // Initialize EmailJS
    const emailjs = window.emailjs;
    if (typeof emailjs !== "undefined" && window.EMAILS_ENABLED) {
        emailjs.init(window.EMAILJS_PUBLIC_KEY);
    }

    // If Supabase is configured and demo mode is off, hydrate from backend
    if (window.syncFromSupabase) window.syncFromSupabase();

    // Check for initial hash/section
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        if (window.navigateToSection) window.navigateToSection(hash);
    } else {
        if (window.navigateToSection) window.navigateToSection('hero');
    }

    // Scroll listener for "How It Works" split section
    const howSection = document.getElementById('page-how');
    if (howSection && window.handleSplitScroll) {
        window.addEventListener('scroll', window.handleSplitScroll);
    }

    // Form Submissions
    document.getElementById('reportForm')?.addEventListener('submit', window.handleReportSubmit);
    document.getElementById('claimForm')?.addEventListener('submit', window.handleClaimSubmit);

    // Header Scroll Effect
    const header = document.querySelector('.site-header');
    const trigger = document.querySelector('.persistent-trigger');

    window.addEventListener('scroll', () => {
        if (!header) return;
        const currentScrollY = window.scrollY;
        // Only add subtle styling when scrolled, but keep header visible
        header.classList.toggle('scrolled', currentScrollY > 50);
    }, { passive: true });

    // Ensure trigger stays hidden since header is always visible
    if (trigger) trigger.classList.remove('visible');

    // Make header globally accessible for inline onclicks
    window.header = header;
    window.showHeader = function () {
        // Header is always visible now, but keep function for compatibility
        header.classList.remove('header-hidden');
    };

    if (window.initHeroRotation) window.initHeroRotation();
    if (window.attachRealtimeValidation) window.attachRealtimeValidation();
    if (window.renderDashboardTips) window.renderDashboardTips();

});
