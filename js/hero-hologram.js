/* ============================================================
   3D INVENZA — Hero Hologram Engine  v6  (CLEAN)
   Clean, readable CoreXY-style 3D printer with only the
   essential structural parts — no noise or clutter.
   ============================================================ */
(function () {
    'use strict';

    var cv = document.getElementById('heroCanvas');
    if (!cv || !window.THREE) return;

    var W = cv.parentElement.clientWidth || 640;
    var H = cv.parentElement.clientHeight || 600;
    if (W < 10) W = 640;
    if (H < 10) H = 600;

    // ── Renderer ─────────────────────────────────────────────
    var renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    window.addEventListener('resize', function () {
        var pw = cv.parentElement.clientWidth;
        var ph = cv.parentElement.clientHeight;
        W = pw > 10 ? pw : 640;
        H = ph > 10 ? ph : 600;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
    });

    // Resume animation after tab becomes visible again
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) { t0 = performance.now() - 9999; } // skip intro, jump to stable state
    });

    // ── Scene + Camera ────────────────────────────────────────
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, W / H, 0.01, 200);
    camera.position.set(4.5, 4.5, 10);
    camera.lookAt(0, 2, 0);

    // ── Colours ───────────────────────────────────────────────
    var CYAN = 0x00f5ff;
    var VIOLET = 0x7c3aed;
    var ORANGE = 0xf97316;

    // ── Shared line material (cyan, dim) ─────────────────────
    var LM = function (col, op) {
        return new THREE.LineBasicMaterial({ color: col || CYAN, transparent: true, opacity: op || 0.55 });
    };

    // ── Helper: draw a box as 12 visible edges (wire-style) ──
    function boxEdges(w, h, d, mat) {
        var geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
        return new THREE.LineSegments(geo, mat);
    }
    function cylEdges(r, ht, mat) {
        var geo = new THREE.EdgesGeometry(new THREE.CylinderGeometry(r, r, ht, 12));
        return new THREE.LineSegments(geo, mat);
    }

    // solid mesh helper
    function mesh(geo, mat) { return new THREE.Mesh(geo, mat); }

    // ── MATERIALS ─────────────────────────────────────────────
    var matFrame = new THREE.MeshStandardMaterial({
        color: CYAN, emissive: 0x007788, emissiveIntensity: 0.7,
        transparent: true, opacity: 0.50, roughness: 0.05, metalness: 0.9
    });
    var matAccent = new THREE.MeshStandardMaterial({
        color: VIOLET, emissive: 0x5b21b6, emissiveIntensity: 0.55,
        transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.9
    });
    var matHot = new THREE.MeshStandardMaterial({
        color: ORANGE, emissive: 0x9a3a00, emissiveIntensity: 0.6,
        transparent: true, opacity: 0.80, roughness: 0.2, metalness: 0.7
    });
    var matNozzle = new THREE.MeshStandardMaterial({
        color: CYAN, emissive: CYAN, emissiveIntensity: 2.5
    });
    var matBed = new THREE.MeshStandardMaterial({
        color: 0x001824, emissive: 0x001c28, emissiveIntensity: 0.3,
        transparent: true, opacity: 0.88, roughness: 0.25, metalness: 0.85
    });
    var matPanel = new THREE.MeshStandardMaterial({
        color: 0x001020, emissive: 0x000e18, emissiveIntensity: 0.15,
        transparent: true, opacity: 0.15, side: THREE.DoubleSide
    });
    var matPrint = new THREE.MeshStandardMaterial({
        color: CYAN, emissive: 0x00ccee, emissiveIntensity: 0.9, transparent: true, opacity: 0.82
    });
    var wireMat = new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.08 });

    // ═══════════════════════════════════════════════
    //  PRINTER ROOT
    // ═══════════════════════════════════════════════
    var root = new THREE.Group();
    scene.add(root);
    root.position.set(-0.5, -1.0, 0);
    root.scale.set(1, 1, 1); // always visible — no boot scale-in

    /* ---------- OUTER FRAME ----------
       Simple box frame: 4 uprights + top ring + bottom ring
       Frame: 3 × 4.5 × 3  (width × height × depth)
    */
    var FW = 3.0, FH = 4.5, FD = 3.0;
    var FW2 = FW / 2, FH2 = FH / 2, FD2 = FD / 2;

    // 4 corner uprights (cylinders)
    var upGeo = new THREE.CylinderGeometry(0.07, 0.07, FH, 10);
    [[FW2, FH2, FD2], [-FW2, FH2, FD2],
    [FW2, FH2, -FD2], [-FW2, FH2, -FD2]].forEach(function (p) {
        var c = mesh(upGeo, matFrame);
        c.position.set(p[0], p[1], p[2]);
        root.add(c);
    });

    // bottom ring (4 bars)
    var barYB = 0.12;
    [
        [new THREE.BoxGeometry(FW, 0.08, 0.08), [0, barYB, -FD2]],
        [new THREE.BoxGeometry(FW, 0.08, 0.08), [0, barYB, FD2]],
        [new THREE.BoxGeometry(0.08, 0.08, FD), [FW2, barYB, 0]],
        [new THREE.BoxGeometry(0.08, 0.08, FD), [-FW2, barYB, 0]],
    ].forEach(function (p) {
        var b = mesh(p[0], matFrame);
        b.position.set(p[1][0], p[1][1], p[1][2]);
        root.add(b);
    });

    // top ring (4 bars)
    var barYT = FH;
    [
        [new THREE.BoxGeometry(FW, 0.10, 0.10), [0, barYT, -FD2]],
        [new THREE.BoxGeometry(FW, 0.10, 0.10), [0, barYT, FD2]],
        [new THREE.BoxGeometry(0.10, 0.10, FD), [FW2, barYT, 0]],
        [new THREE.BoxGeometry(0.10, 0.10, FD), [-FW2, barYT, 0]],
    ].forEach(function (p) {
        var b = mesh(p[0], matFrame);
        b.position.set(p[1][0], p[1][1], p[1][2]);
        root.add(b);
    });

    // -- base plate --
    var basePlate = mesh(new THREE.BoxGeometry(FW, 0.10, FD), matBed);
    basePlate.position.set(0, 0.05, 0);
    root.add(basePlate);

    /* ---------- GANTRY (CoreXY) ----------
       Y-motor is on the top frame.
       X-axis linear rail runs left-right.
       One toolhead block slides on X.
    */
    var ganY = FH - 0.35;   // gantry rail height

    // X-axis rail (horizontal, runs left-right)
    var xRailM = mesh(new THREE.BoxGeometry(FW - 0.30, 0.08, 0.08), matFrame);
    xRailM.position.set(0, ganY, 0);
    root.add(xRailM);

    // X-axis carriage (the entire assembly that holds toolhead, slides on X)
    var xCarriage = new THREE.Group();
    xCarriage.position.set(0, ganY, 0);
    root.add(xCarriage);

    // ── Toolhead ──────────────────────────────────────────────
    var th = new THREE.Group();
    th.position.set(0, -0.08, 0);
    xCarriage.add(th);

    // Carriage slider block
    var sliderM = mesh(new THREE.BoxGeometry(0.24, 0.18, 0.18), matAccent);
    th.add(sliderM);

    // Heatsink (flat plate above hot-end)
    var hsM = mesh(new THREE.BoxGeometry(0.36, 0.30, 0.12), matFrame);
    hsM.position.set(0, -0.28, 0);
    th.add(hsM);

    // Hot-end block
    var heM = mesh(new THREE.BoxGeometry(0.20, 0.20, 0.20), matHot);
    heM.position.set(0, -0.56, 0);
    th.add(heM);

    // Nozzle
    var nzGeo = new THREE.CylinderGeometry(0.042, 0.010, 0.28, 8);
    var nzM = mesh(nzGeo, matNozzle);
    nzM.position.set(0, -0.78, 0);
    th.add(nzM);

    // Nozzle point-light
    var nozzleLight = new THREE.PointLight(CYAN, 2.5, 1.8);
    nozzleLight.position.set(0, -0.84, 0);
    th.add(nozzleLight);

    // Part-cooling fan duct (2 side vanes)
    var fanDuctGeo = new THREE.BoxGeometry(0.12, 0.26, 0.30);
    [-0.20, 0.20].forEach(function (x) {
        var fd = mesh(fanDuctGeo, matFrame);
        fd.position.set(x, -0.58, 0);
        th.add(fd);
    });

    // Main cooling fan (on top of heatsink)
    var fanM = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.055, 16), matAccent);
    fanM.position.set(0, -0.12, 0.14);
    th.add(fanM);

    /* ---------- HEATED BED + Z-STAGE ---------- */
    var bedGroup = new THREE.Group();
    root.add(bedGroup);
    bedGroup.position.set(0, 0.70, 0);

    // Bed surface
    var bedM = mesh(new THREE.BoxGeometry(2.6, 0.08, 2.6), matBed);
    bedGroup.add(bedM);

    // Bed grid (subtle)
    var bedGrid = new THREE.GridHelper(2.5, 10, CYAN, 0x003344);
    bedGrid.material.transparent = true;
    bedGrid.material.opacity = 0.18;
    bedGrid.position.y = 0.06;
    bedGroup.add(bedGrid);

    // Z lead-screw (simple rod on the back)
    var zRod = mesh(new THREE.CylinderGeometry(0.028, 0.028, FH - 0.5, 8), matAccent);
    zRod.position.set(0, FH2 - 0.1, -FD2 + 0.18);
    root.add(zRod);

    /* ---------- PRINT OBJECT ---------- */
    var printObj = mesh(new THREE.BoxGeometry(0.60, 0.001, 0.60), matPrint);
    printObj.position.set(0, 0.06, 0);
    bedGroup.add(printObj);

    /* ---------- FILAMENT SPOOL ---------- */
    var spoolGrp = new THREE.Group();
    spoolGrp.position.set(-FW2 - 0.22, 2.70, -FD2 + 0.50);
    root.add(spoolGrp);

    var spoolRingGeo = new THREE.TorusGeometry(0.48, 0.14, 8, 24);
    var spoolM = mesh(spoolRingGeo, matAccent);
    spoolM.rotation.y = Math.PI / 2;
    spoolGrp.add(spoolM);

    var spoolHub = mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.32, 8), matFrame);
    spoolHub.rotation.z = Math.PI / 2;
    spoolGrp.add(spoolHub);

    // Spool holder rod
    var sHolderRod = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), matFrame);
    sHolderRod.rotation.z = Math.PI / 2;
    sHolderRod.position.set(0, 0, 0);
    spoolGrp.add(sHolderRod);

    // filament line spool → toolhead
    var filGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-FW2 - 0.22 + 0.22, 2.70 + 1.0, -FD2 + 0.50),
        new THREE.Vector3(-0.30, ganY + 0.10, -0.08)
    ]);
    root.add(new THREE.Line(filGeo, LM(VIOLET, 0.45)));

    /* ---------- MOTOR BLOCKS at corners of gantry ---------- */
    var motorGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    [[FW2 - 0.18, -FD2 + 0.18], [-FW2 + 0.18, -FD2 + 0.18],
    [FW2 - 0.18, FD2 - 0.18], [-FW2 + 0.18, FD2 - 0.18]].forEach(function (p) {
        var m = mesh(motorGeo, matHot);
        m.position.set(p[0], barYT, p[1]);
        root.add(m);
    });

    /* ---------- TRANSPARENT SIDE PANELS ---------- */
    var sideGeo = new THREE.PlaneGeometry(FD - 0.24, FH - 0.24);
    [-FW2, FW2].forEach(function (x) {
        var sp = mesh(sideGeo, matPanel);
        sp.rotation.y = Math.PI / 2;
        sp.position.set(x, FH2, 0);
        root.add(sp);
    });

    /* ---------- BELT LINES ---------- */
    function addBelt(x1, z1, x2, z2) {
        var bMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.25 });
        var bGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x1, barYT - 0.06, z1),
            new THREE.Vector3(x2, barYT - 0.06, z2)
        ]);
        root.add(new THREE.Line(bGeo, bMat));
    }
    addBelt(-FW2 + 0.18, -FD2 + 0.18, 0, 0);
    addBelt(FW2 - 0.18, -FD2 + 0.18, 0, 0);

    // ═══════════════════════════════════════════════
    //  PROJECTION PLATFORM (ground ring)
    // ═══════════════════════════════════════════════
    var platGrp = new THREE.Group();
    scene.add(platGrp);
    platGrp.position.set(-0.5, -1.8, 0);

    var platRingMat = new THREE.MeshBasicMaterial({ color: CYAN, side: THREE.DoubleSide, transparent: true, opacity: 0.72 });
    var platRing = mesh(new THREE.RingGeometry(1.65, 1.82, 80), platRingMat);
    platRing.rotation.x = -Math.PI / 2;
    platGrp.add(platRing);

    var platInMat = new THREE.MeshBasicMaterial({ color: CYAN, side: THREE.DoubleSide, transparent: true, opacity: 0.44 });
    var platIn = mesh(new THREE.RingGeometry(0.88, 0.95, 72), platInMat);
    platIn.rotation.x = -Math.PI / 2;
    platGrp.add(platIn);

    var platFillMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.028, side: THREE.DoubleSide });
    var platFill = mesh(new THREE.CircleGeometry(1.62, 72), platFillMat);
    platFill.rotation.x = -Math.PI / 2;
    platGrp.add(platFill);

    // Tick marks
    for (var tk = 0; tk < 36; tk++) {
        var tka = (tk / 36) * Math.PI * 2;
        var long = tk % 3 === 0;
        var tgeo = new THREE.PlaneGeometry(0.026, long ? 0.16 : 0.08);
        var tmat = new THREE.MeshBasicMaterial({
            color: CYAN, transparent: true,
            opacity: long ? 0.45 : 0.18, side: THREE.DoubleSide
        });
        var tM = mesh(tgeo, tmat);
        tM.rotation.x = -Math.PI / 2;
        tM.rotation.z = tka;
        var tr = 1.74;
        tM.position.set(Math.cos(tka) * tr, 0.001, Math.sin(tka) * tr);
        platGrp.add(tM);
    }

    // ═══════════════════════════════════════════════
    //  PROJECTION CONE
    // ═══════════════════════════════════════════════
    var coneGrp = new THREE.Group();
    scene.add(coneGrp);
    coneGrp.position.set(-0.5, -1.8, 0);

    var coneMat = new THREE.MeshBasicMaterial({
        color: CYAN, transparent: true, opacity: 0.055, side: THREE.DoubleSide, depthWrite: false
    });
    var coneM = mesh(new THREE.ConeGeometry(1.65, 5.8, 40, 1, true), coneMat);
    coneM.position.y = 0.90;
    coneGrp.add(coneM);

    var coneInMat = new THREE.MeshBasicMaterial({
        color: CYAN, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false
    });
    var coneIn = mesh(new THREE.ConeGeometry(0.55, 5.8, 22, 1, true), coneInMat);
    coneIn.position.y = 0.90;
    coneGrp.add(coneIn);

    // Cone horizontal rings
    var coneRings = [];
    for (var cr = 0; cr < 9; cr++) {
        var crf = cr / 8;
        var crR = THREE.MathUtils.lerp(1.62, 0.04, crf);
        var crY = THREE.MathUtils.lerp(-1.78, 4.0, crf);
        var crMat = new THREE.MeshBasicMaterial({
            color: CYAN, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false
        });
        var crM = mesh(new THREE.RingGeometry(crR - 0.022, crR + 0.022, 52), crMat);
        crM.rotation.x = -Math.PI / 2;
        crM.position.y = crY;
        scene.add(crM);
        coneRings.push({ mat: crMat, off: cr * 0.24, base: 0.10 + crf * 0.26 });
    }

    // ═══════════════════════════════════════════════
    //  DATA PARTICLES (rising inside cone)
    // ═══════════════════════════════════════════════
    var NP = 160;
    var pPos = new Float32Array(NP * 3);
    var pVely = [];

    function cpt(yf) {
        var mx = THREE.MathUtils.lerp(1.58, 0.02, yf);
        var a = Math.random() * Math.PI * 2;
        var r = Math.random() * mx;
        return { x: Math.cos(a) * r - 0.5, z: Math.sin(a) * r };
    }
    for (var pi = 0; pi < NP; pi++) {
        var py = Math.random();
        var pp = cpt(py);
        pPos[pi * 3] = pp.x;
        pPos[pi * 3 + 1] = THREE.MathUtils.lerp(-1.80, 4.0, py);
        pPos[pi * 3 + 2] = pp.z;
        pVely.push(0.008 + Math.random() * 0.015);
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    var pMat = new THREE.PointsMaterial({
        color: CYAN, size: 0.045, sizeAttenuation: true,
        transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(pGeo, pMat));

    // ═══════════════════════════════════════════════
    //  HUD TORUS RINGS
    // ═══════════════════════════════════════════════
    var hudRings = [];
    [
        { r: 2.20, t: 0.018, c: CYAN, op: 0.45, sx: 0.4, sy: 0.7, sz: 0.2 },
        { r: 2.80, t: 0.012, c: VIOLET, op: 0.30, sx: -0.25, sy: 0.3, sz: 0.5 },
        { r: 1.65, t: 0.020, c: ORANGE, op: 0.35, sx: 0.5, sy: 0.2, sz: -0.45 },
    ].forEach(function (d) {
        var rGeo = new THREE.TorusGeometry(d.r, d.t, 6, 90);
        var rMat = new THREE.MeshBasicMaterial({ color: d.c, transparent: true, opacity: d.op });
        var rMesh = mesh(rGeo, rMat);
        scene.add(rMesh);
        hudRings.push({ mesh: rMesh, mat: rMat, tOp: d.op, sx: d.sx, sy: d.sy, sz: d.sz });
    });

    // ═══════════════════════════════════════════════
    //  VERTICAL SCAN LINE
    // ═══════════════════════════════════════════════
    var scanMat = new THREE.MeshBasicMaterial({
        color: CYAN, transparent: true, opacity: 0.52, side: THREE.DoubleSide, depthWrite: false
    });
    var scanM = mesh(new THREE.PlaneGeometry(4.0, 0.045), scanMat);
    scene.add(scanM);
    var trailMat = new THREE.MeshBasicMaterial({
        color: CYAN, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false
    });
    var trailM = mesh(new THREE.PlaneGeometry(4.0, 0.16), trailMat);
    scene.add(trailM);
    var scanPos = -1.8, scanDir = 1;

    // ═══════════════════════════════════════════════
    //  LIGHTS
    // ═══════════════════════════════════════════════
    scene.add(new THREE.AmbientLight(0x061020, 2.8));
    var lt1 = new THREE.PointLight(CYAN, 5.0, 20); lt1.position.set(3, 7, 4); scene.add(lt1);
    var lt2 = new THREE.PointLight(VIOLET, 3.0, 16); lt2.position.set(-4, 3, -3); scene.add(lt2);
    var lt3 = new THREE.PointLight(ORANGE, 1.8, 12); lt3.position.set(0, -1, 4); scene.add(lt3);
    var uplLight = new THREE.PointLight(CYAN, 4.0, 10);  // always on
    uplLight.position.set(-0.5, -1.6, 0); scene.add(uplLight);

    // ═══════════════════════════════════════════════
    //  ANIMATION
    // ═══════════════════════════════════════════════
    var t0 = performance.now() - 9999; // start well past all intro phases
    var printH = 0;
    var printerUp = true; // already fully started
    var extX = 0, extDir = 1;
    var bedZ = 0;
    var txX = 0, txY = 0, cxX = 0, cxY = 0;

    document.addEventListener('mousemove', function (e) {
        txX = ((e.clientY / window.innerHeight) - 0.5) * 0.12;
        txY = ((e.clientX / window.innerWidth) - 0.5) * 0.20;
    });

    function clamp(x, a, b) { return Math.min(Math.max((x - a) / (b - a), 0), 1); }
    function eob(t) {
        var c1 = 1.70158, c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    function animate(now) {
        requestAnimationFrame(animate);
        var t = (now - t0) / 1000;

        /* Phase 0 - platform always fully visible */
        platRingMat.opacity = 0.72;
        platInMat.opacity = 0.44;
        platFillMat.opacity = 0.028;
        coneMat.opacity = 0.055;
        coneInMat.opacity = 0.10;
        uplLight.intensity = 4.0;

        /* Phase 1 - printer always at full scale */
        root.scale.set(1, 1, 1);

        /* Phase 2 - particles always visible */
        pMat.opacity = 0.85;

        /* Phase 3 - HUD rings always visible */
        hudRings.forEach(function (r) {
            r.mat.opacity = r.tOp;
        });

        /* Phase 4 - scanline always visible */
        scanMat.opacity = 0.52;
        trailMat.opacity = 0.15;

        /* Cone rings pulse */
        coneRings.forEach(function (cr) {
            cr.mat.opacity = p0 * cr.base * (0.5 + 0.5 * Math.sin(t * 1.55 + cr.off));
        });

        /* Growing print object */
        if (printerUp) {
            printH = Math.min(printH + 0.0025, 1.10);
            printObj.geometry.dispose();
            printObj.geometry = new THREE.BoxGeometry(0.60, Math.max(printH, 0.001), 0.60);
            printObj.position.y = 0.06 + printH / 2;

            /* Bed slowly descends */
            bedZ = Math.min(bedZ + 0.0006, 0.44);
            bedGroup.position.y = 0.70 - bedZ;

            /* Nozzle follows top of print (roughly) */
            // toolhead Y is fixed at xCarriage (ganY); nozzle is at -0.78 from th
            // just keep the gantry moving; nozzle glow pulses OK
        }

        /* Extruder sweeps X */
        extX += extDir * 0.008;
        if (extX > 1.0) extDir = -1;
        if (extX < -1.0) extDir = 1;
        th.position.x = extX;

        /* Fan spins */
        fanM.rotation.z += 0.16;

        /* Spool spins */
        spoolM.rotation.z += 0.015;

        /* Nozzle light pulses */
        nozzleLight.intensity = 2.5 + Math.sin(t * 6.5) * 0.5;

        /* Printer auto-rotate + mouse tilt */
        cxX += (txX - cxX) * 0.05;
        cxY += (txY - cxY) * 0.05;
        root.rotation.y = t * 0.16 + cxY;
        root.rotation.x = cxX;
        platGrp.rotation.y = t * 0.11;
        coneGrp.rotation.y = t * 0.07;

        /* HUD rings rotate */
        hudRings.forEach(function (r) {
            r.mesh.rotation.x += r.sx * 0.007;
            r.mesh.rotation.y += r.sy * 0.007;
            r.mesh.rotation.z += r.sz * 0.007;
        });

        /* Scan sweep */
        scanPos += scanDir * 0.028;
        if (scanPos > 4.0) scanDir = -1;
        if (scanPos < -1.8) scanDir = 1;
        scanM.position.y = scanPos;
        trailM.position.y = scanPos - scanDir * 0.12;

        /* Lights breathe */
        lt1.intensity = 5.0 + Math.sin(t * 0.75) * 0.65;
        lt2.intensity = 3.0 + Math.sin(t * 0.55 + 1) * 0.45;

        /* Particles rise */
        var pa = pGeo.attributes.position.array;
        for (var pi = 0; pi < NP; pi++) {
            pa[pi * 3 + 1] += pVely[pi];
            if (pa[pi * 3 + 1] > 4.05) {
                var pp = cpt(0);
                pa[pi * 3] = pp.x;
                pa[pi * 3 + 1] = -1.82;
                pa[pi * 3 + 2] = pp.z;
                pVely[pi] = 0.008 + Math.random() * 0.015;
            }
        }
        pGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
})();
