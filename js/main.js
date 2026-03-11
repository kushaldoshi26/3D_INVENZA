/* ============================================
   3D INVENZA — JavaScript
   Cursor, scroll reveals, UI interactions
   NOTE: Particles handled by particle-morph.js
   ============================================ */

// ─── Custom Cursor ────────────────────────────
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

if (dot && ring) {
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });
  (function animRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(animRing);
  })();
  document.querySelectorAll('a, button, .tilt-card, .step-card, .stat-card, .product-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
  });
}

// ─── Navbar scroll effect ────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ─── Mobile nav toggle ──────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => navLinks.classList.remove('open')));
}

// ─── Scroll Reveal ─────────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObs.unobserve(entry.target); }
  });
}, { threshold: 0.05, rootMargin: '0px 0px 80px 0px' });
document.querySelectorAll('.reveal-item').forEach(el => revealObs.observe(el));

// Fallback: reveal all items after 800ms (catches above-fold and screenshot scenarios)
setTimeout(() => {
  document.querySelectorAll('.reveal-item:not(.visible)').forEach(el => el.classList.add('visible'));
}, 800);

// ─── Counter Animation ──────────────────────────
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.dataset.count);
      let current = 0;
      const step = Math.ceil(target / 60);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        entry.target.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 20);
      counterObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-number[data-count]').forEach(c => counterObs.observe(c));

// ─── Hero entrance animation ───────────────────
const heroContent = document.getElementById('heroContent');
const heroVisual = document.getElementById('heroVisual');
if (heroContent) {
  heroContent.style.opacity = '0';
  heroContent.style.transform = 'translateY(30px)';
  heroContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  setTimeout(() => { heroContent.style.opacity = '1'; heroContent.style.transform = 'none'; }, 300);
}
// heroVisual (Three.js canvas) — no opacity animation, always visible

// ─── Tilt cards on hover ────────────────────────
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    card.style.transform = `perspective(600px) rotateX(${-y / 20}deg) rotateY(${x / 20}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => card.style.transform = '');
});

// ─── Material selection buttons ─────────────────
document.querySelectorAll('.mat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ─── Range sliders ──────────────────────────────
document.querySelectorAll('.range-input').forEach(input => {
  const update = () => {
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty('--val', pct + '%');
    const label = input.closest('.control-row')?.querySelector('label span');
    if (label) label.textContent = input.value + (input.dataset.unit || '');
  };
  input.addEventListener('input', update);
  update();
});

// ─── Dashboard layer slider ─────────────────────
const layerSlider = document.getElementById('layerSlider');
const layerVal = document.getElementById('layerVal');
if (layerSlider && layerVal) {
  layerSlider.addEventListener('input', () => { layerVal.textContent = layerSlider.value; });
}

// ─── Footer clock ─────────────────────────────────
function updateClock() {
  const els = document.querySelectorAll('#sysClock');
  const now = new Date();
  const t = now.toTimeString().slice(0,8);
  els.forEach(el => el && (el.textContent = t));
}
updateClock();
setInterval(updateClock, 1000);

// ─── JARVIS boot overlay dismiss ─────────────────
const bootOverlay = document.getElementById('jarvisBootOverlay');
if (bootOverlay) {
  setTimeout(() => {
    bootOverlay.classList.add('fade-out');
    setTimeout(() => { bootOverlay.style.display = 'none'; }, 700);
  }, 1800);
}

// ─── Data stream background text ─────────────────
const dataStream = document.getElementById('dataStream');
if (dataStream) {
  const chars = '01';
  let s = '';
  for (let i = 0; i < 3000; i++) s += chars[Math.floor(Math.random() * chars.length)] + (Math.random() > 0.5 ? ' ' : '');
  dataStream.textContent = s;
}

console.log('%c3D INVENZA', 'color:#00f5ff;font-family:monospace;font-size:20px;font-weight:bold');
console.log('%cHolographic Engine v4.2.1 — Online', 'color:#7c3aed;font-family:monospace;font-size:11px');
