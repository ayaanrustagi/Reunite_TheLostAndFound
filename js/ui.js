



/**
 * @file ui.js
 * @description Manages general page transitions, modal overlays, messages submission overlays,
 * responsive sidebars navigation states, and custom accessibility helpers (Text-to-Speech, Contrast toggles, and Font Scaling).
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

/**
 * Transition the visible viewport section to the specified page identifier.
 * Adjusts sticky mobile elements, navigation active states, triggers component renders, and repositions document focus.
 * 
 * @function navigateToSection
 * @param {String} sectionId - Target section name (e.g. 'found', 'report', 'claim', 'dashboard')
 * @returns {void}
 */
function navigateToSection(sectionId) {
    // Check for login required sections
    if ((sectionId === 'dashboard' || sectionId === 'admin') && !window.currentUser) {
        if (typeof window.goLogin === 'function') {
            window.goLogin();
        } else {
            window.location.href = 'login.html';
        }
        return;
    }

    // Mobile Snapchat-style camera trigger for report
    if (sectionId === 'report' && window.innerWidth <= 1024) {
        const fileInput = document.getElementById('reportItemPhoto');
        if ((!fileInput || fileInput.files.length === 0) && window.openReportCamera) {
            window.openReportCamera();
        }
    }

    // jump between pages
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`page-${sectionId}`);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }

    // Toggle wizard-active on body to hide/show mobile navigation bar reliably
    const isWizard = (sectionId === 'report' || sectionId === 'claim');
    document.body.classList.toggle('wizard-active', isWizard);

    document.querySelectorAll('.nav-btn, .dock-btn').forEach(btn => {
        const action = btn.getAttribute('data-action');
        if (action) {
            btn.classList.toggle('active', action.includes(sectionId));
        } else {
            btn.classList.remove('active');
        }
    });

    if (sectionId === 'found' && window.renderFound) window.renderFound();
    if (sectionId === 'claim' && window.renderClaimSelect) window.renderClaimSelect();
    if (sectionId === 'dashboard') {
        if (window.renderDashboard) window.renderDashboard();
        if (window.switchDashboardTab) window.switchDashboardTab('student', 'reports');
    }
    if (sectionId === 'admin') {
        if (window.renderAdmin) window.renderAdmin();
        if (window.switchDashboardTab) window.switchDashboardTab('admin', 'queues');
    }
    if (sectionId === 'how' && window.handleSplitScroll) {
        setTimeout(window.handleSplitScroll, 50);
    }

    window.history.pushState(null, null, `#${sectionId}`);

    setTimeout(() => {
        setFocusForSection(sectionId);
    }, 100);
}
window.navigateToSection = navigateToSection;

/**
 * Move programmatic browser focus to the primary input or heading element in the target section.
 * Enhances keyboard and screen-reader user flows.
 * 
 * @private
 * @param {String} sectionId - Target section page identifier
 * @returns {void}
 */
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
            if (focusTarget) {
                focusTarget.setAttribute('tabindex', '-1');
                focusTarget.style.outline = 'none';
            }
            break;
        default:
            break;
    }

    if (focusTarget) {
        focusTarget.focus({ preventScroll: true });
    }
}

let lastFocusedElement = null;

/**
 * Open the detailed modal overlay for a specific lost/found item.
 * Preserves the trigger element focus target for modal close retrieval.
 * 
 * @function openItemModal
 * @param {String} id - Item ID to display details for
 * @returns {void}
 */
