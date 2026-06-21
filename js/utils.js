
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showLoading(message = "Processing request...") {
    // show the spinner
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
    // kill the spinner
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    window.loadingCounter = Math.max(0, window.loadingCounter - 1);

    // If we're in success state, don't hide yet - showSuccess handles it
    if (overlay.classList.contains('success-state')) return;

    if (window.loadingCounter === 0) {
        overlay.classList.add('hidden');
    }
}
window.hideLoading = hideLoading;

function showSuccess(message = "SUCCESSFUL") {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    if (!overlay || !messageEl) return;

    overlay.classList.add('success-state');
    messageEl.textContent = message.toUpperCase();
    overlay.classList.remove('hidden');

    // Auto-hide after 2 seconds
    setTimeout(() => {
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.classList.remove('success-state');
            window.loadingCounter = 0; // Reset counter after success flow
        }, 500);
    }, 2000);
}
window.showSuccess = showSuccess;

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


function levenshteinDistance(a, b) {
    // check how many typos
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
                    matrix[i - 1][j - 1] + 1,
                    Math.min(
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
}
window.levenshteinDistance = levenshteinDistance;

function isFuzzyMatch(text, searchToken) {
    // search with some wiggle room
    if (!text || !searchToken) return false;
    const cleanText = text.toLowerCase();
    const token = searchToken.toLowerCase();


    if (cleanText.includes(token)) return true;


    const words = cleanText.split(/\s+/);
    return words.some(word => {

        if (Math.abs(word.length - token.length) > 2) return false;


        const maxErrors = token.length > 5 ? 2 : 1;
        const dist = levenshteinDistance(word, token);
        return dist <= maxErrors;
    });
}
window.isFuzzyMatch = isFuzzyMatch;




function computeDHash(imgElement, size = 8) {
    // Perceptual image fingerprint using difference hashing
    // Two-step downscale acts as a natural blur/anti-alias filter
    return new Promise((resolve) => {
        const process = () => {
            try {
                // Step 1: Scale to intermediate size for anti-aliasing
                const midSize = (size + 1) * 4;
                const midCanvas = document.createElement('canvas');
                const midCtx = midCanvas.getContext('2d');
                midCanvas.width = midSize;
                midCanvas.height = midSize;
                midCtx.imageSmoothingEnabled = true;
                midCtx.imageSmoothingQuality = 'high';
                midCtx.drawImage(imgElement, 0, 0, midSize, midSize);

                // Step 2: Scale down to final hash dimensions
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = size + 1;
                canvas.height = size;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(midCanvas, 0, 0, size + 1, size);

                const imgData = ctx.getImageData(0, 0, size + 1, size).data;

                // Convert to grayscale using luminance weights
                const grays = [];
                for (let i = 0; i < imgData.length; i += 4) {
                    grays.push(imgData[i] * 0.299 + imgData[i + 1] * 0.587 + imgData[i + 2] * 0.114);
                }

                // Build hash by comparing adjacent horizontal pixels
                let hash = "";
                for (let y = 0; y < size; y++) {
                    for (let x = 0; x < size; x++) {
                        const left = grays[y * (size + 1) + x];
                        const right = grays[y * (size + 1) + x + 1];
                        hash += left > right ? "1" : "0";
                    }
                }
                resolve(hash);
            } catch (e) {
                console.warn("dHash computation failed:", e);
                resolve(null);
            }
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
    // Sample an 8x8 grid from the center of the image for robust color
    return new Promise((resolve) => {
        setTimeout(() => {
            try {
                const w = imgElement.naturalWidth || imgElement.width;
                const h = imgElement.naturalHeight || imgElement.height;

                if (w <= 0 || h <= 0) {
                    resolve(null);
                    return;
                }

                const sampleSize = 8;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = sampleSize;
                canvas.height = sampleSize;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Sample center 70% of the image to skip borders/edges
                const margin = 0.15;
                ctx.drawImage(
                    imgElement,
                    w * margin, h * margin,
                    w * (1 - 2 * margin), h * (1 - 2 * margin),
                    0, 0, sampleSize, sampleSize
                );

                const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
                const pixels = [];

                for (let i = 0; i < data.length; i += 4) {
                    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
                }

                // Filter out extreme dark/bright pixels that skew averages
                const filtered = pixels.filter(p => {
                    const lum = p.r * 0.299 + p.g * 0.587 + p.b * 0.114;
                    return lum > 15 && lum < 240;
                });

                const source = filtered.length > 10 ? filtered : pixels;

                // Compute average color across all sampled pixels
                const sum = source.reduce((acc, p) => {
                    acc.r += p.r; acc.g += p.g; acc.b += p.b;
                    return acc;
                }, { r: 0, g: 0, b: 0 });

                const n = source.length;
                resolve({
                    r: Math.round(sum.r / n),
                    g: Math.round(sum.g / n),
                    b: Math.round(sum.b / n)
                });
            } catch (e) {
                console.warn("Color extraction failed:", e);
                resolve(null);
            }
        }, 10);
    });
}
window.getDominantColor = getDominantColor;

function colorMatchScore(c1, c2) {
    // Neutral score if either color is missing — don't inflate confidence
    if (!c1 || !c2) return 50;

    // Perceptually-weighted Euclidean distance (green > red > blue)
    const dist = Math.sqrt(
        2 * Math.pow(c1.r - c2.r, 2) +
        4 * Math.pow(c1.g - c2.g, 2) +
        3 * Math.pow(c1.b - c2.b, 2)
    );

    // Max weighted distance = sqrt(2*255^2 + 4*255^2 + 3*255^2) ≈ 764.8
    const maxDist = 764.8;
    return Math.max(0, Math.round(100 - (dist / maxDist) * 100));
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
 