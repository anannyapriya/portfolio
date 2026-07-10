'use strict';

/* ════════════════════════════════════════════════
   PIXEL TRANSITION
════════════════════════════════════════════════ */
const PixelTransition = (() => {
  const canvas = document.getElementById('transition-canvas');
  const ctx    = canvas.getContext('2d');
  const SIZE   = 22;
  let   pixels = [];
  let   raf    = null;

  function buildGrid() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.ceil(canvas.width  / SIZE);
    const rows = Math.ceil(canvas.height / SIZE);
    pixels = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        pixels.push({ x: c * SIZE, y: r * SIZE });
    // Fisher-Yates shuffle
    for (let i = pixels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pixels[i], pixels[j]] = [pixels[j], pixels[i]];
    }
  }

  function show()  { canvas.style.display = 'block'; canvas.style.opacity = '1'; canvas.style.pointerEvents = 'all'; }
  function fadeOut(cb) {
    canvas.style.transition = 'opacity 0.45s';
    canvas.style.opacity    = '0';
    setTimeout(() => {
      canvas.style.display = 'none';
      canvas.style.transition = '';
      canvas.style.pointerEvents = 'none';
      if (cb) cb();
    }, 460);
  }

  function toDark(onDone) {
    if (raf) cancelAnimationFrame(raf);
    buildGrid();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    show();
    let idx = 0;
    const perFrame = Math.max(1, Math.ceil(pixels.length / 100));
    const DARK_COLORS = ['#050510','#060612','#070714','#05050F'];

    function step() {
      for (let i = 0; i < perFrame && idx < pixels.length; i++, idx++) {
        ctx.fillStyle = DARK_COLORS[idx % DARK_COLORS.length];
        ctx.fillRect(pixels[idx].x, pixels[idx].y, SIZE, SIZE);
      }
      if (idx < pixels.length) {
        raf = requestAnimationFrame(step);
      } else {
        onDone();
        setTimeout(() => fadeOut(), 80);
      }
    }
    raf = requestAnimationFrame(step);
  }

  function toLight(onDone) {
    if (raf) cancelAnimationFrame(raf);
    buildGrid();
    // Start transparent so the dark page shows, then build up white pixels
    // over it so the reveal to the white page is seamless (no hard swap).
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    show();
    let idx = 0;
    const perFrame = Math.max(1, Math.ceil(pixels.length / 100));
    const LIGHT_COLORS = ['#FFFFFF','#FAFAFC','#F5F5FA','#FDFDFF'];

    function step() {
      for (let i = 0; i < perFrame && idx < pixels.length; i++, idx++) {
        ctx.fillStyle = LIGHT_COLORS[idx % LIGHT_COLORS.length];
        ctx.fillRect(pixels[idx].x, pixels[idx].y, SIZE, SIZE);
      }
      if (idx < pixels.length) {
        raf = requestAnimationFrame(step);
      } else {
        onDone();
        setTimeout(() => fadeOut(), 80);
      }
    }
    raf = requestAnimationFrame(step);
  }

  return { toDark, toLight };
})();


/* ════════════════════════════════════════════════
   PAGE SWITCHING
════════════════════════════════════════════════ */
const pageLight = document.getElementById('page-light');
const pageDark  = document.getElementById('page-dark');

document.getElementById('enterDark').addEventListener('click', () => {
  PixelTransition.toDark(() => {
    pageLight.classList.add('hidden');
    pageDark.classList.remove('hidden');
    document.body.style.background = '#050510';
    window.scrollTo({ top: 0 });
    startParticles();
    initDarkObserver();
    startTypewriter();
  });
});

document.getElementById('exitDark').addEventListener('click', () => {
  PixelTransition.toLight(() => {
    pageDark.classList.add('hidden');
    pageLight.classList.remove('hidden');
    document.body.style.background = '#FFFFFF';
    window.scrollTo({ top: 0 });
    stopParticles();
  });
});


/* ════════════════════════════════════════════════
   PARTICLE BACKGROUND
════════════════════════════════════════════════ */
const pCanvas = document.getElementById('particles-canvas');
const pCtx    = pCanvas.getContext('2d');
let   pRaf    = null;
let   particles = [];
let   constellationPhase = 0; // drives the traveling glow along connection lines
let   jumps = [];             // "electron jumps" arcing between distant constellations

const COLORS = ['#3B82F6','#8B5CF6','#EC4899','#06B6D4'];

