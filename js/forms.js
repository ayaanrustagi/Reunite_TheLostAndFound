
// ------------------------------
// Forms
// ------------------------------

// Form validation helper
function validateReportForm() {
    const form = document.getElementById('reportForm');
    resetFormValidation(form);

    let isValid = true;
    const errors = [];

    // Required field validation
    const title = document.getElementById('itemTitle').value.trim();
    if (!title) {
        setFieldState('itemTitle', false, 'ITEM TITLE IS REQUIRED');
        errors.push('title');
        isValid = false;
    }

    const category = document.getElementById('itemCategory').value;
    if (!category) {
        setFieldState('itemCategory', false, 'CATEGORY IS REQUIRED');
        errors.push('category');
        isValid = false;
    }

    const location = document.getElementById('itemLocation').value.trim();
    if (!location) {
        setFieldState('itemLocation', false, 'LOCATION IS REQUIRED');
        errors.push('location');
        isValid = false;
    }

    const date = document.getElementById('itemDate').value;
    if (!date) {
        setFieldState('itemDate', false, 'DATE IS REQUIRED');
        errors.push('date');
        isValid = false;
    }

    const name = document.getElementById('contactName').value.trim();
    if (!name) {
        setFieldState('contactName', false, 'NAME IS REQUIRED');
        errors.push('name');
        isValid = false;
    }

    const email = document.getElementById('contactEmail').value.trim();
    if (!email) {
        setFieldState('contactEmail', false, 'EMAIL IS REQUIRED');
        errors.push('email');
        isValid = false;
    } else if (!emailRegex.test(email)) {
        setFieldState('contactEmail', false, 'INVALID EMAIL FORMAT');
        errors.push('email');
        isValid = false;
    }

    // Focus first invalid field for accessibility
    if (errors.length > 0) {
        const firstErrorField = document.getElementById(
            errors[0] === 'title' ? 'itemTitle' :
                errors[0] === 'category' ? 'itemCategory' :
                    errors[0] === 'location' ? 'itemLocation' :
                        errors[0] === 'date' ? 'itemDate' :
                            errors[0] === 'name' ? 'contactName' : 'contactEmail'
        );
        if (firstErrorField) firstErrorField.focus();
    }

    return isValid;
}
window.validateReportForm = validateReportForm;

async function handleReportSubmit(e) {
    e.preventDefault();
    const statusEl = document.getElementById('reportStatus');

    // Clear previous status
    statusEl.textContent = '';
    statusEl.classList.remove('error', 'success');

    // Validate form first
    if (!validateReportForm()) {
        setStatusMessage('reportStatus', 'PLEASE FILL ALL REQUIRED FIELDS', true);
        return;
    }

    // Show loading state
    showLoading('Submitting report...');

    const title = document.getElementById('itemTitle').value.trim();
    const category = document.getElementById('itemCategory').value;
    const location = document.getElementById('itemLocation').value.trim();
    const date = document.getElementById('itemDate').value;
    const description = document.getElementById('itemDescription').value.trim();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const preview = document.getElementById('reportPhotoPreview');
    const photoBase64 = preview.src;

    let dhash = null;
    let avgColor = null;

    if (photoBase64 && !preview.classList.contains('hidden')) {
        dhash = await computeDHash(preview);
        avgColor = await getDominantColor(preview);
    }

    const newItem = {
        id: "item_" + Math.random().toString(36).substr(2, 9),
        title, category, location, date_found: date, description,
        contact_name: name, contact_email: email,
        image: dhash ? photoBase64 : null,
        dhash: dhash,
        color: avgColor,
        status: 'pending',
        created_at: new Date().toISOString(),
        created_by: email
    };

    // Attempt to save to database
    const success = await supabaseUpsert('items', newItem);
    hideLoading();

    if (success) {
        // Only add to local array and show success if database save succeeded
        window.items.unshift(newItem);

        // Log audit event
        await logAuditEvent('ITEM_UPLOADED', 'item', newItem.id, newItem.title, `Submitted by ${email}`);

        await syncFromSupabase();

        setStatusMessage('reportStatus', 'REPORT LOGGED SUCCESSFULLY - PENDING REVIEW', false);

        // Clear form and preview
        document.getElementById('reportPhotoPreview').classList.add('hidden');
        document.getElementById('reportItemPhoto').parentElement.classList.remove('has-image');
        e.target.reset();

        // Notify User via Email
        sendEmailUpdate(
            newItem.contact_email,
            newItem.contact_name,
            "Report Received",
            "We have successfully logged your report in our system. An administrator will review it shortly.",
            newItem.title
        );
    } else {
        // Show error if database save failed
        setStatusMessage('reportStatus', 'FAILED TO SUBMIT REPORT - PLEASE TRY AGAIN', true);
    }
}
window.handleReportSubmit = handleReportSubmit;

