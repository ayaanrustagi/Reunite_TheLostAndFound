
import { createNoise2D } from './simplex-noise.js';

class Waves {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            strokeColor: options.strokeColor || '#004ecc',
            backgroundColor: options.backgroundColor || '#ffffff',
            pointerSize: options.pointerSize || 0.5,
            ...options
        };

        this.svg = null;
        this.paths = [];
        this.lines = [];
        this.noise = createNoise2D();
        this.rafId = null;
        this.bounding = null;

        this.mouse = {
            x: -10,
            y: 0,
            lx: 0,
            ly: 0,
            sx: 0,
            sy: 0,
            v: 0,
            vs: 0,
            a: 0,
            set: false,
        };

        this.init();
    }

    init() {
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.classList.add('js-svg');
        this.svg.style.display = 'block';
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        this.container.appendChild(this.svg);

        // Apply styles to container
        this.container.style.backgroundColor = this.options.backgroundColor;
        this.container.style.position = 'fixed'; // Fixed to be a background
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '-1'; // Behind everything
        this.container.style.overflow = 'hidden';
        this.container.style.setProperty('--x', '-0.5rem');
        this.container.style.setProperty('--y', '50%');

        // Create a white fog overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: 0.011;
            pointer-events: none;
            z-index: 1;
        `;
        this.container.appendChild(overlay);

        // Ensure SVG is behind overlay or overlay is on top
        this.svg.style.position = 'relative';
        this.svg.style.zIndex = '0';

        // Pointer follower removed

        this.setSize();
        this.setLines();

        this.bindEvents();
        this.tick(0);
    }

    bindEvents() {
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    }

    setSize() {
        this.bounding = this.container.getBoundingClientRect();
        // SVG size is handled by CSS width/height 100%, but we utilize bounding for logic
    }

    setLines() {
        const checkRect = this.container.getBoundingClientRect();
        // If container is hidden or 0 size, we might skip, but for fixed background it should be fine.
        const { width, height } = checkRect;
        this.lines = [];

        // Clear existing paths
        this.paths.forEach(path => path.remove());
        this.paths = [];

        const xGap = 15; // Slightly larger gap for performance in vanilla JS maybe? Or keep 8.
        const yGap = 15;
        // User React code had xGap=8, yGap=8. Let's stick to relatively dense but performant.
        // Let's go with 12 to be safe on performance for full screen.

        const oWidth = width + 200;
        const oHeight = height + 30;

        const totalLines = Math.ceil(oWidth / xGap);
        const totalPoints = Math.ceil(oHeight / yGap);

        const xStart = (width - xGap * totalLines) / 2;
        const yStart = (height - yGap * totalPoints) / 2;

        for (let i = 0; i < totalLines; i++) {
            const points = [];
            for (let j = 0; j < totalPoints; j++) {
                points.push({
                    x: xStart + xGap * i,
                    y: yStart + yGap * j,
                    wave: { x: 0, y: 0 },
                    cursor: { x: 0, y: 0, vx: 0, vy: 0 },
                });
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', this.options.strokeColor);
            path.setAttribute('stroke-width', '3.5');
            path.setAttribute('stroke-opacity', '0.05'); // Slightly reduced for subtleness

            this.svg.appendChild(path);
            this.paths.push(path);
            this.lines.push(points);
        }
    }

    onResize() {
        this.setSize();
        this.setLines();
    }

    onMouseMove(e) {
        this.updateMousePosition(e.clientX, e.clientY);
    }

    onTouchMove(e) {
        e.preventDefault(); // careful with this on full page
        const touch = e.touches[0];
        this.updateMousePosition(touch.clientX, touch.clientY);
    }

    updateMousePosition(x, y) {
        // For logic, we need relative to container, but for fixed background container at 0,0, clientX is fine.
        // Use clientX/Y since container is fixed to viewport.

        // However, if we scroll, the waves stay fixed (background). 
        // The React code used: y - bounding.top + window.scrollY.
        // For a fixed background: bounding.top is 0 always. window.scrollY is relevant if we want the mouse interaction to map to the points on the screen.

        // Actually, for fixed background, the points are fixed on screen. clientX/Y maps directly to the screen pixels.
        // The points (x, y) are generated based on container size (viewport).
        // So clientX/Y should be correct without scroll adjustment if the container is position: fixed.

        this.mouse.x = x;
        this.mouse.y = y;

        if (!this.mouse.set) {
            this.mouse.sx = this.mouse.x;
            this.mouse.sy = this.mouse.y;
            this.mouse.lx = this.mouse.x;
            this.mouse.ly = this.mouse.y;
            this.mouse.set = true;
        }
    }

    movePoints(time) {
        const lines = this.lines;
        const mouse = this.mouse;
        const noise = this.noise;

        lines.forEach((points) => {
            points.forEach((p) => {
                const move = noise(
                    (p.x + time * 0.008) * 0.003,
                    (p.y + time * 0.003) * 0.002
                ) * 8; // Amplitude

                p.wave.x = Math.cos(move) * 12;
                p.wave.y = Math.sin(move) * 6;

                const dx = p.x - mouse.sx;
                const dy = p.y - mouse.sy;
                const d = Math.hypot(dx, dy);
                const l = Math.max(175, mouse.vs);

                if (d < l) {
                    const s = 1 - d / l;
                    const f = Math.cos(d * 0.001) * s;
                    p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035;
                    p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035;
                }

                p.cursor.vx += (0 - p.cursor.x) * 0.01;
                p.cursor.vy += (0 - p.cursor.y) * 0.01;

                p.cursor.vx *= 0.95;
                p.cursor.vy *= 0.95;

                p.cursor.x += p.cursor.vx;
                p.cursor.y += p.cursor.vy;

                p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x));
                p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y));
            });
        });
    }

    moved(point, withCursorForce = true) {
        return {
            x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
            y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
        };
    }

    drawLines() {
        this.lines.forEach((points, lIndex) => {
            if (points.length < 2 || !this.paths[lIndex]) return;

            const firstPoint = this.moved(points[0], false);
            let d = `M ${firstPoint.x} ${firstPoint.y}`;

            for (let i = 1; i < points.length; i++) {
                const current = this.moved(points[i]);
                // Optimization: Round to 1 decimal place to reduce DOM string size? 
                // Maybe not needed for now.
                d += ` L ${current.x} ${current.y}`;
            }

            this.paths[lIndex].setAttribute('d', d);
        });
    }

    tick(time) {
        // Smooth mouse
        this.mouse.sx += (this.mouse.x - this.mouse.sx) * 0.1;
        this.mouse.sy += (this.mouse.y - this.mouse.sy) * 0.1;

        const dx = this.mouse.x - this.mouse.lx;
        const dy = this.mouse.y - this.mouse.ly;
        const d = Math.hypot(dx, dy);

        this.mouse.v = d;
        this.mouse.vs += (d - this.mouse.vs) * 0.1;
        this.mouse.vs = Math.min(100, this.mouse.vs);

        this.mouse.lx = this.mouse.x;
        this.mouse.ly = this.mouse.y;

        this.mouse.a = Math.atan2(dy, dx);

        this.container.style.setProperty('--x', `${this.mouse.sx}px`);
        this.container.style.setProperty('--y', `${this.mouse.sy}px`);

        this.movePoints(time);
        this.drawLines();

        this.rafId = requestAnimationFrame(this.tick.bind(this));
    }
}

// Auto-initialize if the container exists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('waves-container');
    if (container) {
        new Waves(container, {
            strokeColor: '#004ecc', // Blue lines
            backgroundColor: '#ffffff' // White background
        });
    }
});