class Particle {
  constructor() { this.reset(true); }
  reset() {
    // Spawn anywhere on the page and drift in any direction so the
    // particle field fills the whole screen, not just the bottom.
    this.x  = Math.random() * pCanvas.width;
    this.y  = Math.random() * pCanvas.height;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.r  = Math.random() * 1.5 + 0.4;
    this.alpha = Math.random() * 0.55 + 0.1;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.life  = 0;
    this.maxLife = 300 + Math.random() * 200;
  }
  update() {
    this.x   += this.vx;
    this.y   += this.vy;
    this.life++;
    if (this.life > this.maxLife ||
        this.x < -10 || this.x > pCanvas.width + 10 ||
        this.y < -10 || this.y > pCanvas.height + 10) this.reset();
  }
  draw() {
    pCtx.save();
    pCtx.globalAlpha = this.alpha * (1 - this.life / this.maxLife);
    pCtx.fillStyle   = this.color;
    pCtx.shadowColor = this.color;
    pCtx.shadowBlur  = 4;
    pCtx.beginPath();
    pCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    pCtx.fill();
    pCtx.restore();
  }
}

function drawConnections() {
  const MAX_DIST = 130;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx   = particles[i].x - particles[j].x;
      const dy   = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DIST) {
        const x1 = particles[i].x, y1 = particles[i].y;
        const x2 = particles[j].x, y2 = particles[j].y;
        const strength = 1 - dist / MAX_DIST;
        const baseA = strength * 0.07;   // faint constant body of the line
        const peakA = strength * 0.22;   // bright travelling highlight

        // Highlight position (0→1) travelling along the line, with a
        // per-pair offset so lines illuminate out of sync.
        let p = (constellationPhase + (i * 7 + j * 13) * 0.0007) % 1;
        if (p < 0) p += 1;
        p = Math.min(0.999, Math.max(0.001, p));

        const grad = pCtx.createLinearGradient(x1, y1, x2, y2);
        const lo = Math.max(0, p - 0.18);
        const hi = Math.min(1, p + 0.18);
        grad.addColorStop(0, `rgba(139,92,246,${baseA})`);
        if (lo > 0) grad.addColorStop(lo, `rgba(139,92,246,${baseA})`);
        grad.addColorStop(p, `rgba(190,160,255,${peakA})`);
        if (hi < 1) grad.addColorStop(hi, `rgba(139,92,246,${baseA})`);
        grad.addColorStop(1, `rgba(139,92,246,${baseA})`);

        pCtx.save();
        pCtx.strokeStyle = grad;
        pCtx.lineWidth   = 0.65;
        pCtx.beginPath();
        pCtx.moveTo(x1, y1);
        pCtx.lineTo(x2, y2);
        pCtx.stroke();
        pCtx.restore();
      }
    }
  }
}

// Occasionally launch a glowing pulse that leaves its cluster and arcs
// over to a particle in a different, distant constellation — like an
// electron jumping orbits.
function spawnJump() {
  if (particles.length < 2 || jumps.length >= 4) return;
  const from = Math.floor(Math.random() * particles.length);
  let to = -1;
  for (let tries = 0; tries < 12; tries++) {
    const cand = Math.floor(Math.random() * particles.length);
    if (cand === from) continue;
    const dx = particles[cand].x - particles[from].x;
    const dy = particles[cand].y - particles[from].y;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d > 160 && d < 440) { to = cand; break; } // far = a different cluster
  }
  if (to < 0) return;
  jumps.push({
    from, to,
    t: 0,
    speed: 0.011 + Math.random() * 0.009,
    curve: (Math.random() - 0.5) * 0.4,        // arc bow amount
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  });
}

function drawJumps() {
  for (let k = jumps.length - 1; k >= 0; k--) {
    const j = jumps[k];
    const a = particles[j.from], b = particles[j.to];
    if (!a || !b) { jumps.splice(k, 1); continue; }
    j.t += j.speed;
    if (j.t >= 1) { jumps.splice(k, 1); continue; }

    const t = j.t, it = 1 - t;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len, py = dx / len;            // perpendicular for the arc
    const cx = (a.x + b.x) / 2 + px * j.curve * len;
    const cy = (a.y + b.y) / 2 + py * j.curve * len;

    // Head position along the quadratic arc
    const x = it * it * a.x + 2 * it * t * cx + t * t * b.x;
    const y = it * it * a.y + 2 * it * t * cy + t * t * b.y;
    const fade = Math.sin(Math.PI * t);            // fade in then out

    pCtx.save();
    // Faint arc trail
    pCtx.globalAlpha = 0.18 * fade;
    pCtx.strokeStyle = j.color;
    pCtx.lineWidth = 0.7;
    pCtx.beginPath();
    pCtx.moveTo(a.x, a.y);
    pCtx.quadraticCurveTo(cx, cy, b.x, b.y);
    pCtx.stroke();

    // Glowing travelling head
    pCtx.globalAlpha = fade;
    pCtx.shadowColor = j.color;
    pCtx.shadowBlur = 8;
    pCtx.fillStyle = '#EAF2FF';
    pCtx.beginPath();
    pCtx.arc(x, y, 1.7, 0, Math.PI * 2);
    pCtx.fill();
    pCtx.restore();
  }
}