// Claim form validation helper
function validateClaimForm() {
    const form = document.getElementById('claimForm');
    resetFormValidation(form);

    let isValid = true;
    const errors = [];

    const itemId = document.getElementById('claimItemId').value;
    if (!itemId) {
        setFieldState('claimItemId', false, 'PLEASE SELECT AN ITEM');
        errors.push('itemId');
        isValid = false;
    }

    const name = document.getElementById('claimName').value.trim();
    if (!name) {
        setFieldState('claimName', false, 'NAME IS REQUIRED');
        errors.push('name');
        isValid = false;
    }

    const email = document.getElementById('claimEmail').value.trim();
    if (!email) {
        setFieldState('claimEmail', false, 'EMAIL IS REQUIRED');
        errors.push('email');
        isValid = false;
    } else if (!emailRegex.test(email)) {
        setFieldState('claimEmail', false, 'INVALID EMAIL FORMAT');
        errors.push('email');
        isValid = false;
    }

    const message = document.getElementById('claimMessage').value.trim();
    if (!message) {
        setFieldState('claimMessage', false, 'PROOF OF OWNERSHIP IS REQUIRED');
        errors.push('message');
        isValid = false;
    }

    // Focus first invalid field for accessibility
    if (errors.length > 0) {
        const fieldMap = {
            'itemId': 'claimItemId',
            'name': 'claimName',
            'email': 'claimEmail',
            'message': 'claimMessage'
        };
        const firstErrorField = document.getElementById(fieldMap[errors[0]]);
        if (firstErrorField) firstErrorField.focus();
    }

    return isValid;
}
window.validateClaimForm = validateClaimForm;

async function handleClaimSubmit(e) {
    e.preventDefault();
    const statusEl = document.getElementById('claimStatus');

    // Clear previous status
    statusEl.textContent = '';
    statusEl.classList.remove('error', 'success');

    // Validate form first
    if (!validateClaimForm()) {
        setStatusMessage('claimStatus', 'PLEASE FILL ALL REQUIRED FIELDS', true);
        return;
    }

    // Show loading state
    showLoading('Submitting claim...');

    const itemId = document.getElementById('claimItemId').value;
    const name = document.getElementById('claimName').value.trim();
    const email = document.getElementById('claimEmail').value.trim();
    const message = document.getElementById('claimMessage').value.trim();

    const newClaim = {
        id: "claim_" + Math.random().toString(36).substr(2, 9),
        item_id: itemId,
        claimant_name: name,
        claimant_email: email,
        message,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    // Attempt to save to database
    const success = await supabaseUpsert('claims', newClaim);
    hideLoading();

    if (success) {
        // Only add to local array and show success if database save succeeded
        window.claims.unshift(newClaim);

        // Log audit event
        const item = window.items.find(i => i.id === newClaim.item_id);
        await logAuditEvent('CLAIM_SUBMITTED', 'claim', newClaim.id, item?.title || 'Unknown Item', `Claimed by ${email}`);

        await syncFromSupabase();

        setStatusMessage('claimStatus', 'CLAIM DATA RECEIVED - AWAITING VERIFICATION', false);
        e.target.reset();

        // Notify the Original Reporter that someone claimed their item
        if (item && item.contact_email) {
            sendEmailUpdate(
                item.contact_email,
                item.contact_name,
                "New Claim Submitted",
                `A claim has been submitted for your item "${item.title}". Please log in to the portal to review the claim details.`,
                item.title
            );
        }

        // Notify the Claimant
        sendEmailUpdate(
            newClaim.claimant_email,
            newClaim.claimant_name,
            "Claim Received",
            "Your claim has been submitted and is currently being reviewed by our administration team.",
            item ? item.title : "Reported Item"
        );
    } else {
        // Show error if database save failed
        setStatusMessage('claimStatus', 'FAILED TO SUBMIT CLAIM - PLEASE TRY AGAIN', true);
    }
}
window.handleClaimSubmit = handleClaimSubmit;


// ------------------------------
// AI Scanning Simulation
// ------------------------------
function previewFileFind() {
    const fileInput = document.getElementById('findItemPhoto');
    const file = fileInput.files[0];
    const preview = document.getElementById('findPhotoPreview');
    const parent = fileInput.parentElement;

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            parent.classList.add('has-image');
            simulateAiScan();
        };
        reader.readAsDataURL(file);
    } else {
        preview.classList.add('hidden');
        parent.classList.remove('has-image');
    }
}
window.previewFileFind = previewFileFind;

