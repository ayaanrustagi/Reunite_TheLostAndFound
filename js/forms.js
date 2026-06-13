





function validateReportForm() {
    const form = document.getElementById('reportForm');
    resetFormValidation(form);

    let isValid = true;
    const errors = [];


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


    statusEl.textContent = '';
    statusEl.classList.remove('error', 'success');


    if (!validateReportForm()) {
        setStatusMessage('reportStatus', 'PLEASE FILL ALL REQUIRED FIELDS', true);
        return;
    }


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


    const success = await apiUpsert('items', newItem);

    if (success) {
        showSuccess('REPORT LOGGED SUCCESSFULLY');

        window.items.unshift(newItem);
        await apiSync();

        setStatusMessage('reportStatus', 'PENDING REVIEW', false);


        document.getElementById('reportPhotoPreview').classList.add('hidden');
        document.getElementById('reportItemPhoto').parentElement.classList.remove('has-image');
        e.target.reset();


        sendEmailUpdate(
            newItem.contact_email,
            newItem.contact_name,
            "Report Received",
            "We have successfully logged your report in our system. An administrator will review it shortly.",
            newItem.title
        );
    } else {
        hideLoading();
        setStatusMessage('reportStatus', 'FAILED TO SUBMIT REPORT - PLEASE TRY AGAIN', true);
    }
}
window.handleReportSubmit = handleReportSubmit;


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


    statusEl.textContent = '';
    statusEl.classList.remove('error', 'success');


    if (!validateClaimForm()) {
        setStatusMessage('claimStatus', 'PLEASE FILL ALL REQUIRED FIELDS', true);
        return;
    }


    showLoading('Submitting claim...');

    const itemId = document.getElementById('claimItemId').value;
    const name = document.getElementById('claimName').value.trim();
    const email = document.getElementById('claimEmail').value.trim();
    const message = document.getElementById('claimMessage').value.trim();

    const preview = document.getElementById('claimPhotoPreview');
    const photoBase64 = preview.src;

    const newClaim = {
        id: "claim_" + Math.random().toString(36).substr(2, 9),
        item_id: itemId,
        claimant_name: name,
        claimant_email: email,
        message,
        image: (!preview.classList.contains('hidden')) ? photoBase64 : null,
        status: 'pending',
        created_at: new Date().toISOString()
    };


    const success = await apiUpsert('claims', newClaim);

    if (success) {
        showSuccess('CLAIM SUBMITTED - AWAITING REVIEW');

        window.claims.unshift(newClaim);
        await apiSync();

        setStatusMessage('claimStatus', 'AWAITING VERIFICATION', false);
        e.target.reset();


        const item = window.items.find(i => i.id === newClaim.item_id);
        if (item && item.contact_email) {
            sendEmailUpdate(
                item.contact_email,
                item.contact_name,
                "New Claim Submitted",
                `A claim has been submitted for your item "${item.title}". Please log in to the portal to review the claim details.`,
                item.title
            );
        }


        sendEmailUpdate(
            newClaim.claimant_email,
            newClaim.claimant_name,
            "Claim Received",
            "Your claim has been submitted and is currently being reviewed by our administration team.",
            item ? item.title : "Reported Item"
        );
    } else {
        hideLoading();
        setStatusMessage('claimStatus', 'FAILED TO SUBMIT CLAIM - PLEASE TRY AGAIN', true);
    }
}
window.handleClaimSubmit = handleClaimSubmit;





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