function startParticles() {
  pCanvas.width  = window.innerWidth;
  pCanvas.height = window.innerHeight;
  particles = Array.from({ length: 150 }, () => new Particle());
  jumps = [];

  function loop() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    constellationPhase = (constellationPhase + 0.0022) % 1; // travel speed of the glow
    drawConnections();
    if (Math.random() < 0.02) spawnJump();                  // occasional electron jump
    drawJumps();
    particles.forEach(p => { p.update(); p.draw(); });
    pRaf = requestAnimationFrame(loop);
  }
  loop();
}

function stopParticles() {
  if (pRaf) { cancelAnimationFrame(pRaf); pRaf = null; }
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
}

window.addEventListener('resize', () => {
  if (!pageDark.classList.contains('hidden')) {
    pCanvas.width  = window.innerWidth;
    pCanvas.height = window.innerHeight;
  }
});


/* ════════════════════════════════════════════════
   TYPEWRITER
════════════════════════════════════════════════ */
const ROLES = [
  'Full Stack Developer',
  'Creative Technologist',
  'UI/UX Enthusiast',
  'Open Source Builder',
];

function startTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  let roleIdx = 0, charIdx = 0, deleting = false;

  function tick() {
    const role = ROLES[roleIdx];
    if (!deleting) {
      el.textContent = role.slice(0, ++charIdx);
      if (charIdx === role.length) {
        deleting = true;
        setTimeout(tick, 1800);
        return;
      }
    } else {
      el.textContent = role.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        roleIdx  = (roleIdx + 1) % ROLES.length;
        setTimeout(tick, 300);
        return;
      }
    }
    setTimeout(tick, deleting ? 45 : 80);
  }
  tick();
}


/* ════════════════════════════════════════════════
   TILT EFFECT (dark cards)
════════════════════════════════════════════════ */
function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);
      el.style.transform = `perspective(600px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg) scale3d(1.02,1.02,1.02)`;

      const glow = el.querySelector('.d-card__glow, .d-project-card__glow, .d-hobby-card__glow');
      if (glow) {
        const px = ((e.clientX - rect.left) / rect.width)  * 100;
        const py = ((e.clientY - rect.top)  / rect.height) * 100;
        glow.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(139,92,246,0.25), transparent 65%)`;
      }
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      const glow = el.querySelector('.d-card__glow, .d-project-card__glow, .d-hobby-card__glow');
      if (glow) glow.style.background = '';
    });
  });
}


/* ════════════════════════════════════════════════
   SCROLL REVEAL
════════════════════════════════════════════════ */
function initLightObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = `${i * 0.07}s`;
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('#page-light .reveal').forEach(el => obs.observe(el));
}

function initDarkObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = `${i * 0.08}s`;
        e.target.classList.add('visible');

        // Animate progress bars when education card visible
        const bar = e.target.querySelector('.d-bar__fill');
        if (bar) setTimeout(() => bar.classList.add('animate'), 400);

        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('#page-dark .d-reveal').forEach(el => obs.observe(el));
  initTilt();
}


/* ════════════════════════════════════════════════
   LIGHT NAV SCROLL EFFECT
════════════════════════════════════════════════ */
const lNav = document.getElementById('l-nav');
window.addEventListener('scroll', () => {
  lNav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });


/* ════════════════════════════════════════════════
   HAMBURGER MENUS
════════════════════════════════════════════════ */
document.getElementById('lHamburger').addEventListener('click', () => {
  document.querySelector('.l-nav__links').classList.toggle('open');
});

document.getElementById('dHamburger').addEventListener('click', () => {
  document.getElementById('d-nav-links').classList.toggle('open');
});

// Close mobile menu on link click
document.querySelectorAll('.l-nav__links a').forEach(a => {
  a.addEventListener('click', () => document.querySelector('.l-nav__links').classList.remove('open'));
});
document.querySelectorAll('.d-nav__links a, .d-nav__exit-btn').forEach(a => {
  a.addEventListener('click', () => document.getElementById('d-nav-links').classList.remove('open'));
});


/* ════════════════════════════════════════════════
   SMOOTH SCROLL (override anchor jumps)
════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


/* ════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════ */
initLightObserver();