function openItemModal(id) {
    // show item popover
    const item = window.items.find(i => i.id === id);
    if (!item) return;

    // Store element that opened modal
    lastFocusedElement = document.activeElement;

    // Use consistent clean color for modal
    const bg = `oklch(0.96 0.02 220)`; // premium light background
    const fg = `oklch(0.20 0.05 220)`; // dark slate for text

    const modal = document.getElementById('itemModal');
    const modalBox = modal.querySelector('.modal-box');
    if (modalBox) {
        modalBox.style.setProperty('--modal-bg', bg);
        modalBox.style.setProperty('--modal-fg', fg);
    }

    // Set textual details
    const catText = (item.category || 'other').toString().toUpperCase();
    const catEl = document.getElementById('modalCategory');
    if (catEl) catEl.textContent = catText;

    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalLocation').textContent = item.location;
    document.getElementById('modalDescription').textContent = item.description;
    document.getElementById('modalContactName').textContent = item.contact_name;
    document.getElementById('modalDate').textContent = item.date_found;

    // Manage image vs placeholder
    const modalImg = document.getElementById('modalImage');
    const placeholderEl = document.getElementById('modalPlaceholder');

    if (item.image) {
        modalImg.src = item.image;
        modalImg.classList.remove('hidden');
        if (placeholderEl) {
            placeholderEl.classList.add('hidden');
            placeholderEl.innerHTML = "";
        }
    } else {
        modalImg.src = "";
        modalImg.classList.add('hidden');
        if (placeholderEl) {
            placeholderEl.classList.remove('hidden');
            const patternId = 'modal-stp-' + item.id;
            placeholderEl.innerHTML = `
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="width: 100%; height: 100%;">
                  <defs>
                    <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                      <rect width="5" height="5" fill="${bg}"/>
                      <line x1="0" y1="0" x2="0" y2="5" stroke="${fg}" stroke-opacity="0.22" stroke-width="1"/>
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#${patternId})"/>
                </svg>
                <div class="fp-photo-label" style="color:${fg}">${catText}</div>
            `;
        }
    }

    sessionStorage.setItem('reunite_selected_id', id);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isReducedMode = prefersReducedMotion || document.body.classList.contains('reduced-motion');

    if (lastFocusedElement && !isReducedMode && modalBox) {
        const clickedCard = lastFocusedElement.closest('.item-card, .ai-match-item');
        if (clickedCard) {
            // Get original card coordinates
            const rect = clickedCard.getBoundingClientRect();

            // Store active opening card
            window.activeOpeningCard = clickedCard;

            // Fade out original card smoothly
            clickedCard.style.transition = 'opacity 0.15s ease-out';
            clickedCard.style.opacity = '0';

            // Show modal overlay to calculate its final layout
            modal.classList.add('expanding-card');
            modal.style.animation = 'none'; // Prevent CSS modalFadeIn from interfering
            modal.style.opacity = '0'; // Start overlay transparent
            modal.classList.remove('hidden');

            const finalRect = modalBox.getBoundingClientRect();

            // Calculate inverse transforms for FLIP
            const scaleX = rect.width / finalRect.width;
            const scaleY = rect.height / finalRect.height;
            const centerOriginalX = rect.left + rect.width / 2;
            const centerOriginalY = rect.top + rect.height / 2;
            const centerFinalX = finalRect.left + finalRect.width / 2;
            const centerFinalY = finalRect.top + finalRect.height / 2;
            
            const translateX = centerOriginalX - centerFinalX;
            const translateY = centerOriginalY - centerFinalY;

            // Apply starting state
            modalBox.style.transition = 'none';
            modalBox.style.transformOrigin = 'center center';
            modalBox.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
            modalBox.style.filter = 'blur(10px)';
            modalBox.style.opacity = '0.3'; // Start semi-transparent to blend with card fade

            // Force reflow
            modalBox.offsetHeight;

            // Play transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    modalBox.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease-out, filter 0.35s ease-out';
                    modalBox.style.transform = 'translate(0px, 0px) scale(1, 1)';
                    modalBox.style.filter = 'blur(0px)';
                    modalBox.style.opacity = '1';

                    modal.style.transition = 'opacity 0.35s ease-out';
                    modal.style.opacity = '1';
                });
            });

            // Clean up style tags when transition ends
            setTimeout(() => {
                modalBox.style.transition = '';
                modalBox.style.transformOrigin = '';
                modalBox.style.transform = '';
                modalBox.style.filter = '';
                modalBox.style.opacity = '';
                
                modal.style.transition = '';
                modal.style.opacity = '';
                modal.style.animation = '';
                
                // Clear the transition property on the clicked card, but keep it transparent
                if (window.activeOpeningCard) {
                    window.activeOpeningCard.style.transition = '';
                }

                const closeBtn = modal.querySelector('.close-btn');
                if (closeBtn) closeBtn.focus();
            }, 420);

            return;
        }
    }

    modal.classList.remove('hidden');
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 50);
    }
}
window.openItemModal = openItemModal;

/**
 * Close the detailed item modal and return focus to the trigger element.
 * 
 * @function closeModal
 * @returns {void}
 */
