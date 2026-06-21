// js/3d-scroll.js
document.addEventListener("DOMContentLoaded", () => {
    // Only run if GSAP and ScrollTrigger are loaded and the container exists
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn("GSAP or ScrollTrigger not loaded");
        return;
    }
    
    const container = document.querySelector('.gsap-3d-container');
    if (!container) return;

    gsap.registerPlugin(ScrollTrigger);

    const steps = gsap.utils.toArray('.gsap-step');
    const phone = document.querySelector('.phone-3d');
    const layers = document.querySelectorAll('.phone-content-layer');
    const matchGraphic = document.querySelector('.graphic-match');

    // Create a timeline that is scrubbed with the scroll of the container
    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#how-content-area",
            start: "top top",
            end: "bottom bottom",
            scrub: 1, // smooth scrubbing
        }
    });

    // Step 1 to Step 2 transition
    tl.to(phone, {
        rotateY: 180, // Flip around
        rotateX: 5,
        z: -100, // pull back slightly
        ease: "none"
    }, 0);

    // Step 2 to Step 3 transition
    tl.to(phone, {
        rotateY: 360, // Flip back around to front
        rotateX: -10,
        z: 0,
        scale: 1.1, // Slight pop
        ease: "none"
    }, 1);

    // We can also spin the match graphic continuously or scrub it
    gsap.to(matchGraphic, {
        rotation: 360,
        repeat: -1,
        ease: "linear",
        duration: 4
    });

    // Set up ScrollTriggers for each text step to highlight them and swap phone content
    steps.forEach((step, i) => {
        ScrollTrigger.create({
            trigger: step,
            start: "top center",
            end: "bottom center",
            onEnter: () => activateStep(i),
            onEnterBack: () => activateStep(i),
        });
    });

    function activateStep(index) {
        // Highlight active text
        steps.forEach((step, i) => {
            step.classList.toggle('active', i === index);
        });

        // Show active phone layer
        layers.forEach((layer, i) => {
            layer.classList.toggle('active', i === index);
        });
    }

    // Initialize first step
    activateStep(0);
});
