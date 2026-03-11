/* ============================================
   3D INVENZA — JARVIS Holographic Engine v3.0
   Unified system for every page
   ============================================ */
(function () {
    'use strict';

    // ─── JARVIS Boot Sequence ────────────────────────
    (function jarvisBoot() {
        var overlay = document.getElementById('jarvisBootOverlay');
        if (!overlay) return;
        setTimeout(function () { overlay.classList.add('fade-out'); }, 1800);
        setTimeout(function () { overlay.remove(); }, 2400);
    })();

    // ─── JARVIS Scan Line ─────────────────────────────
    if (!document.getElementById('jarvisScanLine')) {
        var scanDiv = document.createElement('div');
        scanDiv.id = 'jarvisScanLine';
        scanDiv.style.cssText =
            'position:fixed;left:0;top:0;width:100%;height:2px;' +
            'background:linear-gradient(90deg,transparent,rgba(0,245,255,0.4),transparent);' +
            'box-shadow:0 0 14px rgba(0,245,255,0.3);' +
            'z-index:9998;pointer-events:none;will-change:top;';
        document.body.appendChild(scanDiv);
        var scanPos = 0;
        setInterval(function () {
            scanPos = (scanPos + 3) % window.innerHeight;
            scanDiv.style.top = scanPos + 'px';
        }, 16);
    }

    // ─── Scroll Reveal ────────────────────────────────
    var revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal-item:not(.visible)').forEach(function (el) { revObs.observe(el); });

    // ─── Counter Animation ───────────────────────────
    var cntObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var target = parseInt(entry.target.dataset.count);
                var cur = 0, step = Math.ceil(target / 60);
                var timer = setInterval(function () {
                    cur = Math.min(cur + step, target);
                    entry.target.textContent = cur;
                    if (cur >= target) clearInterval(timer);
                }, 18);
                cntObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat-number[data-count]').forEach(function (c) { cntObs.observe(c); });

    // ─── Tilt Cards ──────────────────────────────────
    document.querySelectorAll('.feature-detail-card, .product-detail-card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var r = card.getBoundingClientRect();
            var x = (e.clientX - r.left - r.width / 2) / 20;
            var y = -(e.clientY - r.top - r.height / 2) / 20;
            card.style.transform = 'perspective(700px) rotateX(' + y + 'deg) rotateY(' + x + 'deg) translateY(-4px)';
        });
        card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });

    // ─── HUD Corner Bracket Injection ────────────────
    document.querySelectorAll('.glass-panel, .feature-detail-card, .product-detail-card, .up-panel, .viewer-wrap').forEach(function (el) {
        el.classList.add('hud-frame');
    });

    // ─── Material Pills ──────────────────────────────
    document.querySelectorAll('.mat-pill').forEach(function (b) {
        b.addEventListener('click', function () {
            document.querySelectorAll('.mat-pill').forEach(function (x) { x.classList.remove('active'); });
            b.classList.add('active');
        });
    });

    // ─── System Clock ────────────────────────────────
    var clkEl = document.getElementById('sysClock');
    if (clkEl) {
        function updateClock() {
            var now = new Date();
            clkEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    // ─── Data Stream Background ───────────────────────
    var dsEl = document.getElementById('dataStream');
    if (dsEl && !dsEl.dataset.init) {
        dsEl.dataset.init = '1';
        var chars = '01101001011011100111011001100101011011100111101001100001010000010100001000110001'.split('');
        var dsI = 0;
        setInterval(function () {
            dsEl.textContent = chars.slice(dsI, dsI + 300).concat(chars.slice(0, Math.max(0, dsI + 300 - chars.length))).join(' ');
            dsI = (dsI + 1) % chars.length;
        }, 100);
    }

    // ─── Page-specific: Range label updates ──────────
    document.querySelectorAll('[data-label-target]').forEach(function (input) {
        var tgt = document.getElementById(input.dataset.labelTarget);
        if (!tgt) return;
        var fmt = input.dataset.fmt;
        function upd() { tgt.textContent = fmt === 'float2' ? parseFloat(input.value).toFixed(2) : input.value; }
        input.addEventListener('input', upd); upd();
    });

    console.log('%c3D INVENZA — JARVIS ENGINE v3.0', 'color:#00f5ff;font-family:monospace;font-size:14px;font-weight:bold');
    console.log('%cAll holographic modules active.', 'color:#7c3aed;font-family:monospace;font-size:11px');

})();