function previewFileReport() {
    const fileInput = document.getElementById('reportItemPhoto');
    const file = fileInput.files[0];
    const preview = document.getElementById('reportPhotoPreview');
    const parent = fileInput.parentElement;

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            parent.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    } else {
        preview.classList.add('hidden');
        parent.classList.remove('has-image');
    }
}
window.previewFileReport = previewFileReport;

async function simulateAiScan() {
    const fileInput = document.getElementById('findItemPhoto');
    const preview = document.getElementById('findPhotoPreview');
    const container = document.getElementById('aiMatchContainer');
    const label = document.getElementById('aiMatchLabel');
    const progress = document.getElementById('aiScanProgress');
    const results = document.getElementById('aiMatchResults');

    container.classList.add('active');
    results.innerHTML = '';

    // Phase 1: Visual Scanning Effect (Instant)
    const scanSteps = [
        { text: "PROCESSING IMAGE...", time: 300 }
    ];

    let totalTime = 0;
    for (let step of scanSteps) {
        label.textContent = step.text;
        totalTime += step.time;
        const p = 100; // Instant fill
        progress.style.width = p + "%";
        await new Promise(r => setTimeout(r, step.time));
    }
    progress.style.width = "100%";

    // Phase 2: Actual Computation
    const currentHash16 = await computeDHash(preview, 16);
    const currentHash8 = await computeDHash(preview, 8);
    const currentColor = await getDominantColor(preview);

    // Phase 3: Scoring & Sorting
    const scoredMatches = window.items
        .filter(it => it.status === 'approved' && it.dhash)
        .map(it => {
            // 1. Structural Match (dHash) - 70% weight
            let dist = 0;
            let maxDist = 0;

            if (it.dhash.length === 256) {
                // Compare with 16x16 hash
                dist = hammingDistance(currentHash16, it.dhash);
                maxDist = 256;
            } else {
                // Backward compatibility: Compare with 8x8 hash
                dist = hammingDistance(currentHash8, it.dhash);
                maxDist = 64;
            }

            const structScore = Math.max(0, Math.floor(((maxDist - dist) / maxDist) * 100));

            // 2. Color Match - 30% weight
            const colorScore = colorMatchScore(currentColor, it.color);

            // Weighted Total
            const confidence = Math.floor((structScore * 0.7) + (colorScore * 0.3));

            return { ...it, confidence, structScore, colorScore };
        })
        .sort((a, b) => b.confidence - a.confidence)
        .filter(it => it.confidence > 65) // Filter low confidence
        .slice(0, 3);

    // Phase 4: Render Results
    if (scoredMatches.length > 0) {
        results.innerHTML = '<div style="margin-top: 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; font-size: 0.7rem; letter-spacing: 0.1em; color: var(--muted-text);">TOP AI MATCHES FOUND:</div>' +
            scoredMatches.map(m => `
                <div class="list-item start-hidden" onclick="openItemModal('${m.id}')" style="cursor: pointer; margin-bottom: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        ${m.image ? `<img src="${m.image}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">` : '<div style="width: 48px; height: 48px; background: #f0f0f0; border-radius: 4px;"></div>'}
                        <div>
                            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-color);">${m.title}</div>
                            <div style="display: flex; gap: 1rem; margin-top: 0.25rem;">
                                <span style="font-size: 0.65rem; padding: 2px 6px; background: rgba(0, 106, 255, 0.1); color: var(--accent-color); border-radius: 3px; font-weight: 600;">${m.confidence}% MATCH</span>
                                <span style="font-size: 0.65rem; color: var(--muted-text);">Color Match: ${Math.round(m.colorScore)}%</span>
                            </div>
                        </div>
                    </div>
                    <div style="color: var(--muted-text);">→</div>
                </div>
            `).join('');
    } else {
        results.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--muted-text); background: rgba(0,0,0,0.02); border-radius: 6px; margin-top: 1rem;">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</div>
                <div style="font-weight: 500;">No high-confidence matches found.</div>
                <div style="font-size: 0.8rem; margin-top: 0.25rem;">Try adjusting the lighting or angle and scan again.</div>
            </div>`;
    }
}
window.simulateAiScan = simulateAiScan;

// Admin Actions
async function approveItem(id) {
    const item = window.items.find(i => i.id === id);
    if (item) {
        const updatedItem = { ...item, status: 'approved' };
        const success = await supabaseUpsert('items', updatedItem);
        if (success) {
            // Log audit event
            await logAuditEvent('ITEM_APPROVED', 'item', item.id, item.title);
            await syncFromSupabase();

            // Notify Reporter
            sendEmailUpdate(
                item.contact_email,
                item.contact_name,
                "Item Approved",
                "Your report has been approved and is now visible in the public inventory.",
                item.title
            );
        }
    }
}
window.approveItem = approveItem;

async function rejectItem(id) {
    const item = window.items.find(i => i.id === id);
    if (item) {
        const updatedItem = { ...item, status: 'rejected' };
        const success = await supabaseUpsert('items', updatedItem);
        if (success) {
            // Log audit event
            await logAuditEvent('ITEM_REJECTED', 'item', item.id, item.title);
            await syncFromSupabase();

            // Notify Reporter
            sendEmailUpdate(
                item.contact_email,
                item.contact_name,
                "Item Update",
                "Your report has been reviewed and was not approved for the public inventory. Please contact administration for more details.",
                item.title
            );
        }
    }
}
window.rejectItem = rejectItem;

async function approveClaim(id) {
    const claim = window.claims.find(c => c.id === id);
    if (claim) {
        const updatedClaim = { ...claim, status: 'approved' };
        const success = await supabaseUpsert('claims', updatedClaim);
        if (success) {
            const item = window.items.find(i => i.id === claim.item_id);

            // Log audit event
            await logAuditEvent('CLAIM_APPROVED', 'claim', claim.id, item?.title || 'Unknown Item', `Verified for ${claim.claimant_name}`);

            await syncFromSupabase();

            // Notify Claimant
            sendEmailUpdate(
                claim.claimant_email,
                claim.claimant_name,
                "Claim Verified",
                "Your claim has been verified! You can now arrange to retrieve your item from the administration office.",
                item ? item.title : "Your Item"
            );
        }
    }
}
window.approveClaim = approveClaim;

async function deleteItem(id) {
    const item = window.items.find(i => i.id === id);
    if (!confirm("PERMANENTLY DELETE THIS ITEM FROM DATABASE?")) return;

    // Log audit event before deletion
    if (item) {
        await logAuditEvent('ITEM_DELETED', 'item', id, item.title);
    }

    await supabaseDelete('items', id);
    await syncFromSupabase();
}
window.deleteItem = deleteItem;

async function deleteClaim(id) {
    const claim = window.claims.find(c => c.id === id);
    if (!confirm("PERMANENTLY DELETE THIS CLAIM RECORD?")) return;

    // Log audit event before deletion
    if (claim) {
        const item = window.items.find(i => i.id === claim.item_id);
        await logAuditEvent('CLAIM_DELETED', 'claim', id, item?.title || 'Unknown Item');
    }

    await supabaseDelete('claims', id);
    await syncFromSupabase();
}
window.deleteClaim = deleteClaim;
