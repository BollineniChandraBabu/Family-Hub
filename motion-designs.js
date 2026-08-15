(() => {
  const themeMap = {
    blossom: { colors: ['255, 189, 204', '255, 225, 173', '255, 247, 214'], mode: 'wave', speed: '17s' },
    starlight: { colors: ['174, 212, 255', '199, 176, 255', '255, 226, 170'], mode: 'orbit', speed: '19s' },
    lotus: { colors: ['227, 124, 145', '255, 191, 164', '255, 233, 198'], mode: 'cascade', speed: '20s' },
    aurora: { colors: ['161, 225, 206', '176, 214, 255', '255, 219, 179'], mode: 'wave', speed: '22s' },
    midnight: { colors: ['159, 141, 255', '123, 188, 255', '255, 199, 222'], mode: 'orbit', speed: '24s' },
    confetti: { colors: ['255, 183, 77', '120, 202, 255', '157, 231, 188'], mode: 'cascade', speed: '16s' },
    calm: { colors: ['177, 194, 255', '255, 178, 219', '196, 228, 255'], mode: 'wave', speed: '26s' },
    ember: { colors: ['255, 164, 142', '255, 214, 141', '245, 175, 197'], mode: 'cascade', speed: '18s' }
  };

  const metaTheme = document.querySelector('meta[name="motion-theme"]')?.content?.trim();
  const selected = themeMap[metaTheme] ? metaTheme : 'blossom';
  const theme = themeMap[selected];

  const root = document.documentElement;
  root.style.setProperty('--motion-a', theme.colors[0]);
  root.style.setProperty('--motion-b', theme.colors[1]);
  root.style.setProperty('--motion-c', theme.colors[2]);
  root.style.setProperty('--motion-speed', theme.speed);

  document.body.classList.add('motion-enhanced', `motion-mode-${theme.mode}`);

  const stage = document.createElement('div');
  stage.className = 'motion-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = `
    <div class="motion-ribbon"></div>
    <div class="motion-grain"></div>
    <div class="motion-depth">
      <div class="motion-depth-layer layer-1"></div>
      <div class="motion-depth-layer layer-2"></div>
      <div class="motion-depth-layer layer-3"></div>
    </div>
  `;
  document.body.prepend(stage);

  const scrollBar = document.createElement('div');
  scrollBar.className = 'motion-scrollbar';
  document.body.appendChild(scrollBar);

  const revealSelectors = [
    'h1', 'h2', 'h3', '.hero-title', '.title', '.headline', '.subtitle',
    '.card', '.panel', '.tile', '.memory-card', '.timeline-item', '.quote',
    '.cta', '.section', '.content p', 'li'
  ];
  const revealTargets = document.querySelectorAll(revealSelectors.join(', '));
  revealTargets.forEach((el, index) => {
    if (el.closest('#loader') || el.classList.contains('motion-reveal')) return;
    if (index % 2 === 0 || /H[1-3]/.test(el.tagName)) {
      el.classList.add('motion-reveal');
      el.style.transitionDelay = `${Math.min(index * 30, 420)}ms`;
    }
  });

  const depthTargets = document.querySelectorAll('.hero, .hero h1, .hero h2, .hero .subtitle, .card, .panel, .tile, .memory-card, article');
  depthTargets.forEach((el, i) => {
    if (i > 20) return;
    el.classList.add('motion-3d');
    if (i % 3 === 0) {
      el.dataset.depth = 'near';
    } else if (i % 3 === 1) {
      el.dataset.depth = 'mid';
    } else {
      el.dataset.depth = 'far';
    }
  });

  const floatTargets = document.querySelectorAll('.hero img, .hero svg, .hero .badge, .hero .chip, .hero .tag, .hero .pill');
  floatTargets.forEach((el, i) => {
    if (i < 8) el.classList.add('motion-float');
  });

  const glowTargets = document.querySelectorAll('button, .btn, .button, .cta, a[class*="btn"], .hero h1, .hero h2');
  glowTargets.forEach((el, i) => {
    if (i < 12) el.classList.add('motion-glow');
  });

  const tiltTargets = document.querySelectorAll('.card, .panel, .tile, .memory-card, article');
  tiltTargets.forEach((el, i) => {
    if (i > 16) return;
    el.classList.add('motion-tilt');

    el.addEventListener('mousemove', (event) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * 8;
      const ry = (px - 0.5) * 8;
      el.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-2px)`;
      el.classList.add('active');
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.classList.remove('active');
    });
  });

  const updateMouseDepth = (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;
    root.style.setProperty('--mx', x.toFixed(4));
    root.style.setProperty('--my', y.toFixed(4));
  };
  window.addEventListener('mousemove', updateMouseDepth, { passive: true });

  const updateScrollBar = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    scrollBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  };
  window.addEventListener('scroll', updateScrollBar, { passive: true });
  updateScrollBar();

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });

    document.querySelectorAll('.motion-reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.motion-reveal').forEach((el) => el.classList.add('motion-in'));
  }
})();
