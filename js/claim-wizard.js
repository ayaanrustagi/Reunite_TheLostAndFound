/* ==========================================================================
   CLAIM WIZARD — 3-step interactive claim form
   Step 1: Pick item   Step 2: Prove it   Step 3: Review   Step 4: Success
   Reads/writes the hidden legacy #claimForm fields so existing submit logic
   (handleClaimSubmit) still works unchanged.
   ========================================================================== */

(function () {
    'use strict';

    let cwStep = 1;
    let cwSelectedItem = null;   // full item object from window.items
    let cwItemsReady = false;    // true once apiSync has populated window.items

    /* ---- helpers ---- */
    function reduced() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
               document.body.classList.contains('reduced-motion');
    }

    function esc(s) {
        return String(s || '').replace(/[&<>"']/g, m => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
        ));
    }

    /* ---- progress indicator ---- */
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

    /* ---- panel slide transitions (same logic as report wizard) ---- */
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

    /* =====================================================================
       STEP 1 — Item Picker
       ===================================================================== */

    function renderItemGrid() {
        const list = document.getElementById('cwItemList');
        if (!list) return;

        // Keep skeletons until apiSync has fired at least once
        if (!cwItemsReady) return;

        const items = (window.items || []).filter(i =>
            (i.status || '').toLowerCase().trim() === 'approved'
        );

        if (!items.length) {
            list.innerHTML = '<div class="cw-empty-state">No approved items in inventory yet.</div>';
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
                     aria-label="${esc(item.title)} — ${esc(item.location || '')}">
                  ${thumb}
                  <div class="cw-item-info">
                    <div class="cw-item-name">${esc(item.title || 'Unnamed item')}</div>
                    <div class="cw-item-meta">${esc(item.location || '—')} · ${date}</div>
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

    window.cwPickItem = function (card, id) {
        const list = document.getElementById('cwItemList');
        if (!list) return;
        list.querySelectorAll('.cw-item-card').forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');

        cwSelectedItem = (window.items || []).find(i => String(i.id) === String(id)) || { id };
        document.getElementById('claimItemId').value = id;

        // Clear any selection error
        const err = document.getElementById('cwItemErr');
        if (err) err.textContent = '';
    };

    /* =====================================================================
       STEP 2 — Prove It
       ===================================================================== */

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
                if (err) err.textContent = f.msg;
                el.parentElement.classList.add('rw-invalid');
                ok = false;
            } else if (f.id === 'cw_email' && !emailRe.test(val)) {
                if (err) err.textContent = 'Enter a valid email address.';
                el.parentElement.classList.add('rw-invalid');
                ok = false;
            } else {
                if (err) err.textContent = '';
                el.parentElement.classList.remove('rw-invalid');
            }
        }

        if (!ok) {
            const firstInvalid = document.querySelector('#cwPanel2 .rw-field.rw-invalid input, #cwPanel2 .rw-field.rw-invalid textarea');
            if (firstInvalid) firstInvalid.focus();
        }
        return ok;
    }

    /* =====================================================================
       STEP 3 — Review
       ===================================================================== */

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

    /* =====================================================================
       Navigation (exposed globally for onclick handlers)
       ===================================================================== */

    window.cwNext = function () {
        if (cwStep === 1) {
            const itemId = document.getElementById('claimItemId').value;
            if (!itemId) {
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
        }
    };

    window.cwBack = function () {
        if (cwStep > 1 && cwStep < 4) showCwPanel(cwStep - 1, 'back');
    };

    window.cwGoTo = function (step) {
        if (step >= 1 && step <= 3) showCwPanel(step, step < cwStep ? 'back' : 'fwd');
    };

    /* =====================================================================
       Submit (step 3 → step 4)
       ===================================================================== */

    window.cwSubmit = async function () {
        const btn    = document.getElementById('cwSubmitBtn');
        const errEl  = document.getElementById('cwSubmitErr');
        if (!btn) return;

        btn.disabled    = true;
        btn.textContent = 'Submitting…';
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
            }

        } catch (err) {
            errEl.textContent = 'An error occurred: ' + (err.message || err);
            btn.disabled      = false;
            btn.textContent   = 'Submit Claim';
        }
    };

    /* =====================================================================
       Reset (start over from success panel)
       ===================================================================== */

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

        renderItemGrid();
        showCwPanel(1, 'back');
    };

    /* =====================================================================
       Photo drop zone — step 2
       ===================================================================== */

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

    /* =====================================================================
       Boot — init when page-claim gains active class
       ===================================================================== */

    function boot() {
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