function closeModal() {
    const modal = document.getElementById('itemModal');
    const modalBox = modal.querySelector('.modal-box');
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isReducedMode = prefersReducedMotion || document.body.classList.contains('reduced-motion');

    if (window.activeOpeningCard && modalBox && !isReducedMode && !modal.classList.contains('hidden')) {
        const rect = window.activeOpeningCard.getBoundingClientRect();
        const finalRect = modalBox.getBoundingClientRect();
        
        const scaleX = rect.width / finalRect.width;
        const scaleY = rect.height / finalRect.height;
        const centerOriginalX = rect.left + rect.width / 2;
        const centerOriginalY = rect.top + rect.height / 2;
        const centerFinalX = finalRect.left + finalRect.width / 2;
        const centerFinalY = finalRect.top + finalRect.height / 2;
        
        const translateX = centerOriginalX - centerFinalX;
        const translateY = centerOriginalY - centerFinalY;

        modal.style.animation = 'none'; // Ensure CSS animations don't override the JS transition
        
        // Fade the original card back in smoothly
        window.activeOpeningCard.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        window.activeOpeningCard.style.opacity = '1';

        // Shrink and fade out the modal box
        modalBox.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        modalBox.style.transformOrigin = 'center center';
        modalBox.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
        modalBox.style.filter = 'blur(10px)';
        modalBox.style.opacity = '0';

        // Fade out the overlay background
        modal.style.transition = 'opacity 0.3s ease-out';
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('expanding-card');
            
            modalBox.style.transition = '';
            modalBox.style.transformOrigin = '';
            modalBox.style.transform = '';
            modalBox.style.filter = '';
            modalBox.style.opacity = '';
            
            modal.style.transition = '';
            modal.style.opacity = '';
            modal.style.animation = '';
            
            if (window.activeOpeningCard) {
                window.activeOpeningCard.style.transition = '';
                window.activeOpeningCard = null;
            }
            if (lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }
        }, 310);
        return;
    }

    modal.classList.add('hidden');
    modal.classList.remove('expanding-card');
    modal.style.animation = '';

    if (modalBox) {
        modalBox.style.transition = '';
        modalBox.style.transformOrigin = '';
        modalBox.style.transform = '';
        modalBox.style.filter = '';
        modalBox.style.opacity = '';
    }

    // Return focus to the element that opened it
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
    // Restore opacity on the original card
    if (window.activeOpeningCard) {
        window.activeOpeningCard.style.opacity = '1';
        window.activeOpeningCard.style.transition = '';
        window.activeOpeningCard = null;
    }
}
window.closeModal = closeModal;

/**
 * Open the messenger popover pre-targeted at the owner/finder of the active item.
 * 
 * @function openSendMessageModal
 * @returns {void}
 */
function openSendMessageModal() {
    const id = sessionStorage.getItem('reunite_selected_id');
    const item = window.items.find(i => i.id === id);
    if (!item) return;

    lastFocusedElement = document.activeElement;

    // Prefill user details if logged in
    const nameInput = document.getElementById('smSenderName');
    const emailInput = document.getElementById('smSenderEmail');
    const textInput = document.getElementById('smText');

    if (window.currentUser) {
        nameInput.value = window.currentUser.full_name || window.currentUser.name || "";
        emailInput.value = window.currentUser.email || "";
    } else {
        nameInput.value = "";
        emailInput.value = "";
    }
    if (item) {
        // Pre-fill recipient based on item
        const recip = document.getElementById('smRecipient');
        if (recip) {
            recip.innerHTML = `
                <option value="${item.contact_email || item.finder_email || 'admin'}">${item.finder_name || 'Item Reporter'}</option>
                <option value="admin">System Admins</option>
            `;
        }
    }

    document.getElementById('sendMessageModal').classList.remove('hidden');
}
window.openSendMessageModal = openSendMessageModal;

/**
 * Open the messenger popover with general system admin message routing.
 * 
 * @function openGeneralMessageModal
 * @returns {void}
 */
function openGeneralMessageModal() {
    // Clear item context
    sessionStorage.removeItem('reunite_selected_id');
    
    lastFocusedElement = document.activeElement;
    
    // Prefill user details if logged in
    const nameInput = document.getElementById('smSenderName');
    const emailInput = document.getElementById('smSenderEmail');
    const textInput = document.getElementById('smText');
    const recip = document.getElementById('smRecipient');

    if (window.currentUser) {
        nameInput.value = window.currentUser.full_name || window.currentUser.name || "";
        emailInput.value = window.currentUser.email || "";
    } else {
        nameInput.value = "";
        emailInput.value = "";
    }
    textInput.value = "";

    if (recip) {
        recip.innerHTML = `<option value="admin">System Admins</option>`;
    }

    document.getElementById('sendMessageModal').classList.remove('hidden');
}
window.openGeneralMessageModal = openGeneralMessageModal;

/**
 * Close the message modal and restore element focus.
 * 
 * @function closeSendMessageModal
 * @returns {void}
 */
function closeSendMessageModal() {
    document.getElementById('sendMessageModal').classList.add('hidden');
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}
window.closeSendMessageModal = closeSendMessageModal;

/**
 * Validate and submit the message payload to the messages REST endpoint.
 * Triggers optional email notifications via EmailJS.
 * 
 * @async
 * @function handleSendMessageSubmit
 * @param {Event} [event] - Event object
 * @returns {Promise<void>}
 */
