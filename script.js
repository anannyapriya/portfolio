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
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    show();
    let idx = 0;
    const perFrame = Math.max(1, Math.ceil(pixels.length / 100));

    function step() {
      for (let i = 0; i < perFrame && idx < pixels.length; i++, idx++) {
        ctx.clearRect(pixels[idx].x, pixels[idx].y, SIZE, SIZE);
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

const COLORS = ['#3B82F6','#8B5CF6','#EC4899','#06B6D4'];

class Particle {
  constructor() { this.reset(true); }
  reset(init = false) {
    this.x  = Math.random() * pCanvas.width;
    this.y  = init ? Math.random() * pCanvas.height : pCanvas.height + 10;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = -(Math.random() * 0.4 + 0.1);
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
    if (this.life > this.maxLife || this.y < -10) this.reset();
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
  const MAX_DIST = 90;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx   = particles[i].x - particles[j].x;
      const dy   = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DIST) {
        pCtx.save();
        pCtx.globalAlpha = (1 - dist / MAX_DIST) * 0.1;
        pCtx.strokeStyle = '#8B5CF6';
        pCtx.lineWidth   = 0.6;
        pCtx.beginPath();
        pCtx.moveTo(particles[i].x, particles[i].y);
        pCtx.lineTo(particles[j].x, particles[j].y);
        pCtx.stroke();
        pCtx.restore();
      }
    }
  }
}

function startParticles() {
  pCanvas.width  = window.innerWidth;
  pCanvas.height = window.innerHeight;
  particles = Array.from({ length: 100 }, () => new Particle());

  function loop() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    drawConnections();
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
