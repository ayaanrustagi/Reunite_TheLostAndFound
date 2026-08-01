
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


/**
 * Shows the global loading overlay spinner with a custom message.
 * Increments the global loading counter to handle nested async operations.
 * 
 * @function showLoading
 * @param {string} [message="Processing request..."] - The message to display on the loading overlay.
 * @returns {void}
 */
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

/**
 * Decrements the global loading counter and hides the global loading overlay spinner
 * once all pending async operations have completed (loading counter reaches 0).
 * Skips hiding if the overlay is currently showing a success state.
 * 
 * @function hideLoading
 * @returns {void}
 */
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

/**
 * Displays a success message state on the loading overlay, automatically
 * hiding it after a 2-second timeout and resetting the loading counter.
 * 
 * @function showSuccess
 * @param {string} [message="SUCCESSFUL"] - The success message to display.
 * @returns {void}
 */
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

/**
 * Displays an error message state on the loading overlay, automatically
 * hiding it after a 3-second timeout and resetting the loading counter.
 * 
 * @function showError
 * @param {string} [message="Something went wrong"] - The error message to display.
 * @returns {void}
 */
function showError(message = "Something went wrong") {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    if (!overlay || !messageEl) { console.error(message); return; }

    overlay.classList.add('error-state');
    messageEl.textContent = message.toUpperCase();
    overlay.classList.remove('hidden');

    setTimeout(() => {
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.classList.remove('error-state');
            window.loadingCounter = 0;
        }, 500);
    }, 3000);
}
window.showError = showError;

/**
 * Updates a status text element with a given message and adds success or error styles.
 * If message is empty, clears the text and styles.
 * 
 * @function setStatusMessage
 * @param {string} elementId - The ID of the HTML status element.
 * @param {string} message - The message content.
 * @param {boolean} [isError=false] - Whether to style the message as an error.
 * @returns {void}
 */
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

/**
 * Sets the validation visual and accessibility state for a form input field.
 * Adds or removes 'invalid' classes, ARIA validation attributes, and inline error messages.
 * 
 * @function setFieldState
 * @param {string} fieldId - The ID of the input field.
 * @param {boolean} isValid - Whether the field input is currently valid.
 * @param {string} [message=""] - The validation error message to display if invalid.
 * @returns {boolean} The validity state passed in (`isValid`).
 */
function setFieldState(fieldId, isValid, message = "") {
    const field = document.getElementById(fieldId);
    if (!field) return isValid;
    const group = field.closest('.input-group');
    if (!group) return isValid;
    let errorEl = document.getElementById(`${fieldId}Error`);
    if (!errorEl && !isValid) {
        errorEl = document.createElement('span');
        errorEl.id = `${fieldId}Error`;
        errorEl.className = 'error-text';
        group.appendChild(errorEl);
    }
    if (!isValid) {
        group.classList.add('invalid');
        field.setAttribute('aria-invalid', 'true');
        if (errorEl) {
            errorEl.textContent = message;
            field.setAttribute('aria-describedby', errorEl.id);
        }
    } else {
        group.classList.remove('invalid');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
        if (errorEl) errorEl.textContent = "";
    }
    return isValid;
}
window.setFieldState = setFieldState;

/**
 * Attaches real-time validation event listeners to required input, select, and textarea fields.
 * Clears field error states on user input.
 * 
 * @function attachRealtimeValidation
 * @returns {void}
 */
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

/**
 * Resets all validation styles and error texts inside the specified form element.
 * 
 * @function resetFormValidation
 * @param {HTMLFormElement} formEl - The form element to reset.
 * @returns {void}
 */
function resetFormValidation(formEl) {
    if (!formEl) return;
    formEl.querySelectorAll('.input-group').forEach(group => {
        group.classList.remove('invalid');
        const errorEl = group.querySelector('.input-error');
        if (errorEl) errorEl.textContent = "";
    });
}
window.resetFormValidation = resetFormValidation;