async function handleSendMessageSubmit(event) {
    if (event) event.preventDefault();
    const id = sessionStorage.getItem('reunite_selected_id');
    const item = window.items.find(i => i.id === id);
    const senderName = document.getElementById('smSenderName').value.trim();
    const senderEmail = document.getElementById('smSenderEmail').value.trim();
    const messageText = document.getElementById('smText').value.trim();

    if (!senderName || !senderEmail || !messageText) {
        if (window.showError) window.showError("Please fill in all fields");
        return;
    }

    const recipientVal = document.getElementById('smRecipient') ? document.getElementById('smRecipient').value : "admin";
    const recipientEmail = recipientVal === "admin" ? "admin@reunite.com" : recipientVal;

    const msgRecord = {
        id: "msg_" + Math.random().toString(36).substr(2, 9),
        item_id: item ? item.id : null,
        item_title: item ? (item.title || item.item_name) : 'General Inquiry',
        sender_name: senderName,
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        message: messageText,
        created_at: new Date().toISOString()
    };

    if (window.showLoading) window.showLoading("Sending message...");
    const success = await window.apiUpsert('messages', msgRecord);
    
    if (success) {
        if (window.showSuccess) {
            window.showSuccess("Message Sent!");
        } else {
            window.showSuccess("Message Sent!");
        }
        
        closeSendMessageModal();

        // Also trigger email notification via EmailJS if enabled
        if (window.sendEmailUpdate) {
            try {
                await window.sendEmailUpdate(
                    msgRecord.recipient_email,
                    item.finder_name || "REUNITE User",
                    `Inquiry about: ${msgRecord.item_title}`,
                    `Hey ${item.finder_name || "there"},\n\n` +
                    `${msgRecord.sender_name} (${msgRecord.sender_email}) sent you a message about your item "${msgRecord.item_title}":\n\n` +
                    `"${msgRecord.message}"\n\n` +
                    `Log in to the dashboard to view and reply to this message.`,
                    msgRecord.item_title
                );
            } catch (emailErr) {
                console.error("EmailJS Error:", emailErr);
            }
        }
    } else {
        if (window.hideLoading) window.hideLoading();
        if (window.showError) window.showError("Failed to send message");
    }
}
window.handleSendMessageSubmit = handleSendMessageSubmit;

/**
 * Open detail popups for specific entities inside the administration control console view.
 * 
 * @function openAdminDetailModal
 * @param {String} type - Entity type ('report'|'claim')
 * @param {String} id - Target entity ID
 * @returns {void}
 */
function openAdminDetailModal(type, id) {
    let content = '';
    const modal = document.getElementById('adminDetailModal');
    const contentEl = document.getElementById('adminModalContent');
    const titleEl = document.getElementById('adminModalTitle');

    if (type === 'report') {
        const item = window.items.find(i => i.id === id);
        if (!item) return;
        titleEl.textContent = "REPORT DETAILS";
        content = `
            <div class="admin-detail-view">
                <div class="admin-detail-main">
                    <h2>${item.title}</h2>
                    <div class="meta-tags">
                        <span class="meta-tag">${item.category}</span>
                        <span class="meta-tag">${item.location}</span>
                        <span class="meta-tag">${new Date(item.date_found).toLocaleDateString()}</span>
                    </div>
                    ${item.image ? `<img src="${item.image}" class="modal-photo" alt="Item">` : '<div class="no-photo-placeholder">NO IMAGE ATTACHED</div>'}
                    <div class="detail-section">
                        <h4>DESCRIPTION</h4>
                        <p class="desc-text">${item.description || 'No description provided.'}</p>
                    </div>
                </div>
                <div class="admin-detail-sidebar">
                    <div class="detail-section">
                        <h4>REPORTER</h4>
                        <p><strong>Name:</strong> ${item.contact_name || item.finder_name || 'N/A'}</p>
                        <p><strong>Email:</strong> ${item.contact_email || item.finder_email || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${item.contact_phone || item.finder_phone || 'N/A'}</p>
                    </div>
                    <div class="detail-section">
                        <h4>ACTIONS</h4>
                        <div class="admin-actions-vertical">
                            <button onclick="approveItem('${item.id}'); closeAdminDetailModal();" class="btn btn-primary full-width">APPROVE REPORT</button>
                            <button onclick="rejectItem('${item.id}'); closeAdminDetailModal();" class="btn btn-outline red full-width">REJECT</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'claim') {
        const claim = window.claims.find(c => c.id === id);
        if (!claim) return;
        const item = window.items.find(it => it.id === claim.item_id);
        titleEl.textContent = "CLAIM DETAILS";
        content = `
            <div class="admin-detail-view">
                <div class="admin-detail-main">
                    <h2>Claim for: ${item?.title || 'Unknown Item'}</h2>
                    <div class="meta-tags">
                        <span class="meta-tag">ITEM ID: ${claim.item_id.substring(0, 8)}</span>
                        <span class="meta-tag">CLAIM STATUS: ${claim.status.toUpperCase()}</span>
                    </div>
                    ${claim.image ? `<img src="${claim.image}" class="modal-photo" alt="Proof">` : '<div class="no-photo-placeholder">NO PROOF IMAGE ATTACHED</div>'}
                    <div class="detail-section">
                        <h4>PROOF OF OWNERSHIP / DESCRIPTION</h4>
                        <p class="desc-text">${claim.description || claim.message || claim.claimer_message || 'No description provided.'}</p>
                    </div>
                </div>
                <div class="admin-detail-sidebar">
                    <div class="detail-section">
                        <h4>CLAIMANT</h4>
                        <p><strong>Name:</strong> ${claim.claimant_name || claim.claimer_name || 'N/A'}</p>
                        <p><strong>Email:</strong> ${claim.claimant_email || claim.claimer_email || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${claim.claimant_phone || claim.claimer_phone || 'N/A'}</p>
                    </div>
                    <div class="detail-section">
                        <h4>ACTIONS</h4>
                        <div class="admin-actions-vertical">
                            <button onclick="approveClaim('${claim.id}'); closeAdminDetailModal();" class="btn btn-primary full-width">VERIFY CLAIM</button>
                            <button onclick="requestClaimDetails('${claim.id}'); closeAdminDetailModal();" class="btn btn-outline orange full-width">REQUEST MORE INFO</button>
                            <button onclick="deleteClaim('${claim.id}'); closeAdminDetailModal();" class="btn btn-outline red full-width">PURGE CLAIM</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    contentEl.innerHTML = content;
    modal.classList.remove('hidden');
    lastFocusedElement = document.activeElement;

    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 50);
    }
}
window.openAdminDetailModal = openAdminDetailModal;

