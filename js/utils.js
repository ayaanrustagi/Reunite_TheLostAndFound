
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showLoading(message = "Processing request...") {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    const messageEl = document.getElementById('loadingMessage');
    if (messageEl && message) {
        messageEl.textContent = message;
    }
    window.loadingCounter += 1;
    overlay.classList.remove('hidden');
}
window.showLoading = showLoading;

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    window.loadingCounter = Math.max(0, window.loadingCounter - 1);
    if (window.loadingCounter === 0) {
        overlay.classList.add('hidden');
    }
}
window.hideLoading = hideLoading;

function setStatusMessage(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove('error', 'success');
    if (message) {
        el.classList.add(isError ? 'error' : 'success');
    }
}
window.setStatusMessage = setStatusMessage;

function setFieldState(fieldId, isValid, message = "") {
    const field = document.getElementById(fieldId);
    if (!field) return isValid;
    const group = field.closest('.input-group');
    if (!group) return isValid;
    const errorEl = document.getElementById(`${fieldId}Error`);
    if (!isValid) {
        group.classList.add('invalid');
        if (errorEl) errorEl.textContent = message;
    } else {
        group.classList.remove('invalid');
        if (errorEl) errorEl.textContent = "";
    }
    return isValid;
}
window.setFieldState = setFieldState;

function attachRealtimeValidation() {
    const requiredFields = document.querySelectorAll('.input-group.required input, .input-group.required select, .input-group.required textarea');
    requiredFields.forEach(field => {
        field.addEventListener('input', () => {
            if (field.id) {
                setFieldState(field.id, true);
            }
        });
    });
}
window.attachRealtimeValidation = attachRealtimeValidation;

function resetFormValidation(formEl) {
    if (!formEl) return;
    formEl.querySelectorAll('.input-group').forEach(group => {
        group.classList.remove('invalid');
        const errorEl = group.querySelector('.input-error');
        if (errorEl) errorEl.textContent = "";
    });
}
window.resetFormValidation = resetFormValidation;

// Levenshtein function for fuzzy search
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
}
window.levenshteinDistance = levenshteinDistance;

function isFuzzyMatch(text, searchToken) {
    if (!text || !searchToken) return false;
    const cleanText = text.toLowerCase();
    const token = searchToken.toLowerCase();

    // Direct match is always best
    if (cleanText.includes(token)) return true;

    // Check word by word for close matches
    const words = cleanText.split(/\s+/);
    return words.some(word => {
        // Optimization: length difference check
        if (Math.abs(word.length - token.length) > 2) return false;

        // Allow more errors for longer words
        const maxErrors = token.length > 5 ? 2 : 1;
        const dist = levenshteinDistance(word, token);
        return dist <= maxErrors;
    });
}
window.isFuzzyMatch = isFuzzyMatch;

// ------------------------------
// dHash (Perceptual Hashing)
// ------------------------------
function computeDHash(imgElement, size = 16) {
    return new Promise((resolve) => {
        const process = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size + 1;
            canvas.height = size;

            ctx.drawImage(imgElement, 0, 0, size + 1, size);
            const imgData = ctx.getImageData(0, 0, size + 1, size).data;

            const grays = [];
            for (let i = 0; i < imgData.length; i += 4) {
                grays.push(imgData[i] * 0.299 + imgData[i + 1] * 0.587 + imgData[i + 2] * 0.114);
            }

            let hash = "";
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const left = grays[y * (size + 1) + x];
                    const right = grays[y * (size + 1) + x + 1];
                    hash += left > right ? "1" : "0";
                }
            }
            resolve(hash);
        };

        if (imgElement.complete && imgElement.naturalWidth !== 0) {
            process();
        } else {
            imgElement.onload = process;
        }
    });
}
window.computeDHash = computeDHash;

function getDominantColor(imgElement) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1; // Downsample to single pixel for average
        canvas.height = 1;

        // Use a slight timeout to ensure image is ready
        setTimeout(() => {
            try {
                // Focus on the center 50% of the image to avoid background noise
                const w = imgElement.naturalWidth || imgElement.width;
                const h = imgElement.naturalHeight || imgElement.height;

                if (w > 0 && h > 0) {
                    ctx.drawImage(imgElement, w * 0.25, h * 0.25, w * 0.5, h * 0.5, 0, 0, 1, 1);
                } else {
                    ctx.drawImage(imgElement, 0, 0, 1, 1);
                }

                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                resolve({ r, g, b });
            } catch (e) {
                console.warn("Color extraction failed:", e);
                resolve(null);
            }
        }, 10);
    });
}
window.getDominantColor = getDominantColor;

function colorMatchScore(c1, c2) {
    if (!c1 || !c2) return 100; // Ignore if missing
    // Euclidean distance in RGB space
    const dist = Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
    // Max distance is sqrt(3 * 255^2) ≈ 441
    // Normalize to 0-100 score (lower distance = higher score)
    return Math.max(0, 100 - (dist / 4.41));
}
window.colorMatchScore = colorMatchScore;

function hammingDistance(h1, h2) {
    if (!h1 || !h2) return 256;
    let dist = 0;
    for (let i = 0; i < h1.length; i++) {
        if (h1[i] !== h2[i]) dist++;
    }
    return dist;
}
window.hammingDistance = hammingDistance;