function previewFileClaim() {
    const fileInput = document.getElementById('claimItemPhoto');
    const file = fileInput.files[0];
    const preview = document.getElementById('claimPhotoPreview');
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
window.previewFileClaim = previewFileClaim;

async function simulateAiScan() {
    const fileInput = document.getElementById('findItemPhoto');
    const preview = document.getElementById('findPhotoPreview');
    const container = document.getElementById('aiMatchContainer');
    const label = document.getElementById('aiMatchLabel');
    const progress = document.getElementById('aiScanProgress');
    const results = document.getElementById('aiMatchResults');

    container.classList.add('active');
    results.innerHTML = '';


    const scanSteps = [
        { text: "PROCESSING IMAGE...", time: 300 }
    ];

    let totalTime = 0;
    for (let step of scanSteps) {
        label.textContent = step.text;
        totalTime += step.time;
        const p = 100;
        progress.style.width = p + "%";
        await new Promise(r => setTimeout(r, step.time));
    }
    progress.style.width = "100%";


    const currentHash16 = await computeDHash(preview, 16);
    const currentHash8 = await computeDHash(preview, 8);
    const currentColor = await getDominantColor(preview);


    const scoredMatches = window.items
        .filter(it => it.status === 'approved' && it.dhash)
        .map(it => {

            let dist = 0;
            let maxDist = 0;

            if (it.dhash.length === 256) {

                dist = hammingDistance(currentHash16, it.dhash);
                maxDist = 256;
            } else {

                dist = hammingDistance(currentHash8, it.dhash);
                maxDist = 64;
            }

            const structScore = Math.max(0, Math.floor(((maxDist - dist) / maxDist) * 100));


            const colorScore = colorMatchScore(currentColor, it.color);


            const confidence = Math.floor((structScore * 0.7) + (colorScore * 0.3));

            return { ...it, confidence, structScore, colorScore };
        })
        .sort((a, b) => b.confidence - a.confidence)
        .filter(it => it.confidence > 65)
        .slice(0, 3);


    if (scoredMatches.length > 0) {
        results.innerHTML = '<div class="ai-results-header">TOP AI MATCHES FOUND:</div>' +
            scoredMatches.map(m => `
                <button class="list-item start-hidden ai-match-item" onclick="openItemModal('${m.id}')" type="button" aria-label="View details for ${m.title}">
                    <div class="ai-match-content">
                        ${m.image ? `<img src="${m.image}" class="ai-match-thumb" alt="${m.title}">` : '<div class="ai-match-thumb-placeholder"></div>'}
                        <div class="ai-match-info">
                            <div class="ai-match-title">${m.title}</div>
                            <div class="ai-match-meta">
                                <span class="ai-confidence-badge">${m.confidence}% MATCH</span>
                                <span class="ai-color-match">Color Match: ${Math.round(m.colorScore)}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="ai-match-arrow">→</div>
                </button>
            `).join('');
    } else {
        results.innerHTML = `
            <div class="ai-no-match">
                <div class="ai-no-match-icon">🔍</div>
                <div class="ai-no-match-title">No high-confidence matches found.</div>
                <div class="ai-no-match-hint">Try adjusting the lighting or angle and scan again.</div>
            </div>`;
    }
}
window.simulateAiScan = simulateAiScan;


async function approveItem(id) {
    const item = window.items.find(i => i.id === id);
    if (item) {
        const updatedItem = { ...item, status: 'approved' };
        const success = await apiUpsert('items', updatedItem);
        if (success) {
            await apiSync();


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
        const success = await apiUpsert('items', updatedItem);
        if (success) {
            await apiSync();


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
        const success = await apiUpsert('claims', updatedClaim);
        if (success) {
            await apiSync();

            const item = window.items.find(i => i.id === claim.item_id);


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
    if (!confirm("PERMANENTLY DELETE THIS ITEM FROM DATABASE?")) return;
    await apiDelete('items', id);
    await apiSync();
}
window.deleteItem = deleteItem;

async function deleteClaim(id) {
    if (!confirm("PERMANENTLY DELETE THIS CLAIM RECORD?")) return;
    await apiDelete('claims', id);
    await apiSync();
}
window.deleteClaim = deleteClaim;

// Admin: Request photo from report submitter
async function requestItemPhoto(id) {
    const item = window.items.find(i => i.id === id);
    if (!item) return;

    showLoading('Sending request...');

    try {
        await sendEmailUpdate(
            item.contact_email,
            item.contact_name,
            "Photo Requested for Your Report",
            `Our administration team is reviewing your report for "${item.title}" but noticed no photo was attached. To help us verify and approve your report faster, please reply to this email with a clear photo of the item. Thank you!`,
            item.title
        );
        showSuccess('PHOTO REQUEST SENT');
    } catch (err) {
        hideLoading();
        alert('Failed to send email request.');
    }
}
window.requestItemPhoto = requestItemPhoto;

// Admin: Request more details from claimant
async function requestClaimDetails(id) {
    const claim = window.claims.find(c => c.id === id);
    if (!claim) return;

    const item = window.items.find(i => i.id === claim.item_id);

    showLoading('Sending request...');

    try {
        await sendEmailUpdate(
            claim.claimant_email,
            claim.claimant_name,
            "Additional Details Needed for Your Claim",
            `Our team is reviewing your claim for "${item?.title || 'the reported item'}". To help us verify your ownership, please reply with additional proof such as: a photo of the item, a receipt, serial numbers, or any unique identifying details. Thank you for your patience!`,
            item?.title || "Claimed Item"
        );
        showSuccess('DETAILS REQUEST SENT');
    } catch (err) {
        hideLoading();
        alert('Failed to send email request.');
    }
}
window.requestClaimDetails = requestClaimDetails;
