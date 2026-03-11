/* ============================================
   3D INVENZA — Holographic Particle Morph Engine v2
   - 350 dots freely drift → merge into 3D models
   - Rotation during hold phase
   - Scroll reactive: scroll disrupts / boosts particles
   - Scroll progress bar
   - Improved shape generators
   ============================================ */
(function () {
    'use strict';

    var canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var W, H, cx, cy, R; // R = shape radius

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        cx = W / 2;
        cy = H / 2;
        R = Math.min(W, H) * 0.26;
    }
    resize();
    window.addEventListener('resize', function () { resize(); rebuildTargets(); });

    // ═══════════════════════════════════════════════
    // SHAPE GENERATORS  (return array of {x,y})
    // ═══════════════════════════════════════════════

    // Helper: rotate point around center
    function rot(x, y, a) {
        var c = Math.cos(a), s = Math.sin(a);
        return {
            x: (x - cx) * c - (y - cy) * s + cx,
            y: (x - cx) * s + (y - cy) * c + cy
        };
    }

    /* Arc Reactor — concentric rings + hex spoke pattern */
    function genArcReactor() {
        var pts = [];
        var rings = [0.10, 0.22, 0.38, 0.55, 0.72, 0.88, 1.0];
        var counts = [1, 6, 12, 18, 24, 30, 40];
        rings.forEach(function (r, ri) {
            for (var i = 0; i < counts[ri]; i++) {
                var a = (i / counts[ri]) * Math.PI * 2 + ri * 0.18;
                pts.push({ x: cx + Math.cos(a) * R * r, y: cy + Math.sin(a) * R * r });
            }
        });
        // 6 spokes
        for (var s = 0; s < 6; s++) {
            var sa = (s / 6) * Math.PI * 2;
            for (var d = 0; d < 14; d++) {
                var sr = 0.22 + d * 0.056;
                pts.push({ x: cx + Math.cos(sa) * R * sr, y: cy + Math.sin(sa) * R * sr });
            }
        }
        return pts;
    }

    /* Iron Man — 10-facet angular helmet silhouette */
    function genIronMan() {
        var pts = [];
        var N = 180;
        for (var i = 0; i < N; i++) {
            var a = (i / N) * Math.PI * 2;
            // Angular facet radius modulation
            var facets = 10;
            var fa = Math.floor(a / (Math.PI * 2 / facets)) * (Math.PI * 2 / facets);
            var frac = (a - fa) / (Math.PI * 2 / facets);
            var fr = 0.82 + Math.sin(frac * Math.PI) * 0.18;
            // Pointed top, flared chin
            var ry = a > Math.PI ? 0.9 : 1.05;
            pts.push({ x: cx + Math.cos(a) * R * fr, y: cy + Math.sin(a) * R * fr * ry });
        }
        // Eye slots
        for (var e = -1; e <= 1; e += 2) {
            for (var k = 0; k < 12; k++) {
                var ka = (k / 12) * Math.PI * 2;
                pts.push({
                    x: cx + e * R * 0.32 + Math.cos(ka) * R * 0.13,
                    y: cy - R * 0.22 + Math.sin(ka) * R * 0.07
                });
            }
        }
        // Chin detail arc
        for (var c = 0; c < 20; c++) {
            var ca = Math.PI + (c / 20 - 0.5) * 1.2;
            pts.push({ x: cx + Math.cos(ca) * R * 0.55, y: cy + Math.sin(ca) * R * 0.55 });
        }
        // Faceplate inner
        for (var f = 0; f < 24; f++) {
            var fA = (f / 24) * Math.PI * 2;
            pts.push({ x: cx + Math.cos(fA) * R * 0.42, y: cy + Math.sin(fA) * R * 0.35 - R * 0.08 });
        }
        return pts;
    }

    /* JARVIS Neural Sphere — golden ratio sphere + latitude rings */
    function genJARVIS() {
        var pts = [];
        var phi = Math.PI * (3 - Math.sqrt(5));
        var N = 200;
        for (var i = 0; i < N; i++) {
            var y = 1 - (i / (N - 1)) * 2;
            var r = Math.sqrt(1 - y * y);
            var theta = phi * i;
            // 3D → 2D isometric-ish project with slight tilt
            var x3 = Math.cos(theta) * r;
            var z3 = Math.sin(theta) * r;
            var px = x3 * R + z3 * R * 0.2;
            var py = y * R - z3 * R * 0.1;
            pts.push({ x: cx + px, y: cy + py });
        }
        // Equatorial ring accent
        for (var e = 0; e < 36; e++) {
            var ea = (e / 36) * Math.PI * 2;
            pts.push({ x: cx + Math.cos(ea) * R, y: cy + Math.sin(ea) * R * 0.25 });
        }
        return pts;
    }

    /* 3D Printer — box frame + nozzle + build layers */
    function gen3DPrinter() {
        var pts = [];
        var bw = 0.72, bh = 0.90, bd = 0.48;
        // 12 edges of box
        var corners3D = [
            [-bw, -bh, -bd], [bw, -bh, -bd], [bw, bh, -bd], [-bw, bh, -bd],
            [-bw, -bh, bd], [bw, -bh, bd], [bw, bh, bd], [-bw, bh, bd],
        ];
        var edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
        ];
        function proj(p) {
            // simple isometric projection
            return {
                x: cx + (p[0] - p[2] * 0.4) * R,
                y: cy + (p[1] + p[2] * 0.25) * R * 0.65
            };
        }
        edges.forEach(function (e) {
            var p0 = corners3D[e[0]], p1 = corners3D[e[1]];
            for (var t = 0; t <= 10; t++) {
                var f = t / 10;
                var mp = [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f, p0[2] + (p1[2] - p0[2]) * f];
                pts.push(proj(mp));
            }
        });
        // Nozzle at top center
        for (var n = 0; n < 10; n++) {
            var na = (n / 10) * Math.PI * 2;
            pts.push({ x: cx + Math.cos(na) * R * 0.07, y: cy - R * 0.85 + Math.sin(na) * R * 0.04 });
        }
        // Build plate layers (3 horizontal)
        for (var l = 0; l < 3; l++) {
            var ly = cy + R * (-0.2 + l * 0.22);
            for (var m = 0; m < 20; m++) {
                var lx = cx + (-bw + m * (2 * bw / 20)) * R;
                pts.push({ x: lx, y: ly });
            }
        }
        // Filament path (vertical line from nozzle to plate)
        for (var v = 0; v < 12; v++) {
            pts.push({ x: cx, y: cy - R * 0.85 + v * (R * 0.7 / 12) });
        }
        return pts;
    }

    /* Hex Core — hexagonal prism with energy rings */
    function genHexCore() {
        var pts = [];
        var sides = 6, stacks = 10;
        // Hex prism edges
        for (var stack = 0; stack <= stacks; stack++) {
            var yF = (stack / stacks - 0.5) * 1.6;
            for (var s = 0; s < sides; s++) {
                var a1 = (s / sides) * Math.PI * 2;
                var a2 = ((s + 1) / sides) * Math.PI * 2;
                for (var t = 0; t <= 8; t++) {
                    var f = t / 8;
                    pts.push({
                        x: cx + (Math.cos(a1) + (Math.cos(a2) - Math.cos(a1)) * f) * R * 0.85,
                        y: cy + yF * R + (Math.sin(a1) + (Math.sin(a2) - Math.sin(a1)) * f) * R * 0.12
                    });
                }
            }
        }
        // Energy rings (3 rings mid-column)
        [0.4, 0, -0.4].forEach(function (yo) {
            for (var r = 0; r < 24; r++) {
                var ra = (r / 24) * Math.PI * 2;
                pts.push({ x: cx + Math.cos(ra) * R * 0.45, y: cy + yo * R + Math.sin(ra) * R * 0.06 });
            }
        });
        // Vertical energy column
        for (var v = 0; v < 20; v++) {
            pts.push({ x: cx + (Math.random() - 0.5) * R * 0.06, y: cy - R * 0.7 + v * R * 0.07 });
        }
        return pts;
    }

    // ═══════════════════════════════════════════════
    // SHAPES CONFIG
    // ═══════════════════════════════════════════════
    var SHAPES = [
        { name: 'Arc Reactor', gen: genArcReactor, col: [0, 235, 255], acc: [0, 150, 255] },
        { name: 'Iron Man', gen: genIronMan, col: [249, 115, 22], acc: [255, 50, 10] },
        { name: 'JARVIS', gen: genJARVIS, col: [120, 50, 240], acc: [0, 235, 255] },
        { name: '3D Printer', gen: gen3DPrinter, col: [0, 235, 255], acc: [100, 40, 220] },
        { name: 'Hex Core', gen: genHexCore, col: [245, 100, 15], acc: [100, 40, 220] },
    ];

    var NUM = 350;
    var shapeIdx = 0;
    var phase = 'cloud';  // cloud | in | hold | out
    var phaseT = 0;
    var rotAngle = 0;        // shape rotation during hold

    var DURATIONS = { cloud: 3.0, in: 2.8, hold: 4.5, out: 2.2 };

    // ═══════════════════════════════════════════════
    // PARTICLES
    // ═══════════════════════════════════════════════
    var particles = [];
    var targets = [];

    function Particle(i) {
        this.id = i;
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.hx = this.x; // cloud home
        this.hy = this.y;
        this.tx = this.x; // target
        this.ty = this.y;
        this.vx = (Math.random() - 0.5) * 0.55;
        this.vy = (Math.random() - 0.5) * 0.55;
        this.r = Math.random() * 1.6 + 0.5;
        this.alpha = Math.random() * 0.45 + 0.2;
        this.glow = 0;
        this.speed = Math.random() * 0.5 + 0.5;
    }

    for (var i = 0; i < NUM; i++) particles.push(new Particle(i));

    function rebuildTargets() {
        var raw = SHAPES[shapeIdx].gen();
        // Fill/trim to NUM
        while (raw.length < NUM) raw.push(raw[Math.floor(Math.random() * raw.length)]);
        raw = raw.slice(0, NUM);
        // Shuffle for organic assignment
        raw.sort(function () { return Math.random() - 0.5; });
        targets = raw;
    }
    rebuildTargets();

    // ═══════════════════════════════════════════════
    // SCROLL STATE
    // ═══════════════════════════════════════════════
    var scrollY = 0;
    var scrollDelta = 0;  // instantaneous scroll speed
    var lastScrollY = 0;

    window.addEventListener('scroll', function () {
        scrollY = window.scrollY;
        scrollDelta = Math.abs(scrollY - lastScrollY);
        lastScrollY = scrollY;
    }, { passive: true });

    // Scroll progress bar
    var progressBar = document.createElement('div');
    progressBar.id = 'scrollProgressBar';
    progressBar.style.cssText =
        'position:fixed;top:0;left:0;height:2px;width:0%;' +
        'background:linear-gradient(90deg,#00f5ff,#7c3aed,#f97316);' +
        'z-index:10000;pointer-events:none;transition:width 0.1s linear;' +
        'box-shadow:0 0 8px rgba(0,245,255,0.6);';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function () {
        var doc = document.documentElement;
        var pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
        progressBar.style.width = pct + '%';
    }, { passive: true });

    // ═══════════════════════════════════════════════
    // MOUSE
    // ═══════════════════════════════════════════════
    var mx = -9999, my = -9999;
    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

    // ═══════════════════════════════════════════════
    // PHASE ADVANCE
    // ═══════════════════════════════════════════════
    function nextPhase() {
        if (phase === 'cloud') {
            phase = 'in';
            rebuildTargets();
            rotAngle = 0;
            particles.forEach(function (p, i) { p.tx = targets[i].x; p.ty = targets[i].y; });
        } else if (phase === 'in') {
            phase = 'hold';
        } else if (phase === 'hold') {
            phase = 'out';
            particles.forEach(function (p) { p.tx = p.hx; p.ty = p.hy; p.glow = 0; });
        } else if (phase === 'out') {
            phase = 'cloud';
            shapeIdx = (shapeIdx + 1) % SHAPES.length;
            particles.forEach(function (p) {
                p.hx = Math.random() * W; p.hy = Math.random() * H;
                p.tx = p.hx; p.ty = p.hy;
                p.vx = (Math.random() - 0.5) * 0.55;
                p.vy = (Math.random() - 0.5) * 0.55;
            });
        }
        phaseT = 0;
    }

    // ═══════════════════════════════════════════════
    // EASING
    // ═══════════════════════════════════════════════
    function easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // ═══════════════════════════════════════════════
    // CONNECTION LINE DISTANCE
    // ═══════════════════════════════════════════════
    function connDist() {
        if (phase === 'cloud') return 110;
        if (phase === 'hold') return 80;
        return 90;
    }

    // ═══════════════════════════════════════════════
    // HUD LABEL
    // ═══════════════════════════════════════════════
    var hudLabel = document.createElement('div');
    hudLabel.id = 'morphHudLabel';
    hudLabel.style.cssText =
        'position:fixed;top:68px;right:20px;font-family:"Orbitron",monospace;' +
        'font-size:0.52rem;letter-spacing:0.2em;color:rgba(0,245,255,0.55);' +
        'z-index:9990;pointer-events:none;text-align:right;transition:opacity 0.4s;';
    document.body.appendChild(hudLabel);

    // Shape label during hold
    var shapeLabel = document.createElement('div');
    shapeLabel.id = 'shapeCenterLabel';
    shapeLabel.style.cssText =
        'position:fixed;left:50%;transform:translateX(-50%);' +
        'font-family:"Orbitron",monospace;font-size:0.7rem;letter-spacing:0.3em;' +
        'color:rgba(0,245,255,0);text-align:center;pointer-events:none;' +
        'z-index:9990;transition:color 0.5s ease,text-shadow 0.5s ease;';
    document.body.appendChild(shapeLabel);

    // ═══════════════════════════════════════════════
    // DRAW LOOP
    // ═══════════════════════════════════════════════
    var prev = performance.now();
    var labelA = 0;

    function draw(now) {
        requestAnimationFrame(draw);
        var dt = Math.min((now - prev) / 1000, 0.05);
        prev = now;
        phaseT += dt;

        // Scroll disruption: boost particles proportional to scroll speed
        var scrollBoost = Math.min(scrollDelta * 0.08, 2.0);
        scrollDelta *= 0.85; // decay

        // Phase advance
        if (phaseT >= DURATIONS[phase]) nextPhase();
        var progress = Math.min(phaseT / DURATIONS[phase], 1);
        var ease = easeInOut(progress);

        // Shape color lerp toward current
        var shape = SHAPES[shapeIdx];
        var colR = shape.col[0], colG = shape.col[1], colB = shape.col[2];

        ctx.clearRect(0, 0, W, H);

        // ── During hold: slowly rotate targets ──
        if (phase === 'hold') {
            rotAngle += dt * 0.22;
            labelA = Math.min(1, labelA + dt * 2);
        } else {
            labelA = Math.max(0, labelA - dt * 3);
        }

        // ── Update particles ──
        particles.forEach(function (p) {
            if (phase === 'cloud') {
                p.x += p.vx * (1 + scrollBoost);
                p.y += p.vy * (1 + scrollBoost);
                // Wrap
                if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
                if (p.y < -5) p.y = H + 5; if (p.y > H + 5) p.y = -5;
                // Scroll turbulence
                if (scrollBoost > 0.1) {
                    p.vx += (Math.random() - 0.5) * scrollBoost * 0.15;
                    p.vy += (Math.random() - 0.5) * scrollBoost * 0.15;
                }
                // Mouse repulsion
                var ddx = p.x - mx, ddy = p.y - my;
                var dd = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dd < 100 && dd > 0) { p.x += ddx / dd * (100 - dd) * 0.045; p.y += ddy / dd * (100 - dd) * 0.045; }
                p.glow = 0;
            } else if (phase === 'hold') {
                // Rotate target around center
                var rx = cx + (p.tx - cx) * Math.cos(dt * 0.22) - (p.ty - cy) * Math.sin(dt * 0.22);
                var ry = cy + (p.tx - cx) * Math.sin(dt * 0.22) + (p.ty - cy) * Math.cos(dt * 0.22);
                p.tx = rx; p.ty = ry;
                // Lerp toward rotating target + slight oscillation
                p.x += (p.tx - p.x) * 0.06;
                p.y += (p.ty - p.y) * 0.06;
                p.x += Math.sin(now * 0.001 + p.id * 0.25) * 0.2;
                p.y += Math.cos(now * 0.001 + p.id * 0.4) * 0.2;
                // Scroll disruption during hold: scatter proportional
                if (scrollBoost > 0.3) {
                    p.x += (Math.random() - 0.5) * scrollBoost * 4;
                    p.y += (Math.random() - 0.5) * scrollBoost * 4;
                }
                p.glow = 1;
            } else {
                // morphing in / out — lerp with eased speed
                var lerpS = phase === 'in' ? 0.045 * (1 + ease) : 0.04 * (1 + (1 - ease));
                p.x += (p.tx - p.x) * lerpS;
                p.y += (p.ty - p.y) * lerpS;
                p.glow = phase === 'in' ? ease : 1 - ease;
            }
        });

        // ── Connection lines ──
        var cd = connDist();
        var maxA = phase === 'hold' ? 0.22 : (phase === 'cloud' ? 0.10 : ease * 0.15);

        for (var i = 0; i < particles.length; i++) {
            for (var j = i + 1; j < particles.length; j++) {
                var dx = particles[i].x - particles[j].x;
                var dy = particles[i].y - particles[j].y;
                var d = dx * dx + dy * dy;
                if (d < cd * cd) {
                    d = Math.sqrt(d);
                    var a = (1 - d / cd) * maxA;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = 'rgba(' + colR + ',' + colG + ',' + colB + ',' + a + ')';
                    ctx.lineWidth = phase === 'hold' ? 0.9 : 0.5;
                    ctx.stroke();
                }
            }
        }

        // ── Draw particles ──
        particles.forEach(function (p) {
            var dotA = phase === 'cloud' ? p.alpha : (0.35 + p.glow * 0.65);
            var glowR = p.r * (2 + p.glow * 5);

            // Glow halo
            if (p.glow > 0.05) {
                var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
                grd.addColorStop(0, 'rgba(' + colR + ',' + colG + ',' + colB + ',' + (p.glow * 0.4) + ')');
                grd.addColorStop(1, 'rgba(' + colR + ',' + colG + ',' + colB + ',0)');
                ctx.beginPath();
                ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();
            }

            // Sharp dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r + p.glow * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + colR + ',' + colG + ',' + colB + ',' + dotA + ')';
            ctx.fill();
        });

        // ── Shape center label ──
        if (labelA > 0.01) {
            ctx.save();
            ctx.globalAlpha = labelA * 0.7;
            ctx.font = '700 11px "Orbitron",monospace';
            ctx.fillStyle = 'rgba(' + colR + ',' + colG + ',' + colB + ',1)';
            ctx.textAlign = 'center';
            ctx.letterSpacing = '3px';
            ctx.fillText('[ ' + shape.name.toUpperCase() + ' ]', cx, cy + R * 1.15 + 28);
            // Accent line under label
            var lw = 90;
            ctx.fillStyle = 'rgba(' + colR + ',' + colG + ',' + colB + ',0.35)';
            ctx.fillRect(cx - lw / 2, cy + R * 1.15 + 36, lw, 1);
            ctx.restore();
        }

        // ── Morphing outer ring flash ──
        if (phase === 'in' && ease > 0.25) {
            ctx.save();
            ctx.globalAlpha = (ease - 0.25) * 0.15;
            ctx.strokeStyle = 'rgba(' + colR + ',' + colG + ',' + colB + ',1)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // ── HUD top-right label ──
        hudLabel.textContent = '◈ ' + shape.name.toUpperCase();
    }

    requestAnimationFrame(draw);

    // ═══════════════════════════════════════════════
    // SCROLL-TRIGGERED SECTION REVEALS (enhanced)
    // ═══════════════════════════════════════════════
    // Already handled by main.js IntersectionObserver — augment with staggered index
    document.querySelectorAll('.reveal-item').forEach(function (el, idx) {
        el.style.transitionDelay = (idx % 6 * 0.08) + 's';
    });

    // ── Parallax scroll on hero visual ──
    var heroVis = document.getElementById('heroVisual');
    if (heroVis) {
        window.addEventListener('scroll', function () {
            var offset = window.scrollY * 0.25;
            heroVis.style.transform = 'translateY(' + offset + 'px)';
        }, { passive: true });
    }

    // ── Section orbs parallax ──
    document.querySelectorAll('.orb').forEach(function (orb, i) {
        var speed = 0.08 + i * 0.04;
        window.addEventListener('scroll', function () {
            orb.style.transform = 'translateY(' + (window.scrollY * speed) + 'px)';
        }, { passive: true });
    });

})();
