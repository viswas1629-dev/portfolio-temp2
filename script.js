/* ==========================================================================
   KARUPPASAMI KASIVISVANATHAN — PORTFOLIO
   Vanilla JS — no frameworks, no dependencies.

   Table of contents:
   1.  Config & state
   2.  Utilities
   3.  Preloader
   4.  Custom cursor
   5.  Scroll progress
   6.  Ambient particle system (canvas)
   7.  Scroll reveal (IntersectionObserver)
   8.  Navigation (scroll state, mobile menu, active link, smooth scroll)
   9.  Card tilt + spotlight (projects)
   10. Magnetic buttons
   11. Hero code-window typing animation
   12. Misc (footer year, back-to-top)
   13. Init
   ========================================================================== */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONFIG & STATE
     ========================================================================== */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches && !('ontouchstart' in window);
  const isSmallScreen = window.matchMedia('(max-width: 640px)').matches;

  /* ==========================================================================
     2. UTILITIES
     ========================================================================== */
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const lerp = (a, b, t) => a + (b - a) * t;

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /* ==========================================================================
     3. PRELOADER
     ========================================================================== */
  function initPreloader() {
    const preloader = document.getElementById('preloader');
    const fill = document.getElementById('preloaderFill');
    const count = document.getElementById('preloaderCount');
    if (!preloader) return;

    document.body.classList.add('is-loading');

    let progress = 0;
    const duration = prefersReducedMotion ? 200 : 1700;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      // Ease-out progress curve so the counter feels responsive, not linear
      const t = clamp(elapsed / duration, 0, 1);
      progress = Math.round((1 - Math.pow(1 - t, 3)) * 100);
      fill.style.width = progress + '%';
      count.textContent = progress + '%';

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        finishLoading();
      }
    }

    function finishLoading() {
      setTimeout(() => {
        preloader.classList.add('is-hidden');
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-loaded');
        // Kick off the hero reveal + code-window typing once the stage is visible
        window.dispatchEvent(new CustomEvent('site:loaded'));
        setTimeout(() => preloader.remove(), 800);
      }, 250);
    }

    requestAnimationFrame(tick);
  }

  /* ==========================================================================
     4. CUSTOM CURSOR
     ========================================================================== */
  function initCustomCursor() {
    if (!isFinePointer || prefersReducedMotion) return;

    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;

    document.body.classList.add('has-custom-cursor');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0)`;
    }, { passive: true });

    // Ring trails the dot with easing for a smooth, weighted feel
    function animateRing() {
      ringX = lerp(ringX, mouseX, 0.18);
      ringY = lerp(ringY, mouseY, 0.18);
      ring.style.transform = `translate3d(${ringX - 19}px, ${ringY - 19}px, 0)`;
      requestAnimationFrame(animateRing);
    }
    requestAnimationFrame(animateRing);

    // Enlarge the ring over interactive elements
    const hoverables = document.querySelectorAll('[data-cursor-hover]');
    hoverables.forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hovering'));
    });

    // Hide cursor visuals when the pointer leaves the viewport
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity = '';
      ring.style.opacity = '';
    });
  }

  /* ==========================================================================
     5. SCROLL PROGRESS
     ========================================================================== */
  function initScrollProgress() {
    const fill = document.getElementById('scrollProgressFill');
    if (!fill) return;

    let ticking = false;
    function update() {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const pct = height > 0 ? (scrollTop / height) * 100 : 0;
      fill.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ==========================================================================
     6. AMBIENT PARTICLE SYSTEM (canvas)
     ========================================================================== */
  function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height, particles;
    let running = true;

    const colors = ['79,127,255', '37,224,208', '163,92,255'];

    function particleCount() {
      if (prefersReducedMotion) return 0;
      if (isSmallScreen) return 22;
      if (window.innerWidth < 1024) return 40;
      return 65;
    }

    function resize() {
      width = canvas.width = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
      height = canvas.height = window.innerHeight * Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }

    function makeParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.6,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
      };
    }

    function seed() {
      const n = particleCount();
      particles = Array.from({ length: n }, makeParticle);
    }

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges so the field feels continuous
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${p.color}, .8)`;
        ctx.shadowBlur = 6;
        ctx.fill();
      });

      requestAnimationFrame(step);
    }

    resize();
    seed();
    if (particleCount() > 0) requestAnimationFrame(step);

    // Pause the loop when the tab is hidden to save CPU/battery
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(step);
    });

    window.addEventListener('resize', debounce(() => {
      resize();
      seed();
    }, 250));
  }

  /* ==========================================================================
     7. SCROLL REVEAL (IntersectionObserver)
     ========================================================================== */
  function initScrollReveal() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    // Apply any per-element stagger delay from data-delay (ms) as a CSS custom property
    targets.forEach((el) => {
      const delay = el.getAttribute('data-delay');
      if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
    });

    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px',
    });

    targets.forEach((el) => observer.observe(el));
  }

  /* ==========================================================================
     8. NAVIGATION
     ========================================================================== */
  function initNav() {
    const nav = document.getElementById('siteNav');
    const burger = document.getElementById('navBurger');
    const links = document.getElementById('navLinks');
    if (!nav) return;

    // Add / remove the glass background once the page has scrolled past the hero
    let ticking = false;
    function onScroll() {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    onScroll();

    // Mobile menu toggle
    if (burger && links) {
      burger.addEventListener('click', () => {
        const isOpen = links.classList.toggle('is-open');
        burger.classList.toggle('is-open', isOpen);
        burger.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      links.querySelectorAll('.nav__link').forEach((link) => {
        link.addEventListener('click', () => {
          links.classList.remove('is-open');
          burger.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
    }

    // Highlight the nav link for the section currently in view
    const sections = document.querySelectorAll('main section[id]');
    const navLinkMap = new Map();
    document.querySelectorAll('.nav__link').forEach((link) => {
      navLinkMap.set(link.getAttribute('href').replace('#', ''), link);
    });

    if (sections.length) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const link = navLinkMap.get(entry.target.id);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinkMap.forEach((l) => l.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

      sections.forEach((s) => sectionObserver.observe(s));
    }
  }

  /* ==========================================================================
     9. CARD TILT + SPOTLIGHT (project cards)
     ========================================================================== */
  function initTiltCards() {
    if (!isFinePointer || prefersReducedMotion) return;

    const cards = document.querySelectorAll('[data-tilt]');
    const MAX_TILT = 7; // degrees — kept subtle for a premium, not gimmicky, feel

    cards.forEach((card) => {
      function onMove(e) {
        const rect = card.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;

        const rotateY = (relX - 0.5) * (MAX_TILT * 2);
        const rotateX = (0.5 - relY) * (MAX_TILT * 2);

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        card.style.setProperty('--mx', `${relX * 100}%`);
        card.style.setProperty('--my', `${relY * 100}%`);
      }

      function onLeave() {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      }

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  /* ==========================================================================
     10. MAGNETIC BUTTONS
     ========================================================================== */
  function initMagneticButtons() {
    if (!isFinePointer || prefersReducedMotion) return;

    const buttons = document.querySelectorAll('[data-magnetic]');
    const STRENGTH = 0.35;

    buttons.forEach((btn) => {
      function onMove(e) {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = `translate(${relX * STRENGTH}px, ${relY * STRENGTH}px)`;
      }
      function onLeave() {
        btn.style.transform = 'translate(0, 0)';
      }
      btn.addEventListener('mousemove', onMove);
      btn.addEventListener('mouseleave', onLeave);
    });
  }

  /* ==========================================================================
     10b. FLOATING WHATSAPP BUTTON — proximity magnet, tilt, click burst
     ========================================================================== */
  function initWaFab() {
    const wrap = document.getElementById('waFab');
    const btn = document.getElementById('waFabBtn');
    if (!wrap || !btn) return;

    if (isFinePointer && !prefersReducedMotion) {
      const RADIUS = 110;
      const STRENGTH = 0.28;

      let targetX = 0, targetY = 0, curX = 0, curY = 0;
      let hoverScale = 1, pressScale = 1, curScale = 1;

      window.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < RADIUS) {
          const pull = (1 - dist / RADIUS) * STRENGTH;
          targetX = dx * pull;
          targetY = dy * pull;
        } else {
          targetX = 0;
          targetY = 0;
        }
      }, { passive: true });

      wrap.addEventListener('mouseenter', () => { hoverScale = 1.08; });
      wrap.addEventListener('mouseleave', () => { hoverScale = 1; });
      btn.addEventListener('mousedown', () => { pressScale = 0.9; });
      window.addEventListener('mouseup', () => { pressScale = 1; });

      (function tick() {
        curX = lerp(curX, targetX, 0.18);
        curY = lerp(curY, targetY, 0.18);
        curScale = lerp(curScale, hoverScale * pressScale, 0.22);
        const rotX = clamp(-curY * 0.35, -9, 9);
        const rotY = clamp(curX * 0.35, -9, 9);
        btn.style.transform =
          `translate(${curX.toFixed(2)}px, ${curY.toFixed(2)}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${curScale.toFixed(3)})`;
        requestAnimationFrame(tick);
      })();
    }

    btn.addEventListener('click', () => {
      wrap.classList.remove('is-clicked');
      void wrap.offsetWidth;
      wrap.classList.add('is-clicked');
      if (!prefersReducedMotion) spawnBurst(wrap);
      setTimeout(() => wrap.classList.remove('is-clicked'), 700);
    });

    function spawnBurst(container) {
      const host = document.createElement('span');
      host.className = 'wa-fab__burst';
      host.setAttribute('aria-hidden', 'true');
      const count = 8;
      for (let i = 0; i < count; i++) {
        const bit = document.createElement('i');
        const angle = (360 / count) * i + (Math.random() * 18 - 9);
        const dist = 44 + Math.random() * 24;
        bit.style.setProperty('--wa-b-angle', angle + 'deg');
        bit.style.setProperty('--wa-b-dist', dist + 'px');
        bit.style.animationDelay = (Math.random() * 50) + 'ms';
        host.appendChild(bit);
      }
      container.appendChild(host);
      setTimeout(() => host.remove(), 760);
    }
  }

  /* ==========================================================================
     11. HERO CODE-WINDOW TYPING ANIMATION
     ========================================================================== */
  function initCodeWindow() {
    const pre = document.getElementById('codeWindowPre');
    if (!pre) return;

    // Token structure keeps syntax highlighting in sync with the typewriter effect
    const lines = [
      [{ t: '// developer.js', c: 'tok-com' }],
      [{ t: 'const ', c: 'tok-key' }, { t: 'developer', c: '' }, { t: ' = {', c: 'tok-punc' }],
      [{ t: '  name: ', c: '' }, { t: "'Karuppasami Kasivisvanathan'", c: 'tok-str' }, { t: ',', c: 'tok-punc' }],
      [{ t: '  role: ', c: '' }, { t: "'Frontend & PHP Web Developer'", c: 'tok-str' }, { t: ',', c: 'tok-punc' }],
      [{ t: '  stack: [', c: 'tok-punc' }, { t: "'HTML', 'CSS', 'JS', 'PHP', 'MySQL'", c: 'tok-str' }, { t: '],', c: 'tok-punc' }],
      [{ t: '  focus: ', c: '' }, { t: "'clean UI, smooth UX'", c: 'tok-str' }, { t: ',', c: 'tok-punc' }],
      [{ t: '  available: ', c: '' }, { t: 'true', c: 'tok-key' }],
      [{ t: '};', c: 'tok-punc' }],
    ];

    // Build the DOM up-front with empty spans, then fill characters over time
    const charQueue = [];
    lines.forEach((line, lineIndex) => {
      const lineEl = document.createElement('div');
      line.forEach((seg) => {
        const span = document.createElement('span');
        if (seg.c) span.className = seg.c;
        lineEl.appendChild(span);
        for (const ch of seg.t) charQueue.push({ span, ch });
      });
      pre.appendChild(lineEl);
      if (lineIndex < lines.length - 1) charQueue.push({ span: null, ch: '\n' });
    });

    const caret = document.createElement('span');
    caret.className = 'caret';
    pre.appendChild(caret);

    if (prefersReducedMotion) {
      charQueue.forEach(({ span, ch }) => { if (span) span.textContent += ch; });
      return;
    }

    // Empty the pre of its pre-built line divs' text (spans already empty) and type in
    let i = 0;
    function typeChar() {
      if (i >= charQueue.length) return;
      const { span, ch } = charQueue[i];
      if (span) span.textContent += ch;
      i++;
      // Slight randomised delay for a natural, human typing cadence
      const delay = ch === ' ' ? 12 : 14 + Math.random() * 22;
      setTimeout(() => requestAnimationFrame(typeChar), delay);
    }

    // Start once the preloader has finished so the animation is seen, not skipped
    window.addEventListener('site:loaded', () => setTimeout(typeChar, 400), { once: true });
  }

  /* ==========================================================================
     11b. CERTIFICATES SHOWCASE — folder-open reveal + button click feedback
     ========================================================================== */
  function initCertGallery() {
    const gallery = document.getElementById('certGallery');
    if (!gallery) return;

    if (prefersReducedMotion) {
      gallery.classList.add('is-open');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          gallery.classList.add('is-open');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });

    observer.observe(gallery);
  }

  function initCertButtons() {
    const buttons = document.querySelectorAll('.cert-card__btn');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (prefersReducedMotion) return;

        const rect = btn.getBoundingClientRect();
        const hasPointerCoords = e.clientX || e.clientY;
        const x = hasPointerCoords ? e.clientX - rect.left : rect.width / 2;
        const y = hasPointerCoords ? e.clientY - rect.top : rect.height / 2;

        const ripple = document.createElement('span');
        ripple.className = 'cert-card__ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        btn.appendChild(ripple);

        btn.classList.add('is-flashing');
        setTimeout(() => {
          ripple.remove();
          btn.classList.remove('is-flashing');
        }, 550);
      });
    });
  }

  /* ==========================================================================
     12. MISC
     ========================================================================== */
  function initMisc() {
    const yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    }

    // Smooth scroll for in-page anchor links, accounting for the fixed nav height
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const navHeight = document.getElementById('siteNav')?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight + 1;
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ==========================================================================
     13. INIT
     ========================================================================== */
  function init() {
    initPreloader();
    initCustomCursor();
    initScrollProgress();
    initParticles();
    initScrollReveal();
    initNav();
    initTiltCards();
    initMagneticButtons();
    initCodeWindow();
    initCertGallery();
    initCertButtons();
    initMisc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();