/**
 * Close the administration detail modal and restore focus.
 * 
 * @function closeAdminDetailModal
 * @returns {void}
 */
function closeAdminDetailModal() {
    document.getElementById('adminDetailModal').classList.add('hidden');
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}
window.closeAdminDetailModal = closeAdminDetailModal;

// Keyboard "Escape" to Close & Trap Focus
document.addEventListener('keydown', (e) => {
    const openModals = document.querySelectorAll('.modal-overlay:not(.hidden), .claim-lightbox:not(.hidden), #custom-camera-overlay:not(.hidden)');
    if (openModals.length === 0) return;
    
    const activeModal = openModals[openModals.length - 1]; // last one opened
    
    if (e.key === 'Escape') {
        if (activeModal.id === 'sendMessageModal') closeSendMessageModal();
        else if (activeModal.id === 'itemModal') closeModal();
        else if (activeModal.id === 'adminDetailModal') { if (window.closeAdminDetailModal) window.closeAdminDetailModal(); }
        else if (activeModal.id === 'sourcesModal') { if (window.closeSourcesModal) window.closeSourcesModal(); }
        else if (activeModal.id === 'settingsModal') { if (window.closeSettingsModal) window.closeSettingsModal(); }
        else if (activeModal.classList.contains('claim-lightbox')) { if (window.closeClaimLightbox) window.closeClaimLightbox(); }
        else if (activeModal.id === 'custom-camera-overlay') { if (window.closeCameraOverlay) window.closeCameraOverlay(); }
        return;
    }

    if (e.key === 'Tab') {
        // Trap focus inside the modal
        const focusableElements = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length === 0) {
            e.preventDefault();
            return;
        }
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement || !activeModal.contains(document.activeElement)) {
                lastElement.focus();
                e.preventDefault();
            }
        } else { // Tab
            if (document.activeElement === lastElement || !activeModal.contains(document.activeElement)) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }
});

/**
 * Toggle custom subcategory textboxes depending on selection.
 * 
 * @function toggleOtherCat
 * @returns {void}
 */
function toggleOtherCat() {
    const cat = document.getElementById('itemCategory').value;
    document.getElementById('otherCategoryWrap').classList.toggle('hidden', cat !== 'Other');
}
window.toggleOtherCat = toggleOtherCat;

/**
 * Toggles registration roles and updates input groups.
 * 
 * @function toggleAdminField
 * @returns {void}
 */
function toggleAdminField() {
    const isChecked = document.getElementById('isAdminToggle').checked;
    const roleSelect = document.getElementById('loginRole');
    const codeWrap = document.getElementById('adminCodeWrap');

    roleSelect.value = isChecked ? 'admin' : 'student';
    codeWrap.classList.toggle('hidden', !isChecked);
}
window.toggleAdminField = toggleAdminField;

/**
 * Handle cyclical rotating banner headers.
 * 
 * @function initHeroRotation
 * @returns {void}
 */