/**
 * Computes the Levenshtein (edit) distance between two strings.
 * The edit distance is the minimum number of single-character insertions,
 * deletions, or substitutions required to transform string `a` into string `b`.
 * Uses a standard dynamic-programming matrix approach.
 *
 * @param {string} a - The source string.
 * @param {string} b - The target string.
 * @returns {number} The minimum edit distance between `a` and `b`.
 */
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

/**
 * Determines whether `searchToken` fuzzy-matches anywhere inside `text`.
 * First checks for an exact substring match; if none is found, splits the
 * text into words and allows up to 1 typo for short tokens (≤5 chars) or
 * 2 typos for longer tokens, measured by Levenshtein distance.
 *
 * @param {string} text        - The haystack string to search within.
 * @param {string} searchToken - The needle token to look for.
 * @returns {boolean} `true` if a fuzzy match is found, `false` otherwise.
 */
function isFuzzyMatch(text, searchToken) {
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




/**
 * Computes a perceptual difference-hash (D-hash) of an image.
 *
 * The algorithm works in four stages:
 *   1. **Anti-alias downscale** – the image is first drawn to an intermediate
 *      canvas (4× the final hash dimension) with high-quality smoothing to
 *      act as a natural blur / anti-alias filter.
 *   2. **Final downscale** – the intermediate canvas is redrawn to
 *      `(size+1) × size` so each row has one extra pixel for comparison.
 *   3. **Grayscale conversion** – every pixel is converted to luminance
 *      using the BT.601 weights (0.299 R + 0.587 G + 0.114 B).
 *   4. **Hash generation** – for each row the algorithm compares each pixel
 *      with its right neighbour; if left > right the bit is `1`, else `0`.
 *
 * The resulting binary string has `size × size` bits (default 64 bits for
 * an 8×8 hash). Two hashes can be compared with {@link hammingDistance}.
 *
 * @param {HTMLImageElement} imgElement - A loaded `<img>` element.
 * @param {number}           [size=8]  - Hash grid dimension (produces a
 *                                        `size²`-bit hash).
 * @returns {Promise<string|null>} A binary string hash, or `null` on failure.
 */
function computeDHash(imgElement, size = 8) {
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

/**
 * Extracts the dominant (average) colour from the centre of an image.
 *
 * Samples the inner 70 % of the image onto an 8×8 canvas, then averages
 * all pixel colours after filtering out extreme darks/brights that tend
 * to skew results (e.g. black borders or white highlights).
 *
 * @param {HTMLImageElement} imgElement - A loaded `<img>` element.
 * @returns {Promise<{r: number, g: number, b: number}|null>}
 *   An RGB colour object, or `null` on failure.
 */
function getDominantColor(imgElement) {
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

/**
 * Scores the perceptual similarity of two RGB colours on a 0–100 scale.
 *
 * Uses a weighted Euclidean distance (green > blue > red) to approximate
 * human colour perception. Returns 100 for identical colours and 0 for
 * maximally different colours. If either input is `null`, returns a
 * neutral score of 50 so missing data doesn't inflate confidence.
 *
 * @param {{r: number, g: number, b: number}|null} c1 - First colour.
 * @param {{r: number, g: number, b: number}|null} c2 - Second colour.
 * @returns {number} Similarity score from 0 (opposite) to 100 (identical).
 */
function colorMatchScore(c1, c2) {
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

/**
 * Computes the Hamming distance between two equal-length binary hash strings.
 *
 * The Hamming distance counts the number of positions at which the
 * corresponding bits differ. A distance of 0 means the hashes are
 * identical; for 64-bit D-hashes, distances ≤ 10 generally indicate
 * perceptually similar images.
 *
 * @param {string|null} h1 - First binary hash string.
 * @param {string|null} h2 - Second binary hash string.
 * @returns {number} Number of differing bits (0 = identical). Returns
 *                   256 if either hash is missing.
 */
function hammingDistance(h1, h2) {
    if (!h1 || !h2) return 256;
    let dist = 0;
    for (let i = 0; i < h1.length; i++) {
        if (h1[i] !== h2[i]) dist++;
    }
    return dist;
}
window.hammingDistance = hammingDistance;
   