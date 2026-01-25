// ------------------------------
// Dark Mode Toggle
// ------------------------------

const DARK_MODE_KEY = 'reunite_dark_mode';

function initDarkMode() {
    const savedMode = localStorage.getItem(DARK_MODE_KEY);

    // Check for saved preference or system preference
    if (savedMode === 'true') {
        enableDarkMode();
    } else if (savedMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        enableDarkMode();
    }

    updateToggleIcon();
}

function toggleDarkMode() {
    if (document.body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
    updateToggleIcon();
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem(DARK_MODE_KEY, 'true');
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem(DARK_MODE_KEY, 'false');
}

function updateToggleIcon() {
    const darkIcon = document.querySelector('.dark-mode-toggle .dark-icon');
    const lightIcon = document.querySelector('.dark-mode-toggle .light-icon');

    if (!darkIcon || !lightIcon) return;

    if (document.body.classList.contains('dark-mode')) {
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
    } else {
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
    }
}

// Initialize GSAP animations for How It Works section
function initGSAPAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP or ScrollTrigger not loaded');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Animate step cards on scroll
    gsap.utils.toArray('.gsap-step').forEach((step, i) => {
        gsap.fromTo(step,
            {
                opacity: 0,
                y: 60,
                scale: 0.95
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: step,
                    start: 'top 85%',
                    end: 'top 50%',
                    toggleActions: 'play none none reverse'
                },
                delay: i * 0.15
            }
        );
    });

    // Animate scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        gsap.to(scrollIndicator, {
            opacity: 0,
            scrollTrigger: {
                trigger: '.how-it-works-section',
                start: 'top 90%',
                end: 'top 70%',
                scrub: true
            }
        });
    }

    // Bouncing scroll arrow animation
    const scrollArrow = document.querySelector('.scroll-arrow');
    if (scrollArrow) {
        gsap.to(scrollArrow, {
            y: 10,
            duration: 0.8,
            ease: 'power1.inOut',
            yoyo: true,
            repeat: -1
        });
    }
}

// Export functions
window.toggleDarkMode = toggleDarkMode;
window.initDarkMode = initDarkMode;
window.initGSAPAnimations = initGSAPAnimations;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();

    // Initialize GSAP animations after a short delay to ensure DOM is ready
    setTimeout(initGSAPAnimations, 100);
});