function initHeroRotation() {
    const titles = [
        "LOST VALUABLES",
        "WHERE DID IT GO",
        "LOST AN ITEM",
        "CAN'T FIND IT",
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

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Ensure we start clean by removing initial reveal class which has a delay
    titleEl.classList.remove('text-reveal');
    subEl.classList.remove('text-reveal');

    // Reset styles that might have been set by the previous JS implementation
    titleEl.style.cssText = '';
    subEl.style.cssText = '';

    // Apply explicit 0 delay to ensure sync
    titleEl.style.animationDelay = '0s';
    subEl.style.animationDelay = '0s';

    setInterval(() => {
        tIndex = (tIndex + 1) % titles.length;
        sIndex = (sIndex + 1) % subs.length;

        // Add exit class
        titleEl.classList.remove('text-slide-in');
        subEl.classList.remove('text-slide-in');

        // Force reflow
        void titleEl.offsetWidth;

        titleEl.classList.add('text-slide-out');
        subEl.classList.add('text-slide-out');

        setTimeout(() => {
            // Swap text
            titleEl.textContent = titles[tIndex];
            subEl.textContent = subs[sIndex];

            // Remove exit, add enter
            titleEl.classList.remove('text-slide-out');
            subEl.classList.remove('text-slide-out');

            titleEl.classList.add('text-slide-in');
            subEl.classList.add('text-slide-in');
        }, 500); // 500ms matches the CSS animation duration

    }, 3500);
}
window.initHeroRotation = initHeroRotation;

/**
 * Navigate to the how-to section inside the hero panel.
 * 
 * @function navigateToHow
 * @returns {void}
 */
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

/**
 * Updates step item labels and animations on scrolling down the how-to vertical panels.
 * 
 * @function handleSplitScroll
 * @returns {void}
 */
function handleSplitScroll() {
    // handle the how-to scroll effect
    const section = document.getElementById('how-content-area');
    if (!section) return;

    const stepItems = document.querySelectorAll('.step-item');
    const previewTitle = document.getElementById('preview-title');
    const previewDesc = document.getElementById('preview-desc');
    const isMobile = window.innerWidth <= 1024;

    const stepData = [
        { title: "REPORT", desc: "Submit a detailed report with optional imagery." },
        { title: "MATCH", desc: "Our algorithm scans existing inventory to find potential matches." },
        { title: "REUNITE", desc: "Verify ownership and arrange for item retrieval." }
    ];

    let currentStep = 0;
    let minDiff = Infinity;

    stepItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        let diff;

        if (isMobile) {
            // Check horizontal center on mobile
            const center = rect.left + (rect.width / 2);
            const target = window.innerWidth * 0.5;
            diff = Math.abs(center - target);
        } else {
            // Check vertical center on desktop
            const center = rect.top + (rect.height / 2);
            const target = window.innerHeight * 0.5;
            diff = Math.abs(center - target);
        }

        if (diff < minDiff) {
            minDiff = diff;
            currentStep = index;
        }
    });

    // Update Step Items Active state
    stepItems.forEach((item, index) => {
        if (index === currentStep) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update sticky preview on desktop ONLY
    if (!isMobile) {
        if (previewTitle && stepData[currentStep]) {
            if (previewTitle.dataset.current !== stepData[currentStep].title) {
                previewTitle.textContent = stepData[currentStep].title;
                previewDesc.textContent = stepData[currentStep].desc;
                previewTitle.dataset.current = stepData[currentStep].title;

                previewTitle.style.animation = 'none';
                void previewTitle.offsetWidth;
                previewTitle.style.animation = 'textFadeIn 0.5s ease forwards';

                previewDesc.style.animation = 'none';
                void previewDesc.offsetWidth;
                previewDesc.style.animation = 'textFadeIn 0.5s ease forwards 0.1s';
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

/**
 * Align buttons, profile headers, and admin options depending on active session state.
 * 
 * @function updateAuthUI
 * @returns {void}
 */
function updateAuthUI() {
    const mobileLoginBtn = document.getElementById('mbProfileBtn'); // The mobile bottom nav button
    const mbGreeting = document.getElementById('mbGreetingHeading');
    const desktopLoginLink = document.querySelector('.desktop-header a[href="login.html"], .desktop-header a[data-auth-link="true"]');

    if (window.currentUser) {
        if (mobileLoginBtn) {
            const lbl = mobileLoginBtn.querySelector('.mb-nav-label');
            if (lbl) lbl.textContent = window.currentUser.role === 'admin' ? 'ADMIN' : 'DASHBOARD';
            mobileLoginBtn.setAttribute('data-action', window.currentUser.role === 'admin' ? "navigateToSection('admin')" : "navigateToSection('dashboard')");
        }
        
        if (desktopLoginLink) {
            desktopLoginLink.setAttribute('data-auth-link', 'true');
            const lbl = desktopLoginLink.querySelector('.dock-label');
            if (lbl) lbl.textContent = window.currentUser.role === 'admin' ? 'ADMIN' : 'DASHBOARD';
            desktopLoginLink.setAttribute('data-action', window.currentUser.role === 'admin' ? "navigateToSection('admin')" : "navigateToSection('dashboard')");
            desktopLoginLink.removeAttribute('href');
            desktopLoginLink.removeAttribute('onclick');
        }

        if (mbGreeting) {
            const name = window.currentUser.full_name || window.currentUser.name || 'User';
            const firstName = name.trim().split(' ')[0];
            mbGreeting.innerHTML = `Hi ${firstName},<br>How can I help<br>you today?`;
        }
    } else {
        if (mobileLoginBtn) {
            const lbl = mobileLoginBtn.querySelector('.mb-nav-label');
            if (lbl) lbl.textContent = 'LOGIN';
            mobileLoginBtn.setAttribute('data-action', "window.location.href='login.html'");
        }
        
        if (desktopLoginLink) {
            desktopLoginLink.setAttribute('data-auth-link', 'true');
            const lbl = desktopLoginLink.querySelector('.dock-label');
            if (lbl) lbl.textContent = 'LOGIN';
            desktopLoginLink.setAttribute('href', 'login.html');
            desktopLoginLink.removeAttribute('data-action');
            desktopLoginLink.removeAttribute('onclick');
        }
        
        if (mbGreeting) {
            mbGreeting.innerHTML = `Hi guest,<br>How can I help<br>you today?`;
        }
    }
}
window.updateAuthUI = updateAuthUI;

/**
 * Wipe session cache variables and redirect viewport back to the hero section.
 * 
 * @function handleLogout
 * @returns {void}
 */
function handleLogout() {
    localStorage.removeItem("reunite_session");
    window.currentUser = null;
    if (window.updateAuthUI) window.updateAuthUI();
    if (window.navigateToSection) window.navigateToSection('hero');
}
window.handleLogout = handleLogout;

/**
 * Accessibility Settings Logic
 */
let fontScale = 100;

/**
 * Toggles settings overlay display.
 * Synchronizes options checkboxes on activation.
 * 
 * @function toggleSettingsModal
 * @returns {void}
 */
function toggleSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    const isVisible = !modal.classList.contains('hidden');
    if (isVisible) {
        modal.classList.add('hidden');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    } else {
        lastFocusedElement = document.activeElement;
        modal.classList.remove('hidden');
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) setTimeout(() => closeBtn.focus(), 50);

        // Sync toggles with current state
        document.getElementById('motionToggle').checked = document.body.classList.contains('reduced-motion');
        document.getElementById('contrastToggle').checked = document.body.classList.contains('high-contrast');
        document.getElementById('ttsToggle').checked = document.body.classList.contains('tts-enabled');
        document.getElementById('fontScaleDisplay').textContent = fontScale + '%';
    }
}
window.toggleSettingsModal = toggleSettingsModal;

/**
 * Adjust class listings and styling variables corresponding to toggled settings.
 * Saves preference modifications to local storage.
 * 
 * @function updateAccessibility
 * @param {String} type - Setting type ('motion'|'contrast'|'font'|'tts')
 * @param {String} [value] - Font scaling directions ('up'|'down')
 * @returns {void}
 */
function updateAccessibility(type, value) {
    const settings = JSON.parse(localStorage.getItem('reunite_accessibility') || '{}');

    if (type === 'motion') {
        const enabled = document.getElementById('motionToggle').checked;
        document.body.classList.toggle('reduced-motion', enabled);
        settings.reducedMotion = enabled;
    }
    else if (type === 'contrast') {
        const enabled = document.getElementById('contrastToggle').checked;
        document.body.classList.toggle('high-contrast', enabled);
        settings.highContrast = enabled;
    }
    else if (type === 'font') {
        if (value === 'up' && fontScale < 150) fontScale += 10;
        else if (value === 'down' && fontScale > 80) fontScale -= 10;

        document.documentElement.style.fontSize = (fontScale / 100 * 16) + 'px';
        document.getElementById('fontScaleDisplay').textContent = fontScale + '%';
        settings.fontScale = fontScale;
    }
    else if (type === 'tts') {
        const enabled = document.getElementById('ttsToggle').checked;
        document.body.classList.toggle('tts-enabled', enabled);
        settings.tts = enabled;
        if (enabled) {
            initTextToSpeech();
        } else {
            disableTextToSpeech();
        }
    }

    localStorage.setItem('reunite_accessibility', JSON.stringify(settings));
}
window.updateAccessibility = updateAccessibility;

/**
 * Read accessibility preferences from local storage and apply classes on launch.
 * 
 * @function loadAccessibilitySettings
 * @returns {void}
 */
function loadAccessibilitySettings() {
    const settings = JSON.parse(localStorage.getItem('reunite_accessibility') || '{}');

    if (settings.reducedMotion) {
        document.body.classList.add('reduced-motion');
    }
    if (settings.highContrast) {
        document.body.classList.add('high-contrast');
    }
    if (settings.fontScale) {
        fontScale = settings.fontScale;
        document.documentElement.style.fontSize = (fontScale / 100 * 16) + 'px';
    }
    if (settings.tts) {
        document.body.classList.add('tts-enabled');
        initTextToSpeech();
    }
}
window.loadAccessibilitySettings = loadAccessibilitySettings;

/**
 * Text to Speech Logic
 */
let ttsHoverTimeout = null;
let currentUtterance = null;

const TTS_SELECTOR = 'h1, h2, h3, h4, p, a, button, span, label, div.meta-tag, div.stat-label, div.stat-value, option, th, td';

/**
 * Text-to-speech speak subroutine that speaks the text content of the target element.
 * Cancels active utterances to avoid overlaps.
 * 
 * @private
 * @param {HTMLElement} target - Target element to read
 * @returns {void}
 */
function speakTarget(target) {
    if (!document.body.classList.contains('tts-enabled')) return;
    if (!target || typeof target.matches !== 'function' || !target.matches(TTS_SELECTOR)) return;

    const text = target.innerText || target.textContent;
    if (!text || text.trim().length === 0) return;

    clearTimeout(ttsHoverTimeout);
    ttsHoverTimeout = setTimeout(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            currentUtterance = new SpeechSynthesisUtterance(text.trim());
            window.speechSynthesis.speak(currentUtterance);
        }
    }, 400);
}

/**
 * Pointer hover event handler for text-to-speech.
 * 
 * @private
 * @param {Event} e - Mouseover event
 * @returns {void}
 */
function handleTTSHover(e) { speakTarget(e.target); }

/**
 * Keyboard focus event handler for text-to-speech.
 * 
 * @private
 * @param {Event} e - Focusin event
 * @returns {void}
 */
function handleTTSFocus(e) { speakTarget(e.target); }

/**
 * Event handler for mouseout / focusout to cancel pending speak requests.
 * 
 * @private
 * @returns {void}
 */
function handleTTSLeave() {
    if (!document.body.classList.contains('tts-enabled')) return;
    clearTimeout(ttsHoverTimeout);
}

/**
 * Hook keyboard focus and pointer hover listeners to power text-to-speech reading.
 * 
 * @private
 * @returns {void}
 */
function initTextToSpeech() {
    if (!('speechSynthesis' in window)) {
        console.warn("Speech Synthesis NOT supported in this browser.");
        return;
    }
    document.removeEventListener('mouseover', handleTTSHover);
    document.removeEventListener('mouseout', handleTTSLeave);
    document.removeEventListener('focusin', handleTTSFocus);
    document.removeEventListener('focusout', handleTTSLeave);
    document.addEventListener('mouseover', handleTTSHover);
    document.addEventListener('mouseout', handleTTSLeave);
    document.addEventListener('focusin', handleTTSFocus);
    document.addEventListener('focusout', handleTTSLeave);
}

/**
 * Unbind listeners and cancel active text-to-speech playback.
 * 
 * @private
 * @returns {void}
 */
function disableTextToSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    document.removeEventListener('mouseover', handleTTSHover);
    document.removeEventListener('mouseout', handleTTSLeave);
    document.removeEventListener('focusin', handleTTSFocus);
    document.removeEventListener('focusout', handleTTSLeave);
}

/**
 * Switch the active dashboard view tab (Mobile/Tablet Segmented Nav).
 * Controls the visibility of bento card groups inside student and admin dashboards.
 * 
 * @function switchDashboardTab
 * @param {String} dashboardType - The dashboard view type ('student' or 'admin')
 * @param {String} tabName - The target tab pane to display
 * @returns {void}
 */
function switchDashboardTab(dashboardType, tabName) {
    const navId = dashboardType === 'student' ? 'studentTabsNav' : 'adminTabsNav';
    const navEl = document.getElementById(navId);
    if (!navEl) return;

    // Toggle active state on buttons
    const buttons = navEl.querySelectorAll('.tab-nav-item');
    buttons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${tabName}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Show/hide bento cards
    const cards = document.querySelectorAll(`[data-tab-group="${dashboardType}"]`);
    cards.forEach(card => {
        const name = card.getAttribute('data-tab-name');
        if (name === tabName) {
            card.classList.remove('tab-hidden');
        } else {
            card.classList.add('tab-hidden');
        }
    });
}
window.switchDashboardTab = switchDashboardTab;


