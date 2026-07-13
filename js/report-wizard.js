/* ==========================================================================
   REPORT WIZARD — 3-step + success
   Steps: 1 = Item Details  2 = Location & Photos  3 = Review & Submit
   ========================================================================== */

(function () {
    'use strict';

    let currentStep = 1;
    const TOTAL_STEPS = 3;


    /* ---- helpers ---- */
    function qs(sel, root) { return (root || document).querySelector(sel); }
    function reduced() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
               document.body.classList.contains('reduced-motion');
    }

    /* ---- progress bar update ---- */
    function updateProgress(step) {
        document.querySelectorAll('.rw-step').forEach((el, i) => {
            const n = i + 1;
            el.classList.remove('active', 'completed');
            if (n < step)  el.classList.add('completed');
            if (n === step) el.classList.add('active');
        });
        document.querySelectorAll('.rw-connector').forEach((el, i) => {
            el.classList.toggle('done', i + 1 < step);
        });
    }

    /* ---- panel transitions (horizontal carousel) ---- */
    function showPanel(toStep, direction) {
        const dir = direction === 'back' ? 'rw-back' : 'rw-fwd';
        const panels = document.querySelectorAll('.rw-panel');
        const target = document.getElementById('rwPanel' + toStep);
        if (!target) return;

        panels.forEach(p => {
            if (p.classList.contains('active') && p !== target) {
                p.classList.remove('rw-fwd', 'rw-back');
                if (!reduced()) {
                    p.classList.add('exit', dir);
                    p.addEventListener('animationend', () => {
                        p.classList.remove('active', 'exit', 'rw-fwd', 'rw-back');
                    }, { once: true });
                } else {
                    p.classList.remove('active', 'exit');
                }
            }
        });

        /* restart the entrance animation cleanly */
        target.classList.remove('exit', 'rw-fwd', 'rw-back');
        void target.offsetWidth; /* force reflow */
        target.classList.add('active', dir);

        currentStep = toStep;
        updateProgress(toStep);

        /* Update mobile header & footer sticky nav on step transitions */
        const mobileHeader = document.getElementById('rw-mobile-header');
        const mobileFooter = document.getElementById('rw-mobile-footer');
        if (mobileHeader && mobileFooter) {
            if (toStep >= 4) {
                mobileHeader.style.display = 'none';
                mobileFooter.style.display = 'none';
            } else {
                mobileHeader.style.display = '';
                mobileFooter.style.display = '';
                
                const stepTitle = document.getElementById('rwMobileStepTitle');
                const progressFill = document.getElementById('rwMobileProgressFill');
                
                const titles = {
                    1: 'Step 1: Details',
                    2: 'Step 2: Location & Photo',
                    3: 'Step 3: Review & Submit'
                };
                const widths = {
                    1: '33.3%',
                    2: '66.6%',
                    3: '100%'
                };
                
                if (stepTitle) stepTitle.textContent = titles[toStep] || '';
                if (progressFill) progressFill.style.width = widths[toStep] || '0%';
                
                const backBtn = document.getElementById('rwMobileBackBtn');
                if (backBtn) {
                    backBtn.style.display = toStep === 1 ? 'none' : 'flex';
                }
                
                const nextBtn = document.getElementById('rwMobileNextBtn');
                if (nextBtn) {
                    if (toStep === 3) {
                        nextBtn.innerHTML = 'Submit <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    } else {
                        nextBtn.innerHTML = 'Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
                    }
                }
            }
        }

        /* Move focus to the new panel's heading for screen-reader users.
           preventScroll keeps the motion horizontal (no vertical jump). */
        const heading = document.getElementById('rwH' + toStep);
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            try { heading.focus({ preventScroll: true }); } catch (_) { heading.focus(); }
        }

        /* Step 2 holds the Leaflet map — it must be initialised/resized only
           once its container is visible, or it renders grey. */
        if (toStep === 2) {
            initMap();
            if (rwMap) {
                setTimeout(() => rwMap.invalidateSize(), 80);
                setTimeout(() => rwMap.invalidateSize(), 480);
            }
        }

        /* Only the success destination jumps the page to the wizard top —
           normal step changes stay put so the motion reads as horizontal. */
        if (toStep === 4) {
            const outer = document.querySelector('.rw-outer');
            if (outer) outer.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        }
    }

    /* ====================================================================
       SATELLITE CAMPUS MAP — real aerial imagery centred on Rouse HS.
       Student taps the map to drop a pin on the exact building / lot / field.
       No floor plan needed; imagery is live from Esri (free, no API key).
       ==================================================================== */

    let rwMap = null;
    let rwMarker = null;
    const ROUSE_QUERY = 'Rouse High School, Leander, TX 78641';
    const ROUSE_FALLBACK = [30.570511, -97.818418]; /* 1222 Raider Way, Leander TX — refined by geocode on load */
    const ROUSE_ZOOM = 18;
    let schoolCenter = ROUSE_FALLBACK.slice();

    /* Campus locations hand-calibrated by dragging each label onto its real
       building in the satellite view (#mapedit mode). */
    const CAMPUS_LOCATIONS = [
        { name: 'Main Building',    lat: 30.571434, lng: -97.819927 },
        { name: 'Cafeteria',        lat: 30.572487, lng: -97.819895 },
        { name: 'Gymnasium',        lat: 30.572663, lng: -97.818725 },
        { name: 'Auditorium',       lat: 30.572182, lng: -97.819777 },
        { name: 'Band Hall',        lat: 30.571961, lng: -97.820656 },
        { name: 'Band Pad',         lat: 30.572681, lng: -97.822030 },
        { name: 'Science Building', lat: 30.571776, lng: -97.818639 },
        { name: 'Baseball Field',   lat: 30.570243, lng: -97.817180, field: true },
        { name: 'Soccer Field',     lat: 30.568136, lng: -97.816579, field: true },
        { name: 'Tennis Courts',    lat: 30.569171, lng: -97.820849, field: true },
        { name: 'Football Field',   lat: 30.569023, lng: -97.819412, field: true },
    ];

    let campusMarkersAdded = false;
    let campusBounds = null;

    /* Hidden calibration mode — add #mapedit to the URL to drag markers onto
       their real buildings; the panel live-prints coordinates to hardcode. */
    const EDIT_MODE = /mapedit/i.test(location.hash) || /mapedit/i.test(location.search);

    function campusIcon(name, isField) {
        return L.divIcon({
            className: 'rw-campus-marker' + (EDIT_MODE ? ' rw-editing' : ''),
            html: '<span class="rw-ci-dot' + (isField ? ' field' : '') + '"></span>' +
                  '<span class="rw-ci-lbl">' + name + '</span>',
            iconSize:   [10, 10],
            iconAnchor: [5, 5]
        });
    }

    function pinAtLocation(loc) {
        rwMap.flyTo([loc.lat, loc.lng], ROUSE_ZOOM, { animate: !reduced(), duration: 0.5 });
        placeMarker(loc.lat, loc.lng, false);

        const locInput = document.getElementById('rw_itemLocation');
        if (locInput) {
            locInput.value = loc.name;
            const hidden = document.getElementById('itemLocation');
            if (hidden) hidden.value = loc.name;
        }
        const addrEl = document.getElementById('itemAddress');
        if (addrEl) addrEl.value = 'Rouse HS — ' + loc.name;

        const readout = document.getElementById('rwMapReadout');
        if (readout) {
            readout.classList.add('has-pin');
            readout.textContent = '📍 ' + loc.name + ' — drag the pin to fine-tune, or add a room number above.';
        }
    }

    function addCampusMarkers() {
        if (campusMarkersAdded || !rwMap) return;
        campusMarkersAdded = true;

        campusBounds = L.latLngBounds(CAMPUS_LOCATIONS.map(l => [l.lat, l.lng]));

        CAMPUS_LOCATIONS.forEach(loc => {
            const m = L.marker([loc.lat, loc.lng], {
                icon: campusIcon(loc.name, !!loc.field),
                title: EDIT_MODE ? loc.name + ' — drag onto the real building' : loc.name + ' — tap to pin this location',
                keyboard: true,
                draggable: EDIT_MODE,
                zIndexOffset: -100
            }).addTo(rwMap);

            if (EDIT_MODE) {
                m.on('dragend', () => {
                    const p = m.getLatLng();
                    loc.lat = +p.lat.toFixed(6);
                    loc.lng = +p.lng.toFixed(6);
                    refreshEditPanel();
                });
            } else {
                m.on('click', e => {
                    L.DomEvent.stopPropagation(e);
                    pinAtLocation(loc);
                });
            }
        });

        if (EDIT_MODE) {
            rwMap.setView(ROUSE_FALLBACK, 17);
            buildEditPanel();
        } else {
            rwMap.fitBounds(campusBounds.pad(0.08), { animate: false });
        }
    }

    /* ---- calibration panel (edit mode only) ---- */
    function editPanelText() {
        const rows = CAMPUS_LOCATIONS.map(l => {
            const pad = (l.name + "',").padEnd(18, ' ');
            return "        { name: '" + pad +
                   ' lat: ' + l.lat.toFixed(6) + ', lng: ' + l.lng.toFixed(6) +
                   (l.field ? ', field: true' : '') + ' },';
        });
        return 'const CAMPUS_LOCATIONS = [\n' + rows.join('\n') + '\n    ];';
    }

    function refreshEditPanel() {
        const ta = document.getElementById('rwEditOut');
        if (ta) ta.value = editPanelText();
    }

    function buildEditPanel() {
        if (document.getElementById('rwEditPanel')) return;
        const panel = document.createElement('div');
        panel.id = 'rwEditPanel';
        panel.innerHTML =
            '<div class="rw-edit-head">🛠 Map calibration — drag each label onto its building</div>' +
            '<textarea id="rwEditOut" readonly spellcheck="false"></textarea>' +
            '<button type="button" id="rwEditCopy">Copy coordinates</button>';
        document.body.appendChild(panel);
        refreshEditPanel();
        const copyBtn = document.getElementById('rwEditCopy');
        copyBtn.addEventListener('click', () => {
            const ta = document.getElementById('rwEditOut');
            ta.select();
            try {
                navigator.clipboard.writeText(ta.value);
            } catch (_) { document.execCommand('copy'); }
            copyBtn.textContent = 'Copied ✓';
            setTimeout(() => { copyBtn.textContent = 'Copy coordinates'; }, 1500);
        });
    }

    function pinIcon() {
        return L.divIcon({
            className: '',
            html: '<div class="rw-pin-marker">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 24 32" ' +
                'fill="currentColor" aria-hidden="true">' +
                '<path d="M12 0C6.5 0 2 4.5 2 10c0 7 10 22 10 22s10-15 10-22C22 4.5 17.5 0 12 0z"/>' +
                '<circle cx="12" cy="10" r="3.4" fill="white"/></svg></div>',
            iconSize: [30, 40],
            iconAnchor: [15, 40],
            popupAnchor: [0, -38]
        });
    }

    function initMap() {
        if (rwMap) return;
        if (typeof L === 'undefined') {
            const readout = document.getElementById('rwMapReadout');
            if (readout) readout.textContent = 'Map unavailable — type the location above.';
            const loading = document.getElementById('rwMapLoading');
            if (loading) loading.classList.add('hidden');
            return;
        }
        const el = document.getElementById('rwMap');
        if (!el) return;

        rwMap = L.map(el, {
            center: ROUSE_FALLBACK,
            zoom: 16,                  /* overview zoom — fitBounds in addCampusMarkers refines this */
            zoomControl: true,
            scrollWheelZoom: false,    /* don't hijack page scroll until focused */
            attributionControl: true
        });

        /* Esri World Imagery — real satellite tiles */
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics'
        }).addTo(rwMap);

        /* transparent labels overlay (streets + place names) for the "hybrid" look */
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            opacity: 0.9
        }).addTo(rwMap);

        rwMap.on('focus', () => rwMap.scrollWheelZoom.enable());
        rwMap.on('blur',  () => rwMap.scrollWheelZoom.disable());

        rwMap.whenReady(() => {
            const loading = document.getElementById('rwMapLoading');
            if (loading) loading.classList.add('hidden');
        });

        rwMap.on('click', e => placeMarker(e.latlng.lat, e.latlng.lng, true));

        /* Add named building markers and fit the view to show the whole campus */
        addCampusMarkers();

        /* refine schoolCenter for the Recenter button (does not reposition the map) */
        geocodeSchool();
    }

    function geocodeSchool() {
        fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' +
              encodeURIComponent(ROUSE_QUERY), { headers: { 'Accept': 'application/json' } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(arr => {
                if (arr && arr[0]) {
                    schoolCenter = [parseFloat(arr[0].lat), parseFloat(arr[0].lon)];
                    /* campus markers already set the view via fitBounds — no reposition */
                }
            })
            .catch(() => { /* keep fallback centre */ });
    }

    function placeMarker(lat, lng, announce) {
        if (!rwMap) return;
        if (rwMarker) {
            rwMarker.setLatLng([lat, lng]);
        } else {
            rwMarker = L.marker([lat, lng], {
                icon: pinIcon(),
                draggable: true,
                keyboard: true,
                title: 'Drag to adjust the exact spot'
            }).addTo(rwMap);

            rwMarker.on('dragend', () => {
                const p = rwMarker.getLatLng();
                storeCoords(p.lat, p.lng);
                announcePin();
            });
        }
        storeCoords(lat, lng);
        if (announce) announcePin();
    }

    function storeCoords(lat, lng) {
        const latEl = document.getElementById('itemLat');
        const lngEl = document.getElementById('itemLng');
        if (latEl) latEl.value = lat.toFixed(6);
        if (lngEl) lngEl.value = lng.toFixed(6);
        const addrEl = document.getElementById('itemAddress');
        if (addrEl) addrEl.value = 'Map pin ' + lat.toFixed(5) + ', ' + lng.toFixed(5);
    }

    function announcePin() {
        const readout = document.getElementById('rwMapReadout');
        if (readout) {
            readout.classList.add('has-pin');
            readout.textContent = '📍 Pin placed — drag it to the exact spot, and add the room/area above.';
        }
    }

    function recenterMap() {
        if (!rwMap) return;
        if (campusBounds) {
            rwMap.flyToBounds(campusBounds.pad(0.08), { animate: !reduced(), duration: 0.6 });
        } else {
            rwMap.setView(schoolCenter, ROUSE_ZOOM);
        }
    }

    function clearPin() {
        if (rwMarker && rwMap) { rwMap.removeLayer(rwMarker); rwMarker = null; }
        const latEl = document.getElementById('itemLat');
        const lngEl = document.getElementById('itemLng');
        const addrEl = document.getElementById('itemAddress');
        if (latEl) latEl.value = '';
        if (lngEl) lngEl.value = '';
        if (addrEl) addrEl.value = '';
        const readout = document.getElementById('rwMapReadout');
        if (readout) {
            readout.classList.remove('has-pin');
            readout.textContent = 'Tap the map to drop a pin where you found it (optional) — or type the room above.';
        }
    }

    /* ---- validation helpers ---- */
    function markValid(fieldEl) {
        fieldEl.classList.remove('rw-invalid');
        const err = fieldEl.querySelector('.rw-err');
        if (err) err.textContent = '';
    }

    function markInvalid(fieldEl, msg) {
        fieldEl.classList.add('rw-invalid');
        const err = fieldEl.querySelector('.rw-err');
        if (err) err.textContent = msg;
    }

    function validateField(fieldEl) {
        const input = fieldEl.querySelector('input, select, textarea');
        if (!input) return true;
        const required = fieldEl.dataset.required !== undefined || input.required;
        if (required && !input.value.trim()) {
            markInvalid(fieldEl, 'This field is required.');
            return false;
        }
        if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
            markInvalid(fieldEl, 'Please enter a valid email address.');
            return false;
        }
        markValid(fieldEl);
        return true;
    }

    /* ---- step validation ---- */
    function validateStep1() {
        const fields = document.querySelectorAll('#rwPanel1 .rw-field[data-required]');
        let ok = true;
        fields.forEach(f => { if (!validateField(f)) ok = false; });
        return ok;
    }

    function validateStep2() {
        const fields = document.querySelectorAll('#rwPanel2 .rw-field[data-required]');
        let ok = true;
        fields.forEach(f => { if (!validateField(f)) ok = false; });
        return ok;
    }

    function validateStep3() {
        const fields = document.querySelectorAll('#rwPanel3 .rw-field[data-required]');
        let ok = true;
        let firstBad = null;
        fields.forEach(f => {
            if (!validateField(f)) { ok = false; if (!firstBad) firstBad = f; }
        });
        if (firstBad) {
            const input = firstBad.querySelector('input, select, textarea');
            if (input) input.focus();
        }
        return ok;
    }

    /* Resolve the category: if "Other" + a specified type, save the specific type */
    function resolveCategory() {
        const sel = document.getElementById('rw_itemCategory');
        const other = document.getElementById('rw_otherCategory');
        const hidden = document.getElementById('itemCategory');
        if (!sel || !hidden) return;
        if (sel.value === 'Other' && other && other.value.trim()) {
            hidden.value = other.value.trim();
        } else {
            hidden.value = sel.value;
        }
    }

    /* ---- navigation ---- */
    function rwNext() {
        if (currentStep === 1) {
            if (!validateStep1()) return;
            resolveCategory();
        }
        if (currentStep === 2 && !validateStep2()) return;
        if (currentStep === 3) { rwSubmit(); return; }
        if (currentStep < TOTAL_STEPS) {
            if (currentStep === 2) rwBuildSummary();
            showPanel(currentStep + 1, 'forward');
        }
    }

    function rwBack() {
        if (currentStep > 1) showPanel(currentStep - 1, 'back');
    }

    function rwGoTo(step) {
        /* only allow jumping back to an earlier (already-seen) step */
        if (step < currentStep) showPanel(step, 'back');
    }

    /* ---- build review summary ---- */
    function rwBuildSummary() {
        resolveCategory();
        const title    = (qs('#itemTitle')?.value    || '').trim();
        const cat      = (qs('#itemCategory')?.value || '').trim();
        const date     = (qs('#itemDate')?.value     || '').trim();
        const loc      = (qs('#itemLocation')?.value || '').trim();
        const desc     = (qs('#itemDescription')?.value || '').trim();

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || '—';
        };

        /* humanize the ISO date for display */
        let dateDisplay = date;
        if (date) {
            const d = new Date(date + 'T00:00:00');
            if (!isNaN(d)) {
                dateDisplay = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            }
        }

        setVal('rwSumTitle',    title);
        setVal('rwSumCategory', cat);
        setVal('rwSumDate',     dateDisplay);
        setVal('rwSumLocation', loc);
        setVal('rwSumDesc',     desc);

        /* thumbnail from photo preview */
        const preview = qs('#rwPhotoPreview');
        const summaryPhoto = document.getElementById('rwSumPhoto');
        const summaryPhotoWrap = document.getElementById('rwSumPhotoWrap');
        if (summaryPhoto && summaryPhotoWrap) {
            const hasPhoto = preview && preview.src && preview.style.display !== 'none';
            if (hasPhoto) {
                summaryPhoto.src = preview.src;
                summaryPhotoWrap.style.display = '';
            } else {
                summaryPhotoWrap.style.display = 'none';
            }
        }
    }

    /* ---- photo preview ---- */
    const MAX_PHOTO_BYTES = 10 * 1024 * 1024; /* 10 MB — matches the hint */

    function initPhotoDropZone() {
        const drop = document.getElementById('rwDrop');
        const input = document.getElementById('reportItemPhoto');
        const preview = document.getElementById('rwPhotoPreview');
        const dropContent = document.getElementById('rwDropContent');
        if (!drop || !input || !preview) return;

        const hint = drop.querySelector('.rw-drop-hint');
        const defaultHint = hint ? hint.textContent : '';

        function dropError(msg) {
            drop.classList.add('rw-drop-invalid');
            if (hint) hint.textContent = msg;
        }
        function clearDropError() {
            drop.classList.remove('rw-drop-invalid');
            if (hint) hint.textContent = defaultHint;
        }

        function validFile(file) {
            if (!file) return false;
            if (!file.type.startsWith('image/')) {
                dropError('That isn’t an image file. Try JPEG, PNG or HEIC.');
                return false;
            }
            if (file.size > MAX_PHOTO_BYTES) {
                dropError('Image is too large (max 10 MB).');
                return false;
            }
            clearDropError();
            return true;
        }

        function showPreview(file) {
            const reader = new FileReader();
            reader.onload = e => {
                const src = e.target.result;
                preview.src = src;
                preview.style.display = 'block';
                if (dropContent) dropContent.style.display = 'none';
                /* sync src to the hidden reportPhotoPreview so forms.js can compute dhash */
                const legacyPreview = document.getElementById('reportPhotoPreview');
                if (legacyPreview) {
                    legacyPreview.src = src;
                    legacyPreview.classList.remove('hidden');
                }
            };
            reader.onerror = () => dropError('Could not read that file. Please try another.');
            reader.readAsDataURL(file);
        }

        function handleFile(file, fromDrop) {
            if (!validFile(file)) {
                /* reject: clear any stray selection so state stays consistent */
                if (!fromDrop) input.value = '';
                return;
            }
            if (fromDrop) {
                try {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    input.files = dt.files;
                } catch (_) {}
            }
            showPreview(file);
        }

        input.addEventListener('change', () => {
            if (input.files && input.files[0]) handleFile(input.files[0], false);
        });

        drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
        drop.addEventListener('drop', e => {
            e.preventDefault();
            drop.classList.remove('dragover');
            const file = e.dataTransfer && e.dataTransfer.files[0];
            if (file) handleFile(file, true);
        });
    }

    /* ---- submit ---- */
    let submitting = false;
    async function rwSubmit() {
        if (submitting) return;                 /* guard against double-submit */

        /* Validate the contact fields here — forms.js writes its errors to a
           hidden status element, so we must catch problems before delegating. */
        if (!validateStep3()) return;
        resolveCategory();

        const btn = document.getElementById('rwSubmitBtn');
        const mBtn = document.getElementById('rwMobileNextBtn');
        const errEl = document.getElementById('rwSubmitError');
        if (errEl) errEl.textContent = '';

        submitting = true;
        if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }
        if (mBtn) { mBtn.disabled = true; mBtn.textContent = 'Submitting…'; }

        /* Success hook fired by forms.js after a successful save */
        let consumed = false;
        window._onReportSuccess = function (item) {
            consumed = true;
            window._onReportSuccess = null;
            rwShowSuccess(item);
        };

        /* Delegate to the existing form submit handler */
        try {
            const form = document.getElementById('reportForm');
            if (form && typeof window.handleReportSubmit === 'function') {
                await window.handleReportSubmit({ preventDefault: () => {}, target: form });
            } else {
                throw new Error('Submit handler unavailable');
            }
        } catch (err) {
            /* swallow — handled by the not-consumed branch below */
        }

        submitting = false;

        /* If the success hook never fired, the save failed — surface it. */
        if (!consumed) {
            window._onReportSuccess = null;
            if (typeof window.hideLoading === 'function') window.hideLoading();
            if (btn) { btn.disabled = false; btn.textContent = 'Submit Report'; }
            if (mBtn) {
                mBtn.disabled = false;
                mBtn.innerHTML = 'Submit <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
            if (errEl) {
                errEl.textContent = 'Something went wrong saving your report. Please check your connection and try again.';
                errEl.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
            }
        }
    }

    /* ---- success screen ---- */
    function rwShowSuccess(item) {
        const successPanel = document.getElementById('rwPanel4');
        if (!successPanel) return;

        /* Fill in success data */
        const idEl = document.getElementById('rwSuccessId');
        const nameEl = document.getElementById('rwSuccessName');
        if (idEl) idEl.textContent = (item && item.id) ? '#' + String(item.id).slice(-6).toUpperCase() : '#—';
        if (nameEl) nameEl.textContent = (item && item.title) ? item.title : '—';

        /* Hide progress bar on success */
        const prog = document.querySelector('.rw-progress');
        if (prog) prog.style.display = 'none';

        showPanel(4, 'forward');

        /* GSAP pop if available */
        if (window.gsap) {
            const icon = successPanel.querySelector('.rw-success-icon');
            if (icon && !reduced()) {
                gsap.fromTo(icon,
                    { scale: 0.3, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' }
                );
            }
        }
    }

    /* ---- reset wizard ---- */
    function rwReset() {
        currentStep = 1;

        /* Show progress bar again */
        const prog = document.querySelector('.rw-progress');
        if (prog) prog.style.display = '';

        /* Reset the hidden legacy form (incl. lat/lng/address hidden inputs) */
        const form = document.getElementById('reportForm');
        if (form) form.reset();

        /* Clear the visible wizard inputs (these live OUTSIDE the hidden form) */
        ['rw_itemTitle', 'rw_itemCategory', 'rw_otherCategory', 'rw_itemDescription',
         'rw_itemDate', 'rw_itemLocation', 'rw_contactName', 'rw_contactEmail', 'rw_contactPhone']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        const otherWrap = document.getElementById('rw_otherWrap');
        if (otherWrap) otherWrap.style.display = 'none';

        /* Hide photo preview, restore drop prompt */
        const preview = document.getElementById('rwPhotoPreview');
        const dropContent = document.getElementById('rwDropContent');
        if (preview) { preview.src = ''; preview.style.display = 'none'; }
        if (dropContent) dropContent.style.display = '';
        const legacyPreview = document.getElementById('reportPhotoPreview');
        if (legacyPreview) { legacyPreview.src = ''; legacyPreview.classList.add('hidden'); }

        /* Clear the map pin + readout */
        clearPin();

        /* Re-enable submit button + clear submit error */
        const submitBtn = document.getElementById('rwSubmitBtn');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Report'; }
        const submitErr = document.getElementById('rwSubmitError');
        if (submitErr) submitErr.textContent = '';
        submitting = false;

        /* Reset community feed switch to default (on) */
        const feedToggle = document.getElementById('rwFeedToggle');
        if (feedToggle) feedToggle.setAttribute('aria-checked', 'true');
        const publicEl = document.getElementById('itemPublic');
        if (publicEl) publicEl.value = 'true';

        /* Clear validation states */
        document.querySelectorAll('.rw-field.rw-invalid').forEach(f => markValid(f));

        showPanel(1, 'back');
    }

    /* ---- inline validation on blur ---- */
    function initInlineValidation() {
        document.querySelectorAll('.rw-field[data-required] input, .rw-field[data-required] select, .rw-field[data-required] textarea')
            .forEach(input => {
                input.addEventListener('blur', () => validateField(input.closest('.rw-field')));
                input.addEventListener('input', () => {
                    if (input.closest('.rw-field').classList.contains('rw-invalid')) {
                        validateField(input.closest('.rw-field'));
                    }
                });
            });
    }

    /* ---- expose to window ---- */
    window.rwNext   = rwNext;
    window.rwBack   = rwBack;
    window.rwGoTo   = rwGoTo;
    window.rwReset  = rwReset;
    window.rwSubmit = rwSubmit;

    let activeStream = null;
    let currentFacingMode = 'environment';
    let capturedDataUrl = null;

    function initCustomCamera() {
        const trigger = document.getElementById('rwCameraTriggerBtn');
        const overlay = document.getElementById('custom-camera-overlay');
        const video = document.getElementById('camera-video');
        const previewImg = document.getElementById('camera-preview-img');
        const flash = document.getElementById('camera-flash');
        
        const closeBtn = document.getElementById('camera-close-btn');
        const switchBtn = document.getElementById('camera-switch-btn');
        const shutterBtn = document.getElementById('camera-shutter-btn');
        const galleryBtn = document.getElementById('camera-gallery-btn');
        
        const controlsShoot = document.getElementById('camera-controls-shoot');
        const controlsPreview = document.getElementById('camera-controls-preview');
        const retakeBtn = document.getElementById('camera-retake-btn');
        const useBtn = document.getElementById('camera-use-btn');
        
        const errorContainer = document.getElementById('camera-error-container');
        const errorUploadBtn = document.getElementById('camera-error-upload-btn');
        const errorCloseBtn = document.getElementById('camera-error-close-btn');
        const fileInput = document.getElementById('reportItemPhoto');

        if (!trigger || !overlay || !video || !fileInput) return;

        // Open Camera overlay
        window.openReportCamera = async () => {
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // prevent scrolling page background
            
            // Default to rear camera if possible
            currentFacingMode = 'environment';
            await startCamera();
        };

        trigger.addEventListener('click', window.openReportCamera);

        // Close Camera
        function closeCameraOverlay() {
            stopCamera();
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
            resetCameraOverlayUI();
        }

        closeBtn.addEventListener('click', closeCameraOverlay);
        errorCloseBtn.addEventListener('click', closeCameraOverlay);

        // Switch Camera
        switchBtn.addEventListener('click', async () => {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            await startCamera();
        });

        // Trigger Shutter click
        shutterBtn.addEventListener('click', () => {
            capturePhoto();
        });

        // Gallery triggers
        galleryBtn.addEventListener('click', () => {
            fileInput.click();
        });
        errorUploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // Close overlay if a file is successfully selected from the gallery
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length > 0) {
                if (!overlay.classList.contains('hidden')) {
                    closeCameraOverlay();
                }
            }
        });

        // Retake
        retakeBtn.addEventListener('click', async () => {
            resetCameraOverlayUI();
            await startCamera();
        });

        // Use Photo
        useBtn.addEventListener('click', () => {
            if (capturedDataUrl) {
                // Apply photo to drop zone & forms
                const photoPreview = document.getElementById('rwPhotoPreview');
                const dropContent = document.getElementById('rwDropContent');
                
                if (photoPreview) {
                    photoPreview.src = capturedDataUrl;
                    photoPreview.style.display = 'block';
                }
                if (dropContent) {
                    dropContent.style.display = 'none';
                }
                
                // Sync to hidden input/image for forms.js
                const legacyPreview = document.getElementById('reportPhotoPreview');
                if (legacyPreview) {
                    legacyPreview.src = capturedDataUrl;
                    legacyPreview.classList.remove('hidden');
                }
                
                // Create a File object from dataurl and assign to fileInput
                try {
                    const blob = dataURLtoBlob(capturedDataUrl);
                    const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                    
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInput.files = dt.files;
                    
                    // Trigger change event to fire any listeners
                    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                } catch(e) {
                    console.error("Failed to set file input files:", e);
                }

                closeCameraOverlay();
            }
        });

        async function startCamera() {
            stopCamera();
            resetCameraOverlayUI();
            
            try {
                const constraints = {
                    video: {
                        facingMode: currentFacingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                };
                
                activeStream = await navigator.mediaDevices.getUserMedia(constraints);
                video.srcObject = activeStream;
                video.style.display = 'block';
            } catch (err) {
                console.error("Camera getUserMedia error:", err);
                showCameraError();
            }
        }

        function stopCamera() {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
                activeStream = null;
            }
            video.srcObject = null;
        }

        function capturePhoto() {
            if (!video.srcObject) return;
            
            // Shutter flash effect
            flash.classList.add('flash-active');
            flash.addEventListener('animationend', () => {
                flash.classList.remove('flash-active');
            }, { once: true });

            // Draw to canvas
            const canvas = document.createElement('canvas');
            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 480;
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            
            const ctx = canvas.getContext('2d');
            
            // Handle mirror image for front camera
            if (currentFacingMode === 'user') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Get JPEG data URL
            capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            
            // Stop video stream and display captured image
            stopCamera();
            video.style.display = 'none';
            previewImg.src = capturedDataUrl;
            previewImg.classList.remove('hidden');
            
            // Toggle controls
            controlsShoot.classList.add('hidden');
            controlsPreview.classList.remove('hidden');
        }

        function showCameraError() {
            errorContainer.classList.remove('hidden');
            controlsShoot.classList.add('hidden');
            controlsPreview.classList.add('hidden');
        }

        function resetCameraOverlayUI() {
            video.style.display = 'block';
            previewImg.src = '';
            previewImg.classList.add('hidden');
            controlsShoot.classList.remove('hidden');
            controlsPreview.classList.add('hidden');
            errorContainer.classList.add('hidden');
            capturedDataUrl = null;
        }

        // Helper: Convert Data URL to Blob
        function dataURLtoBlob(dataurl) {
            var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], {type:mime});
        }
    }

    /* ---- init on DOM ready ---- */
    function init() {
        showPanel(1);
        initPhotoDropZone();
        initInlineValidation();
        initCustomCamera();

        /* Items can't be found in the future — cap the date picker at today */
        const dateInput = document.getElementById('rw_itemDate');
        if (dateInput) {
            const today = new Date();
            const iso = today.getFullYear() + '-' +
                String(today.getMonth() + 1).padStart(2, '0') + '-' +
                String(today.getDate()).padStart(2, '0');
            dateInput.max = iso;
        }

        /* "Other" category toggle */
        const catSel = document.getElementById('itemCategory');
        if (catSel) {
            catSel.addEventListener('change', () => {
                const wrap = document.getElementById('otherCategoryWrap');
                if (wrap) wrap.style.display = catSel.value === 'Other' ? '' : 'none';
            });
        }

        /* "Recenter on school" button */
        const recenterBtn = document.getElementById('rwResetView');
        if (recenterBtn) recenterBtn.addEventListener('click', recenterMap);

        /* Community feed switch */
        const feedToggle = document.getElementById('rwFeedToggle');
        if (feedToggle) {
            feedToggle.addEventListener('click', () => {
                const on = feedToggle.getAttribute('aria-checked') === 'true';
                feedToggle.setAttribute('aria-checked', String(!on));
                const hidden = document.getElementById('itemPublic');
                if (hidden) hidden.value = String(!on);
            });
        }

        /* Drop zone keyboard access (Enter/Space opens the file picker) */
        const drop = document.getElementById('rwDrop');
        const fileInput = document.getElementById('reportItemPhoto');
        if (drop && fileInput) {
            drop.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInput.click();
                }
            });
        }

        /* AI Description Generator */
        const aiDescBtn = document.getElementById('rwAiDescBtn');
        const aiDescStatus = document.getElementById('rwAiDescStatus');
        const descTextarea = document.getElementById('rw_itemDescription');
        const hiddenDesc = document.getElementById('itemDescription');
        const previewImg = document.getElementById('rwPhotoPreview');

        let autoGeneratePending = false;

        async function generateAiDescription(imageSrc) {
            if (!aiDescBtn || !aiDescStatus) return;
            aiDescStatus.textContent = 'Analyzing photo...';
            aiDescStatus.className = 'rw-ai-desc-status loading';
            aiDescStatus.classList.remove('hidden');
            aiDescBtn.disabled = true;

            try {
                let compact = imageSrc;
                if (window.downscaleDataUrl) {
                    try {
                        compact = await window.downscaleDataUrl(imageSrc, 768, 0.82);
                    } catch (e) {
                        console.error('Failed to downscale image:', e);
                    }
                }

                const res = await fetch('/api/match/describe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ image: compact })
                });

                const ct = res.headers.get('content-type') || '';
                let data = null;
                if (ct.includes('application/json')) {
                    data = await res.json();
                } else {
                    await res.text();
                }

                if (!res.ok || !data || !data.description) {
                    throw new Error((data && data.error) || 'Failed to generate description.');
                }

                if (descTextarea) {
                    descTextarea.value = data.description;
                    descTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
                if (hiddenDesc) {
                    hiddenDesc.value = data.description;
                }

                aiDescStatus.textContent = 'Generated!';
                aiDescStatus.className = 'rw-ai-desc-status success';
                setTimeout(() => {
                    aiDescStatus.classList.add('hidden');
                }, 3000);
            } catch (err) {
                console.error(err);
                aiDescStatus.textContent = err.message || 'Error occurred.';
                aiDescStatus.className = 'rw-ai-desc-status error';
            } finally {
                aiDescBtn.disabled = false;
            }
        }

        if (aiDescBtn && fileInput && previewImg) {
            aiDescBtn.addEventListener('click', () => {
                const hasPhoto = previewImg.src && previewImg.style.display !== 'none';
                if (hasPhoto) {
                    generateAiDescription(previewImg.src);
                } else {
                    autoGeneratePending = true;
                    aiDescStatus.textContent = 'Please choose a photo...';
                    aiDescStatus.className = 'rw-ai-desc-status loading';
                    aiDescStatus.classList.remove('hidden');
                    fileInput.click();
                }
            });

            fileInput.addEventListener('change', () => {
                if (autoGeneratePending && fileInput.files && fileInput.files[0]) {
                    autoGeneratePending = false;
                    const file = fileInput.files[0];
                    if (!file.type.startsWith('image/')) {
                        aiDescStatus.textContent = 'Invalid image file.';
                        aiDescStatus.className = 'rw-ai-desc-status error';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = e => {
                        generateAiDescription(e.target.result);
                    };
                    reader.onerror = () => {
                        aiDescStatus.textContent = 'Failed to read photo.';
                        aiDescStatus.className = 'rw-ai-desc-status error';
                    };
                    reader.readAsDataURL(file);
                } else {
                    autoGeneratePending = false;
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
