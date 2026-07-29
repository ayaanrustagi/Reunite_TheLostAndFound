/* =============================================================================
   MICRO-INTERACTIONS (GSAP)
   Entrance choreography, card tilt, magnetic buttons, status pops,
   drag-over dropzones. Everything checks reduced-motion at run time so the
   in-app accessibility toggle (body.reduced-motion) is honored immediately.
   ============================================================================= */

(function () {
    'use strict';

    function reduced() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            document.body.classList.contains('reduced-motion');
    }

    var hasGSAP = typeof window.gsap !== 'undefined';
    var finePointer = window.matchMedia('(pointer: fine)').matches;

    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    /* ---------- shared: dropzone drag states ---------- */
    function initDropzones() {
        document.querySelectorAll('.file-upload-ui, .fp-drop').forEach(function (zone) {
            ['dragenter', 'dragover'].forEach(function (ev) {
                zone.addEventListener(ev, function (e) {
                    e.preventDefault();
                    zone.classList.add('dragover');
                });
            });
            ['dragleave', 'drop'].forEach(function (ev) {
                zone.addEventListener(ev, function () {
                    zone.classList.remove('dragover');
                });
            });
        });
    }

    /* ---------- shared: tactile button press ---------- */
    function initPressFeedback() {
        if (!hasGSAP) return;
        document.querySelectorAll('.auth-submit, .tech-form .btn-primary').forEach(function (btn) {
            btn.addEventListener('pointerdown', function () {
                if (reduced()) return;
                gsap.to(btn, { scale: 0.97, duration: 0.12, ease: 'power2.out' });
            });
            ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
                btn.addEventListener(ev, function () {
                    if (reduced()) return;
                    gsap.to(btn, { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)' });
                });
            });
        });
    }

    /* ---------- shared: magnetic pull on primary CTAs ---------- */
    function makeMagnetic(el, strengthX, strengthY) {
        if (!hasGSAP || !finePointer || !el) return;
        el.addEventListener('pointermove', function (e) {
            if (reduced()) return;
            var r = el.getBoundingClientRect();
            gsap.to(el, {
                x: (e.clientX - r.left - r.width / 2) * strengthX,
                y: (e.clientY - r.top - r.height / 2) * strengthY,
                duration: 0.4,
                ease: 'power2.out'
            });
        });
        el.addEventListener('pointerleave', function () {
            gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        });
    }

    /* ---------- shared: pop-in for live status messages ---------- */
    function watchStatus(el) {
        if (!hasGSAP || !el) return;
        new MutationObserver(function () {
            if (el.textContent.trim() && !reduced()) {
                gsap.fromTo(el, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
            }
        }).observe(el, { childList: true });
    }

    /* ---------- auth page ---------- */
    function initAuth(card) {
        // Password show/hide
        var pwToggle = document.getElementById('pwToggle');
        var pwInput = document.getElementById('authPassword');
        if (pwToggle && pwInput) {
            pwToggle.addEventListener('click', function () {
                var show = pwInput.type === 'password';
                pwInput.type = show ? 'text' : 'password';
                pwToggle.classList.toggle('revealed', show);
                pwToggle.setAttribute('aria-pressed', String(show));
                pwToggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
            });
        }

        // OTP: digits only
        var otp = document.getElementById('authOTP');
        if (otp) {
            otp.addEventListener('input', function () {
                otp.value = otp.value.replace(/\D/g, '').slice(0, 6);
            });
        }

        // Staggered reveal for auth page elements
        if (hasGSAP && !reduced() && card) {
            var items = card.querySelectorAll('[data-reveal]');
            if (items.length) {
                gsap.fromTo(items,
                    { y: 22, opacity: 0 },
                    {
                        y: 0, opacity: 1,
                        duration: 0.6, ease: 'power3.out',
                        stagger: 0.05,
                        clearProps: 'transform,opacity',
                        overwrite: true
                    }
                );
            }
        }
    }

    /* ---------- index: staggered reveal when a section becomes active ---------- */
    function initSectionReveals() {
        var sections = document.querySelectorAll('.view-section');
        if (!sections.length || !hasGSAP) return;

        function animateIn(section) {
            if (reduced()) return;
            var items = section.querySelectorAll(
                '.section-centered > .label-tech, .section-centered > h2, .tech-form > *'
            );
            if (!items.length) return;
            gsap.fromTo(items,
                { y: 22, opacity: 0 },
                {
                    y: 0, opacity: 1,
                    duration: 0.6, ease: 'power3.out',
                    stagger: 0.05,
                    clearProps: 'transform,opacity',
                    overwrite: true
                }
            );
        }

        var states = new WeakMap();
        var mo = new MutationObserver(function (muts) {
            muts.forEach(function (m) {
                var el = m.target;
                var was = states.get(el) || false;
                var is = el.classList.contains('active');
                states.set(el, is);
                if (is && !was) animateIn(el);
            });
        });
        sections.forEach(function (s) {
            states.set(s, s.classList.contains('active'));
            mo.observe(s, { attributes: true, attributeFilter: ['class'] });
        });
    }

    onReady(function () {
        initDropzones();
        if (!document.body.classList.contains('auth-page')) initPressFeedback();

        var authCard = document.getElementById('authCard');
        if (authCard) initAuth(authCard);

        initSectionReveals();
        watchStatus(document.getElementById('reportStatus'));
        watchStatus(document.getElementById('claimStatus'));

        document.querySelectorAll('.tech-form .btn-primary').forEach(function (btn) {
            makeMagnetic(btn, 0.06, 0.15);
        });
    });
})();
