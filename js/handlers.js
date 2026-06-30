/* ==========================================================================
   EVENT DELEGATION — keeps JavaScript out of the HTML.
   Markup declares behavior with data-action="fnName('arg', 2); other()".
   A single bubbled click listener parses and dispatches it. No eval, no
   inline handlers. Supported grammar per action string:
     - calls separated by ";"
     - each call: name(arg1, arg2)  — string ('..'/".."), number, or bare token
     - the special token "preventDefault" calls event.preventDefault()
   ========================================================================== */
(function () {
    'use strict';

    // Convenience used by a couple of links that previously inlined assignments.
    window.goLogin = function () { window.location.href = 'login.html'; };

    // Sources & Attribution modal
    window.openSourcesModal = function () {
        const m = document.getElementById('sourcesModal');
        if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
    };
    window.closeSourcesModal = function () {
        const m = document.getElementById('sourcesModal');
        if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
    };

    function parseArgs(raw) {
        const inner = raw.trim();
        if (inner === '') return [];
        return inner.split(',').map(function (a) {
            a = a.trim();
            if (/^'.*'$/.test(a) || /^".*"$/.test(a)) return a.slice(1, -1);
            if (/^-?\d+$/.test(a)) return parseInt(a, 10);
            if (/^-?\d*\.\d+$/.test(a)) return parseFloat(a);
            if (a === 'true') return true;
            if (a === 'false') return false;
            return a;
        });
    }

    function runAction(spec, e) {
        spec.split(';').forEach(function (part) {
            part = part.trim();
            if (!part) return;
            if (part === 'preventDefault' || part === 'event.preventDefault()') {
                e.preventDefault();
                return;
            }
            var m = part.match(/^([\w.]+)\((.*)\)$/);
            if (!m) return;
            var fn = window[m[1]];
            if (typeof fn !== 'function') return;
            fn.apply(window, parseArgs(m[2]));
        });
    }

    document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-action]');
        if (!el) return;
        runAction(el.getAttribute('data-action'), e);
    });
})();
