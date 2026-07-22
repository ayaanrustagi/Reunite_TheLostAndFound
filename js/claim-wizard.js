/**
 * @file claim-wizard.js
 * @description Controls the 3-step interactive claim wizard page.
 * Users pick an item, enter personal details/proof, review input, and submit a claim.
 * Coordinates with the standard hidden legacy form fields so form handlers continue to work.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

(function () {
    'use strict';

    let cwStep = 1;
    let cwSelectedItem = null;   // full item object from window.items
    let cwItemsReady = false;    // true once apiSync has populated window.items

    /**
     * Check if prefers-reduced-motion is active or overridden.
     * 
     * @private
     * @returns {Boolean} True if motion animations should be disabled
     */
    function reduced() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
               document.body.classList.contains('reduced-motion');
    }

    /**
     * Escape special HTML characters to prevent XSS.
     * 
     * @private
     * @param {String} s - Target string to escape
     * @returns {String} Escaped string
     */
    function esc(s) {
        return String(s || '').replace(/[&<>"']/g, m => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
        ));
    }

    /**
     * Update the visual step dots and connections indicating progress through the wizard.
     * 
     * @private
     * @param {Number} step - Target active step index
     * @returns {void}
     */
    function updateCwProgress(step) {
        for (let n = 1; n <= 3; n++) {
            const dot  = document.getElementById('cwStepDot' + n);
            const conn = document.getElementById('cwConn' + n);
            if (!dot) continue;
            dot.classList.remove('active', 'completed');
            if (n < step)  dot.classList.add('completed');
            if (n === step) dot.classList.add('active');
            if (conn) conn.classList.toggle('done', n < step);
        }
    }

    /**
     * Slides panels in or out on transition.
     * Handles mobile header step title updates and focus adjustments.
     * 
     * @private
     * @param {Number} toStep - Target step to reveal
     * @param {String} [direction] - Animation slide direction ('fwd'|'back')
     * @returns {void}
     */
    function showCwPanel(toStep, direction) {
        const dirClass = direction === 'back' ? 'rw-back' : 'rw-fwd';
        const panels   = document.querySelectorAll('#page-claim .rw-panel');
        const target   = document.getElementById('cwPanel' + toStep);
        if (!target) return;

        panels.forEach(p => {
            if (p.classList.contains('active') && p !== target) {
                p.classList.remove('rw-fwd', 'rw-back');
                if (!reduced()) {
                    p.classList.add('exit', dirClass);
                    p.addEventListener('animationend', () => {
                        p.classList.remove('active', 'exit', 'rw-fwd', 'rw-back');
                    }, { once: true });
                } else {
                    p.classList.remove('active', 'exit');
                }
            }
        });

        target.classList.remove('exit', 'rw-fwd', 'rw-back');
        void target.offsetWidth; // force reflow for animation restart
        target.classList.add('active', dirClass);

        cwStep = toStep;
        updateCwProgress(toStep);

        /* Update mobile header & footer sticky nav on step transitions */
        const mobileHeader = document.getElementById('cw-mobile-header');
        const mobileFooter = document.getElementById('cw-mobile-footer');
        if (mobileHeader && mobileFooter) {
            if (toStep >= 4) {
                mobileHeader.style.display = 'none';
                mobileFooter.style.display = 'none';
            } else {
                mobileHeader.style.display = '';
                mobileFooter.style.display = '';
                
                const stepTitle = document.getElementById('cwMobileStepTitle');
                const progressFill = document.getElementById('cwMobileProgressFill');
                
                const titles = {
                    1: 'Step 1: Select Item',
                    2: 'Step 2: Prove Ownership',
                    3: 'Step 3: Review & Submit'
                };
                const widths = {
                    1: '33.3%',
                    2: '66.6%',
                    3: '100%'
                };
                
                if (stepTitle) stepTitle.textContent = titles[toStep] || '';
                if (progressFill) progressFill.style.width = widths[toStep] || '0%';
                
                const backBtn = document.getElementById('cwMobileBackBtn');
                if (backBtn) {
                    backBtn.style.display = toStep === 1 ? 'none' : 'flex';
                }
                
                const nextBtn = document.getElementById('cwMobileNextBtn');
                if (nextBtn) {
                    if (toStep === 3) {
                        nextBtn.innerHTML = 'Submit <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    } else {
                        nextBtn.innerHTML = 'Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
                    }
                }
            }
        }

        const heading = document.getElementById('cwH' + toStep);
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            try { heading.focus({ preventScroll: true }); } catch (_) { heading.focus(); }
        }

        if (toStep === 4) {
            const outer = document.querySelector('.cw-outer');
            if (outer) outer.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        }
    }

    /**
     * Render the grid list of approved items that can be claimed.
     * Retains skeletons until items data synchronizes.
     * 
     * @private
     * @returns {void}
     */
    function renderItemGrid() {
        const list = document.getElementById('cwItemList');
        if (!list) return;

        // Keep skeletons until apiSync has fired at least once
        if (!cwItemsReady) return;

        const items = (window.items || []).filter(i =>
            (i.status || '').toLowerCase().trim() === 'approved'
        );

        if (!items.length) {
            list.innerHTML = `
                <div class="cw-empty-state" style="padding: 40px 20px; text-align: center; background: rgba(0,0,0,0.02); border-radius: 16px; border: 1px dashed rgba(0,0,0,0.1); margin-top: 1rem;">
                    <div style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: #111; margin-bottom: 0.5rem; text-transform: none; letter-spacing: normal;">
                        No Items Available
                    </div>
                    <div style="font-family: var(--font-sans); font-size: 0.85rem; color: var(--muted-text); line-height: 1.5; text-transform: none; letter-spacing: normal;">
                        There are currently no <strong>approved</strong> items in the inventory ready to be claimed.<br><br>
                        <em>Note: Newly reported items must be reviewed before they appear here.</em>
                    </div>
                </div>
            `;
            return;
        }

        list.innerHTML = items.map(item => {
            const date   = item.date
                ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—';
            const catTag = (item.category || 'item').slice(0, 4).toUpperCase();
            const thumb  = item.image
                ? `<img class="cw-thumb" src="${esc(item.image)}" alt="${esc(item.title)}">`
                : `<div class="cw-thumb-placeholder">${catTag}</div>`;

            return `
                <div class="cw-item-card" data-id="${esc(item.id)}"
                     onclick="cwPickItem(this, '${esc(item.id)}')"
                     role="radio" tabindex="0" aria-checked="false"
                     aria-label="${esc(item.title)}">
                  ${thumb}
                  <div class="cw-item-info">
                    <div class="cw-item-name">${esc(item.title || 'Unnamed item')}</div>
                  </div>
                  <div class="cw-check" aria-hidden="true">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                         stroke="#fff" stroke-width="3.5" stroke-linecap="round"
                         stroke-linejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>`;
        }).join('');

        // Keyboard support on cards
        list.querySelectorAll('.cw-item-card').forEach(card => {
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    cwPickItem(card, card.dataset.id);
                }
            });
        });

        // Restore pre-selection (from "Claim this item" button on item modal)
        const pre = sessionStorage.getItem('reunite_selected_id');
        if (pre) {
            const preCard = list.querySelector(`[data-id="${pre}"]`);
            if (preCard) cwPickItem(preCard, pre);
        }
    }

    /**
     * Pick/select a specific item to claim. Clears error messages and saves selection.
     * 
     * @global
     * @function cwPickItem
     * @param {HTMLElement} card - Card element clicked/selected
     * @param {String} id - Selected item ID
     * @returns {void}
     */
    window.cwPickItem = function (card, id) {
        const list = document.getElementById('cwItemList');
        if (!list) return;
        list.querySelectorAll('.cw-item-card').forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-checked', 'false');
        });
        
        let targetCard = card || list.querySelector(`[data-id="${id}"]`);
        if (targetCard) {
            targetCard.classList.add('selected');
            targetCard.setAttribute('aria-checked', 'true');
        }

        cwSelectedItem = (window.items || []).find(i => String(i.id) === String(id)) || { id };
        document.getElementById('claimItemId').value = id;

        // Clear any selection error
        const err = document.getElementById('cwItemErr');
        if (err) err.textContent = '';
    };

    /**
     * Validate Step 2 fields: Name, Email format, and Proof Description.
     * 
     * @private
     * @returns {Boolean} True if validation checks pass, false otherwise
     */
    function validateStep2() {
        let ok = true;

        const fields = [
            { id: 'cw_name',    msg: 'Your name is required.' },
            { id: 'cw_email',   msg: 'School email is required.' },
            { id: 'cw_message', msg: 'Proof of ownership is required.' },
        ];

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        for (const f of fields) {
            const el  = document.getElementById(f.id);
            const err = el ? el.nextElementSibling : null;
            if (!el) continue;
            const val = el.value.trim();

            if (!val) {
                if (err) {
                    err.textContent = f.msg;
                    if (!err.id) err.id = 'err-cw-' + Math.random().toString(36).substr(2, 9);
                    el.setAttribute('aria-invalid', 'true');
                    el.setAttribute('aria-describedby', err.id);
                }
                el.parentElement.classList.add('rw-invalid');
                ok = false;
            } else if (f.id === 'cw_email' && !emailRe.test(val)) {
                if (err) {
                    err.textContent = 'Enter a valid email address.';
                    if (!err.id) err.id = 'err-cw-' + Math.random().toString(36).substr(2, 9);
                    el.setAttribute('aria-invalid', 'true');
                    el.setAttribute('aria-describedby', err.id);
                }
                el.parentElement.classList.add('rw-invalid');
                ok = false;
            } else {
                if (err) err.textContent = '';
                el.removeAttribute('aria-invalid');
                el.removeAttribute('aria-describedby');
                el.parentElement.classList.remove('rw-invalid');
            }
        }

        if (!ok) {
            const firstInvalid = document.querySelector('#cwPanel2 .rw-field.rw-invalid input, #cwPanel2 .rw-field.rw-invalid textarea');
            if (firstInvalid) firstInvalid.focus();
        }
        return ok;
    }

    /**
     * Populate Step 3 Review panel with information captured in earlier steps.
     * 
     * @private
     * @returns {void}
     */
    function populateReview() {
        if (cwSelectedItem) {
            document.getElementById('cwRevItem').textContent     = cwSelectedItem.title || '—';
            document.getElementById('cwRevLocation').textContent = cwSelectedItem.location || '—';
            document.getElementById('cwRevDate').textContent     = cwSelectedItem.date
                ? new Date(cwSelectedItem.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : '—';

            // Show item thumbnail in review card
            const revThumbWrap = document.getElementById('cwRevThumbWrap');
            const revThumb     = document.getElementById('cwRevThumb');
            if (revThumbWrap && revThumb && cwSelectedItem.image) {
                revThumb.src              = cwSelectedItem.image;
                revThumbWrap.style.display = 'block';
            } else if (revThumbWrap) {
                revThumbWrap.style.display = 'none';
            }
        }

        document.getElementById('cwRevName').textContent  = document.getElementById('cw_name').value.trim()    || '—';
        document.getElementById('cwRevEmail').textContent = document.getElementById('cw_email').value.trim()   || '—';
        const msg = document.getElementById('cw_message').value.trim();
        document.getElementById('cwRevMessage').textContent = msg.length > 140 ? msg.slice(0, 140) + '…' : (msg || '—');
    }

    /**
     * Advance the wizard to the next step. Handles specific checks for Step 1 and Step 2.
     * 
     * @global
     * @function cwNext
     * @returns {void}
     */
    window.cwNext = function () {
        if (cwStep === 1) {
            if (!cwSelectedItem) {
                const err = document.getElementById('cwItemErr');
                if (err) err.textContent = 'Please select an item first.';
                return;
            }
            showCwPanel(2, 'fwd');

        } else if (cwStep === 2) {
            if (!validateStep2()) return;
            // Sync to hidden legacy fields
            document.getElementById('claimName').value    = document.getElementById('cw_name').value.trim();
            document.getElementById('claimEmail').value   = document.getElementById('cw_email').value.trim();
            document.getElementById('claimMessage').value = document.getElementById('cw_message').value.trim();
            populateReview();
            showCwPanel(3, 'fwd');
        } else if (cwStep === 3) {
            cwSubmit();
        }
    };

    /**
     * Retreat the wizard to the previous step.
     * 
     * @global
     * @function cwBack
     * @returns {void}
     */
    window.cwBack = function () {
        if (cwStep > 1 && cwStep < 4) showCwPanel(cwStep - 1, 'back');
    };

    /**
     * Directly hop/transition to a specified step in the wizard.
     * 
     * @global
     * @function cwGoTo
     * @param {Number} step - Target step number (1-3)
     * @returns {void}
     */
    window.cwGoTo = function (step) {
        if (step >= 1 && step <= 3) showCwPanel(step, step < cwStep ? 'back' : 'fwd');
    };

    /**
     * Submit the claim record to the backend database.
     * Dispatches verification/status updates via email client and navigates to the success panel.
     * 
     * @async
     * @global
     * @function cwSubmit
     * @returns {Promise<void>}
     */
    window.cwSubmit = async function () {
        const btn    = document.getElementById('cwSubmitBtn');
        const mBtn   = document.getElementById('cwMobileNextBtn');
        const errEl  = document.getElementById('cwSubmitErr');
        if (!btn) return;

        btn.disabled    = true;
        btn.textContent = 'Submitting…';
        if (mBtn) {
            mBtn.disabled = true;
            mBtn.textContent = 'Submitting…';
        }
        errEl.textContent = '';

        try {
            // Sync photo preview to legacy field
            const cwPrev  = document.getElementById('cwPhotoPreview');
            const legPrev = document.getElementById('claimPhotoPreview');
            if (cwPrev && legPrev && cwPrev.src && cwPrev.style.display !== 'none') {
                legPrev.src = cwPrev.src;
                legPrev.classList.remove('hidden');
            }

            const itemId  = document.getElementById('claimItemId').value;
            const name    = document.getElementById('claimName').value.trim();
            const email   = document.getElementById('claimEmail').value.trim();
            const message = document.getElementById('claimMessage').value.trim();
            const preview = document.getElementById('claimPhotoPreview');

            const newClaim = {
                id:             'claim_' + Math.random().toString(36).substr(2, 9),
                item_id:        itemId,
                claimant_name:  name,
                claimant_email: email,
                message,
                image:  (preview && !preview.classList.contains('hidden')) ? preview.src : null,
                status: 'pending',
                created_at: new Date().toISOString(),
            };

            const success = await apiUpsert('claims', newClaim);

            if (success) {
                if (window.claims) window.claims.unshift(newClaim);
                if (window.apiSync) await apiSync();

                const item = (window.items || []).find(i => i.id === newClaim.item_id);

                if (item && item.contact_email && window.sendEmailUpdate) {
                    sendEmailUpdate(
                        item.contact_email, item.contact_name,
                        'New Claim Submitted',
                        `A claim has been submitted for your item "${item.title}". Log in to the portal to review it.`,
                        item.title
                    );
                }
                if (window.sendEmailUpdate) {
                    sendEmailUpdate(
                        newClaim.claimant_email, newClaim.claimant_name,
                        'Claim Received',
                        'Your claim has been submitted and is currently being reviewed by our administration team.',
                        item ? item.title : 'Reported Item'
                    );
                }

                // Populate success panel
                const shortId = newClaim.id.split('_')[1] || newClaim.id;
                document.getElementById('cwSuccessId').textContent   = '#' + shortId;
                document.getElementById('cwSuccessItem').textContent = cwSelectedItem ? (cwSelectedItem.title || '—') : '—';

                sessionStorage.removeItem('reunite_selected_id');
                showCwPanel(4, 'fwd');

            } else {
                errEl.textContent    = 'Submission failed — please try again.';
                btn.disabled         = false;
                btn.textContent      = 'Submit Claim';
                if (mBtn) {
                    mBtn.disabled = false;
                    mBtn.innerHTML = 'Submit <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                }
            }

        } catch (err) {
            errEl.textContent = 'An error occurred: ' + (err.message || err);
            btn.disabled      = false;
            btn.textContent   = 'Submit Claim';
            if (mBtn) {
                mBtn.disabled = false;
                mBtn.innerHTML = 'Submit <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
        }
    };

    /**
     * Resets the entire Claim Wizard state.
     * Clears all input elements, resets buttons, and navigates back to Step 1.
     * 
     * @global
     * @function cwReset
     * @returns {void}
     */
    window.cwReset = function () {
        cwSelectedItem = null;

        // Clear wizard inputs
        ['cw_name', 'cw_email', 'cw_message'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.value = ''; el.parentElement.classList.remove('rw-invalid'); }
        });
        // Clear hidden legacy fields
        ['claimItemId', 'claimName', 'claimEmail', 'claimMessage'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        // Clear photo
        const cwPrev = document.getElementById('cwPhotoPreview');
        const cwCont = document.getElementById('cwDropContent');
        const legPrev = document.getElementById('claimPhotoPreview');
        if (cwPrev) { cwPrev.src = ''; cwPrev.style.display = 'none'; }
        if (cwCont) cwCont.style.display = '';
        if (legPrev) { legPrev.src = ''; legPrev.classList.add('hidden'); }

        const err = document.getElementById('cwItemErr');
        if (err) err.textContent = '';
        const subErr = document.getElementById('cwSubmitErr');
        if (subErr) subErr.textContent = '';
        const btn = document.getElementById('cwSubmitBtn');
        if (btn) { btn.disabled = false; btn.textContent = 'Submit Claim'; }
        const mBtn = document.getElementById('cwMobileNextBtn');
        if (mBtn) { mBtn.disabled = false; mBtn.innerHTML = 'Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>'; }

        renderItemGrid();
        showCwPanel(1, 'back');
    };

    /**
     * Initialize Step 2 file upload drag & drop target events.
     * 
     * @private
     * @returns {void}
     */
    function initDrop() {
        const drop    = document.getElementById('cwDrop');
        const input   = document.getElementById('cw_photo');
        const preview = document.getElementById('cwPhotoPreview');
        const content = document.getElementById('cwDropContent');
        if (!drop || !input) return;

        function handleFile(file) {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                preview.src              = e.target.result;
                preview.style.display    = 'block';
                content.style.display    = 'none';
                // Sync to legacy fields so handleClaimSubmit can also read it
                const lp = document.getElementById('claimPhotoPreview');
                if (lp) { lp.src = e.target.result; lp.classList.remove('hidden'); }
            };
            reader.readAsDataURL(file);
        }

        input.addEventListener('change', () => handleFile(input.files[0]));

        drop.addEventListener('dragover',  e => { e.preventDefault(); drop.classList.add('dragover'); });
        drop.addEventListener('dragleave', ()  => drop.classList.remove('dragover'));
        drop.addEventListener('drop',      e  => {
            e.preventDefault();
            drop.classList.remove('dragover');
            handleFile(e.dataTransfer.files[0]);
        });
    }

    /**
     * Run boot initializations on load.
     * Hooks validation error clearing events and renders initial grid.
     * 
     * @private
     * @returns {void}
     */
    function boot() {
        showCwPanel(1);
        initDrop();

        // Live-clear field errors on input
        ['cw_name', 'cw_email', 'cw_message'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', () => {
                el.parentElement.classList.remove('rw-invalid');
                const err = el.nextElementSibling;
                if (err) err.textContent = '';
            });
        });

        renderItemGrid(); // initial render (may show empty if items not loaded yet)
    }

    // Called by apiSync after items load — set ready flag then refresh
    window.renderClaimSelect = function () {
        cwItemsReady = true;
        renderItemGrid();
    };

    // Re-render item list each time the claim page becomes visible
    // (items may have loaded after initial boot)
    const claimSection = document.getElementById('page-claim');
    if (claimSection) {
        const mo = new MutationObserver(() => {
            if (claimSection.classList.contains('active')) renderItemGrid();
        });
        mo.observe(claimSection, { attributes: true, attributeFilter: ['class'] });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();

