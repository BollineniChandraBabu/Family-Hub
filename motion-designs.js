(() => {
  const themeMap = {
    blossom: ['255, 189, 204', '255, 225, 173', '255, 247, 214'],
    starlight: ['174, 212, 255', '199, 176, 255', '255, 226, 170'],
    saffron: ['255, 198, 111', '255, 149, 124', '255, 236, 184'],
    lotus: ['227, 124, 145', '255, 191, 164', '255, 233, 198'],
    aurora: ['161, 225, 206', '176, 214, 255', '255, 219, 179'],
    midnight: ['159, 141, 255', '123, 188, 255', '255, 199, 222'],
    confetti: ['255, 183, 77', '120, 202, 255', '157, 231, 188'],
    calm: ['177, 194, 255', '255, 178, 219', '196, 228, 255'],
    ember: ['255, 164, 142', '255, 214, 141', '245, 175, 197']
  };

  const metaTheme = document.querySelector('meta[name="motion-theme"]')?.content?.trim();
  const selected = themeMap[metaTheme] ? metaTheme : 'blossom';
  const [a, b, c] = themeMap[selected];

  const root = document.documentElement;
  root.style.setProperty('--motion-a', a);
  root.style.setProperty('--motion-b', b);
  root.style.setProperty('--motion-c', c);

  document.body.classList.add('motion-enhanced');

  const stage = document.createElement('div');
  stage.className = 'motion-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = '<div class="motion-ribbon"></div>';
  document.body.prepend(stage);

  const revealTargets = document.querySelectorAll('h1, h2, h3, p, .card, .panel, .tile, .section, .memory-card, .timeline-item, .quote, .cta, li');
  revealTargets.forEach((el, index) => {
    if (el.closest('#loader') || el.classList.contains('motion-reveal')) return;
    if (index % 2 === 0 || el.tagName === 'H1') {
      el.classList.add('motion-reveal');
      el.style.transitionDelay = `${Math.min(index * 22, 320)}ms`;
    }
  });

  const glowTargets = document.querySelectorAll('img, .btn, button, .hero-title, .title, .headline');
  glowTargets.forEach((el, i) => {
    if (i < 6) el.classList.add('motion-glow');
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('.motion-reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.motion-reveal').forEach((el) => el.classList.add('motion-in'));
  }
})();
