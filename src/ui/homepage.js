/* homepage.js — homepage hero: 3D scroll experience with step reveals */
(function () {
  'use strict';

  var SH_STEPS = [
    { k: '01 · REPORT',      t: 'Snap what you found',       c: 'var(--c-blue)',
      d: 'Snap a photo of the item you found. Reunite creates a secure visual signature directly on your device.' },
    { k: '02 · FINGERPRINT', t: 'Hashed on your device',     c: 'var(--c-blue)',
      d: 'Your fingerprint is matched against every lost report and your actual photo never leaves your phone.' },
    { k: '03 · MATCH',       t: 'The owner gets a nudge',     c: 'var(--c-blue)',
      d: 'When a potential match is found, both parties are instantly notified. Your contact information remains completely private until you choose to share it.' },
    { k: '04 · UNLOCK',      t: 'Unlock the reunion',         c: 'var(--c-blue)',
      d: 'Confirm a few details to claim your item, then grab a pickup code to get it back.' },
  ];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function initHero() {
    var wrap   = document.getElementById('sh-wrapper');
    var canvas = document.getElementById('sh-canvas');
    if (!wrap || !canvas || !window.THREE) return;

    var THREE = window.THREE;
    var stage      = document.getElementById('sh-stage');
    var introEl    = document.getElementById('sh-intro');
    var ghostEl    = document.getElementById('sh-ghostnum');
    var stepsEl    = document.getElementById('sh-steps');
    var railEl     = document.getElementById('sh-rail');
    var counterEl  = document.getElementById('sh-counter');
    var ctaEl      = document.getElementById('sh-cta');

    /* ---- renderer ---- */
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (THREE.sRGBEncoding)           renderer.outputEncoding   = THREE.sRGBEncoding;
    if (THREE.ACESFilmicToneMapping)  { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; }

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.2, 14.5);

    /* ---- materials (matte blue-grey, palette-matched) ---- */
    var gold   = new THREE.MeshStandardMaterial({ color: 0x7C8AA0, metalness: 0.32, roughness: 0.72 });
    var accent = new THREE.MeshStandardMaterial({ color: 0x2563EB, emissive: 0x1D4ED8, emissiveIntensity: 0.25, metalness: 0.30, roughness: 0.65 });

    /* ---- key geometry ---- */
    var key = new THREE.Group();

    var bow = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.27, 28, 64), gold);
    bow.position.y = 2.0;
    key.add(bow);

    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 20, 48), accent);
    ring.position.y = 2.0;
    key.add(ring);

    var collar = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.42, 36), gold);
    collar.position.y = 1.15;
    key.add(collar);

    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 3.0, 36), gold);
    shaft.position.y = -0.35;
    key.add(shaft);

    var blade = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.5, 0.12), gold);
    blade.position.set(0.28, -1.55, 0);
    key.add(blade);

    var toothGeo = new THREE.BoxGeometry(0.28, 0.2, 0.12);
    [[-1.05], [-1.55], [-2.05]].forEach(function (yArr, i) {
      var tooth = new THREE.Mesh(toothGeo, gold);
      tooth.position.set(0.6, yArr[0], 0);
      tooth.scale.x = i === 1 ? 1.25 : 1;
      key.add(tooth);
    });

    key.scale.setScalar(1.02);
    key.rotation.x = -0.12;
    scene.add(key);

    /* ---- lights (cool studio so the matte blue-grey reads true) ---- */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1f2a, 0.65));
    var dir = new THREE.DirectionalLight(0xeef2ff, 1.10);
    dir.position.set(3, 5, 4);
    scene.add(dir);
    var pBlue  = new THREE.PointLight(0x2563eb, 0.85, 40); pBlue.position.set(-4,  1,  3); scene.add(pBlue);
    var pWhite = new THREE.PointLight(0xffffff, 0.55, 40); pWhite.position.set( 4, -2,  2); scene.add(pWhite);
    var pSteel = new THREE.PointLight(0x9aa7b8, 0.50, 40); pSteel.position.set( 2,  3, -3); scene.add(pSteel);

    /* ---- resize ----
       Size to the canvas's own box (not the stage). On desktop the canvas is
       inset:0 over the 100vh stage so this is identical; on mobile the canvas
       gets its own fixed height (see homepage.css) and must not inherit the
       tall stacked stage height, which would distort the aspect ratio. */
    function resize() {
      var w = canvas.clientWidth || stage.clientWidth;
      var h = canvas.clientHeight || stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);
    // Re-measure shortly after layout settles (fonts / mobile address bar).
    setTimeout(resize, 200);

    /* ---- scroll tick ---- */
    var clock   = new THREE.Clock();
    var curX    = 0, lastIdx = -2, facingTarget = 0;
    var mobileStep = 0, mobileStepStart = -1, mobileKeyTarget = 0;
    var raf;   // animation-frame handle (was an undeclared global → strict-mode ReferenceError)

    function checkReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduced-motion');
    }

    var isPaused = checkReducedMotion();

    function updateLoopState() {
      var shouldPause = checkReducedMotion();
      if (shouldPause) {
        if (!isPaused) {
          isPaused = true;
          if (raf) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        }
      } else {
        if (isPaused) {
          isPaused = false;
          raf = requestAnimationFrame(tick);
        }
      }
    }

    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    try {
      motionQuery.addEventListener('change', updateLoopState);
    } catch (e) {
      motionQuery.addListener(updateLoopState);
    }

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === 'class') {
          updateLoopState();
        }
      });
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    var stepEls = stepsEl ? Array.from(stepsEl.children) : [];
    var dotEls  = railEl  ? Array.from(railEl.children)  : [];

    // Mobile: prime step 0 as active before the first rAF fires
    if (window.innerWidth <= 1024) {
      stepEls.forEach(function (el, i) { el.classList.toggle('active', i === 0); });
      dotEls.forEach(function (el, i)  { el.classList.toggle('on',     i === 0); });
      if (ghostEl) {
        ghostEl.innerHTML = '<span class="sh-gn-a">0</span><span class="sh-gn-b">1</span>';
        ghostEl.style.opacity = '0.12';
      }
      if (counterEl) {
        counterEl.textContent = '01 / 0' + SH_STEPS.length;
        counterEl.classList.add('show');
      }
      if (ctaEl) ctaEl.classList.add('show');
    }

    function tick() {
      if (isPaused) return;
      if (window.__trackTick) { window.__trackTick(); }
      var t = clock.getElapsedTime();

      /* Mobile hero: full-screen auto-cycling slideshow.
         CSS pins the stage to 100svh; JS cycles step cards every 3 s,
         lerps the key to a new pose each time, and drives the ghost
         number + progress dots exactly like the desktop scroll does. */
      if (window.innerWidth <= 1024) {
        if (introEl && introEl.style.opacity !== '') {
          introEl.style.opacity = '';
          introEl.style.transform = '';
          introEl.style.pointerEvents = '';
        }

        // Seed the timer on the first mobile frame
        if (mobileStepStart < 0) mobileStepStart = t;

        // Advance step every 3 seconds
        if (t - mobileStepStart >= 3.0) {
          mobileStepStart = t;
          mobileStep = (mobileStep + 1) % SH_STEPS.length;
          mobileKeyTarget += Math.PI * 0.65; // partial spin to a fresh pose

          stepEls.forEach(function (el, i) { el.classList.toggle('active', i === mobileStep); });
          dotEls.forEach(function (el, i)  { el.classList.toggle('on',     i === mobileStep); });
          if (ghostEl) {
            var mpair = String(mobileStep + 1).padStart(2, '0');
            ghostEl.innerHTML =
              '<span class="sh-gn-a">' + mpair.charAt(0) + '</span>' +
              '<span class="sh-gn-b">' + mpair.charAt(1) + '</span>';
          }
          if (counterEl) {
            counterEl.textContent =
              String(mobileStep + 1).padStart(2, '0') + ' / 0' + SH_STEPS.length;
          }
        }

        key.rotation.y += (mobileKeyTarget - key.rotation.y) * 0.04;
        key.rotation.z  = Math.sin(t * 1.2) * 0.04;
        key.rotation.x  = -0.12;
        key.position.x  = 0;
        key.position.y  = Math.sin(t * 1.0) * 0.05;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
        return;
      }

      /* scroll progress 0→1 through the wrapper */
      var rect     = wrap.getBoundingClientRect();
      var total    = wrap.offsetHeight - window.innerHeight;
      var progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;

      var introEnd = 0.15; // First 15% of scroll is dedicated to sliding the intro up
      var span     = (1 - introEnd) / SH_STEPS.length;
      var idx      = progress < introEnd
        ? -1
        : clamp(Math.floor((progress - introEnd) / span), 0, SH_STEPS.length - 1);
      var isMobile = window.innerWidth < 860;

      /* clean intro slide-up (perfectly tied to scroll) */
      if (introEl) {
        var slideProgress = clamp(progress / introEnd, 0, 1);
        var slideEased = slideProgress * slideProgress * (3 - 2 * slideProgress); // smoothstep
        introEl.style.opacity = 1 - slideProgress;
        // Slide up dramatically (-50vh) so it completely leaves the frame cleanly
        introEl.style.transform = 'translate(-50%, calc(-50% - ' + (slideEased * 50) + 'vh))';
        introEl.style.pointerEvents = slideProgress > 0.5 ? 'none' : 'auto';
      }

      /* pure scroll-tied key rotation (no floaty lerp!) */
      var targetSpin = progress * Math.PI * 4; // Exactly 2 full spins over the scroll length
      /* slight left-of-center drift — pulled in from -1.7 so the key
         doesn't crash into the giant ghost step numbers on the left edge */
      var targetX    = (isMobile || idx < 0) ? 0 : -0.7;

      // On the final step, lerp the key to face straight toward the camera.
      // Entering step 4 at ~79% scroll puts rotation.y at ~207° off-axis;
      // snap facingTarget to the nearest full rotation (multiple of 2π) so
      // the key smoothly swings to face-forward rather than staying edge-on.
      if (idx === SH_STEPS.length - 1 && lastIdx !== SH_STEPS.length - 1) {
        facingTarget = Math.round(key.rotation.y / (Math.PI * 2)) * Math.PI * 2;
      }
      if (idx === SH_STEPS.length - 1) {
        key.rotation.y += (facingTarget - key.rotation.y) * 0.055;
      } else {
        key.rotation.y = targetSpin;
      }

      // Scroll-driven diagonal lean — kicks in as we pass the intro,
      // tilts the spin axis so the key reads diagonally on screen.
      var stepPhase = clamp((progress - introEnd) / 0.10, 0, 1);
      key.rotation.z = Math.sin(t * 1.5) * 0.03 - stepPhase * 0.22;  // up to ~13° lean
      key.rotation.x = -0.12 - stepPhase * 0.06;                      // very subtle forward tilt
      
      // Lerp the X position so it glides smoothly to the left when the steps appear
      curX += (targetX - curX) * 0.1;
      key.position.x = curX;
      
      // Very subtle float
      key.position.y = Math.sin(t * 1.0) * 0.06;

      /* step activation */
      if (idx !== lastIdx) {
        stepEls.forEach(function (el, i) { el.classList.toggle('active', i === idx); });
        dotEls.forEach(function (el, i)  { el.classList.toggle('on',     i === idx); });
        if (ghostEl) {
          if (idx < 0) {
            ghostEl.innerHTML = '';
            ghostEl.style.opacity = 0;
          } else {
            var pair = String(idx + 1).padStart(2, '0');
            ghostEl.innerHTML =
              '<span class="sh-gn-a">' + pair.charAt(0) + '</span>' +
              '<span class="sh-gn-b">' + pair.charAt(1) + '</span>';
            ghostEl.style.opacity = 1;
          }
        }
        if (counterEl) {
          counterEl.textContent = idx < 0 ? '' : (String(idx + 1).padStart(2, '0') + ' / 0' + SH_STEPS.length);
          counterEl.classList.toggle('show', idx >= 0);
        }
        if (ctaEl) ctaEl.classList.toggle('show', idx === SH_STEPS.length - 1);
        lastIdx = idx;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }

    if (!isPaused) {
      raf = requestAnimationFrame(tick);
    }
  }

  /* wait for Three.js to load */
  function tryInit() {
    if (window.THREE) { initHero(); }
    else              { setTimeout(tryInit, 60); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();
