/* Contenido editable en index.html. Este archivo añade idioma e interacciones. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Intro de portada: recap fotográfico → expansión a viewport → barrido → portada existente.
  {
    const intro = document.getElementById('portfolioIntro');
    const deepLink = location.hash && location.hash !== '#top';
    const skipRequested = new URLSearchParams(location.search).has('skipIntro');
    if (intro && !reducedMotion.matches && !deepLink && !skipRequested) {
      const frames = [...intro.querySelectorAll('.intro-window img')];
      const windowEl = intro.querySelector('.intro-window');
      let finished = false;
      const timers = [];
      const later = (callback, ms) => timers.push(window.setTimeout(callback, ms));
      const finish = () => {
        if (finished) return;
        finished = true;
        timers.forEach(clearTimeout);
        document.body.classList.remove('intro-playing');
        intro.remove();
      };
      document.body.classList.add('intro-playing');
      intro.querySelector('.intro-skip')?.addEventListener('click', finish, {once:true});
      // Tiempo 0-1.1 s: nombre solo, sin ventana.
      later(() => {
        intro.classList.add('is-open');
        frames[0]?.classList.add('is-current');
      }, 1100);
      // Recap fotográfico después de abrirse el marco.
      frames.slice(1).forEach((frame, i) => later(() => {
        frames.forEach(item => item.classList.remove('is-current'));
        frame.classList.add('is-current');
      }, 1680 + i * 420));
      // La última fotografía permanece en el marco; barrido directo a la portada.
      later(() => intro.classList.add('is-wiping'), 3230);
      later(finish, 4200);
      later(finish, 5600);
    } else {
      intro?.remove();
    }
  }

  const translations = Array.from(document.querySelectorAll('[data-en]'), el => ({ el, es: el.textContent, en: el.dataset.en }));
  const accessibleLabels = Array.from(document.querySelectorAll('[data-en-label]'), el => ({ el, es: el.getAttribute('aria-label'), en: el.dataset.enLabel }));
  const languageButtons = [document.querySelector('#langToggle'), document.querySelector('#modalLang')].filter(Boolean);
  const pageDescription = document.querySelector('meta[name="description"]');
  const spanishDescription = pageDescription.content;
  let language = 'es';
  // Rebuild line masks after translation and responsive line wrapping.
  const aboutParagraphs = Array.from(document.querySelectorAll('#about .about-copy > p'));
  let aboutRevealed = false;
  const rebuildAboutLines = () => {
    if (!aboutParagraphs.length) return;
    aboutParagraphs.forEach((paragraph, paragraphIndex) => {
      const sentence = paragraph.textContent.trim();
      if (!sentence) return;
      paragraph.classList.remove('about-mask-ready');
      paragraph.textContent = '';
      // Measure natural word wraps with the actual live paragraph width and font.
      const words = sentence.split(/\s+/);
      const probes = words.map((word, i) => {
        const node = document.createElement('span');
        node.className = 'about-measure-word';
        node.textContent = word + (i < words.length - 1 ? ' ' : '');
        paragraph.appendChild(node);
        return node;
      });
      const groups = [];
      probes.forEach(node => {
        const y = Math.round(node.offsetTop);
        const latest = groups[groups.length - 1];
        if (!latest || Math.abs(latest.y - y) > 3) groups.push({ y, words: [node.textContent] });
        else latest.words.push(node.textContent);
      });
      const lines = groups.map(group => group.words.join('').trim());
      paragraph.replaceChildren();
      lines.forEach((line, lineIndex) => {
        const mask = document.createElement('span');
        mask.className = 'about-line-mask';
        const content = document.createElement('span');
        content.className = 'about-line-content';
        content.textContent = line;
        content.style.setProperty('--line-delay', (paragraphIndex * .24 + lineIndex * .105).toFixed(3) + 's');
        mask.appendChild(content);
        paragraph.appendChild(mask);
      });
      paragraph.setAttribute('aria-label', sentence);
      paragraph.classList.add('about-mask-ready');
    });
    if (aboutRevealed) document.querySelector('#about .about-grid')?.classList.add('about-animated-in');
    window.dispatchEvent(new Event('scroll'));
  };
  let aboutResizeTick;
  window.addEventListener('resize', () => {
    clearTimeout(aboutResizeTick);
    aboutResizeTick = setTimeout(rebuildAboutLines, 180);
  }, { passive: true });
  const setLanguage = (next, updateURL = true) => {
    language = next === 'en' ? 'en' : 'es';
    document.documentElement.lang = language;
    translations.forEach(item => { item.el.textContent = item[language]; });
    rebuildAboutLines();
    accessibleLabels.forEach(item => { item.el.setAttribute('aria-label', item[language]); });
    document.querySelectorAll('[data-language]').forEach(el => { el.hidden = el.dataset.language !== language; });
    languageButtons.forEach(button => {
      button.textContent = language === 'es' ? 'EN' : 'ES';
      button.setAttribute('aria-label', language === 'es' ? 'Switch to English' : 'Cambiar a español');
      button.hidden = false;
    });
    document.title = language === 'es' ? 'Irene Sánchez — Diseño Gráfico y Multimedia' : 'Irene Sánchez — Graphic & Multimedia Design';
    pageDescription.content = language === 'es' ? spanishDescription : 'Irene Sánchez’s portfolio: branding, visual identity, editorial design and illustration. Explore NOGUE, GreenO, Starbucks and Polydor.';
    document.querySelector('#copyStatus').textContent = '';
    try { localStorage.setItem('irene-portfolio-language', language); } catch { /* Private mode: the page still works. */ }
    if (updateURL) {
      try {
        const url = new URL(location.href);
        if (language === 'es') url.searchParams.delete('lang'); else url.searchParams.set('lang', 'en');
        history.replaceState(history.state, '', url);
      } catch { /* Some local-file browsers restrict history. */ }
    }
  };
  let initialLanguage = new URLSearchParams(location.search).get('lang');
  if (!['es', 'en'].includes(initialLanguage)) {
    try { initialLanguage = localStorage.getItem('irene-portfolio-language'); } catch { initialLanguage = 'es'; }
  }
  languageButtons.forEach(button => button.addEventListener('click', () => setLanguage(language === 'es' ? 'en' : 'es')));
  setLanguage(initialLanguage, false);

  // About: line-by-line reveal tied continuously to scroll position, not a fast timer.
  const aboutGrid = document.querySelector('#about .about-grid');
  if (aboutGrid && aboutParagraphs.length && !reducedMotion.matches) {
    aboutGrid.classList.add('about-motion-enabled');
    let aboutFrame = 0;
    const clampAbout = value => Math.max(0, Math.min(1, value));
    const renderAboutScroll = () => {
      aboutFrame = 0;
      const rect = aboutGrid.getBoundingClientRect();
      const viewport = window.innerHeight;
      // Start only when the paragraph area reaches the lower-middle of the screen.
      // Complete when the area has moved toward the upper part of the screen.
      const start = viewport * .57;
      const end = viewport * .08;
      const progress = clampAbout((start - rect.top) / (start - end));
      const groups = aboutParagraphs.map(p => [...p.querySelectorAll('.about-line-content')]);
      const firstCount = groups[0]?.length || 1;
      const secondCount = groups[1]?.length || 1;
      groups.forEach((lines, groupIndex) => {
        const from = groupIndex === 0 ? 0 : .48;
        const to = groupIndex === 0 ? .62 : 1;
        const local = clampAbout((progress - from) / (to - from));
        lines.forEach((line, i) => {
          // Each successive line occupies its own portion of the scroll distance.
          const lineProgress = clampAbout(local * (lines.length + .65) - i);
          const eased = 1 - Math.pow(1 - lineProgress, 2);
          line.style.transition = 'none';
          line.style.opacity = String(eased);
          line.style.transform = 'translate3d(0,' + ((1 - eased) * 105).toFixed(2) + '%,0)';
        });
      });
      const photo = aboutGrid.querySelector('.about-photo img');
      if (photo) {
        const photoProgress = clampAbout((progress - .19) / .46);
        const eased = 1 - Math.pow(1 - photoProgress, 2);
        photo.style.transition = 'none';
        photo.style.opacity = String(eased);
        photo.style.transform = 'translate3d(0,' + ((1 - eased) * 28).toFixed(2) + 'px,0)';
      }
    };
    const requestAbout = () => {
      if (!aboutFrame) aboutFrame = requestAnimationFrame(renderAboutScroll);
    };
    window.addEventListener('scroll', requestAbout, { passive: true });
    window.addEventListener('resize', requestAbout, { passive: true });
    window.addEventListener('pageshow', requestAbout);
    requestAbout();
    // Line splitting changes after font load or language/viewport changes.
    document.fonts?.ready.then(requestAbout);
    window.addEventListener('resize', () => setTimeout(requestAbout, 220), { passive: true });
    aboutGrid.addEventListener('pointerenter', requestAbout);
  } else {
    aboutRevealed = true;
    aboutGrid?.classList.add('about-animated-in');
  }

    // Native dialog: Escape, focus trapping and keyboard navigation are handled by the browser.
  // Without dialog support or JavaScript the project articles remain readable on the page.
  const modal = document.querySelector('#projectModal');
  const archive = document.querySelector('#projectArchive');
  const modalContent = document.querySelector('#modalContent');
  const articles = Array.from(archive.querySelectorAll('.project-detail'));
  const supportsDialog = typeof modal.showModal === 'function';
  let currentProject = null;
  let returnFocus = null;
  const clearProjectHash = () => {
    if (location.hash.startsWith('#project-')) {
      try { history.replaceState(history.state, '', location.pathname + location.search + '#works'); } catch { /* Local-file fallback. */ }
    }
  };
  const restoreArticle = () => {
    if (currentProject) {
      currentProject.hidden = true;
      archive.appendChild(currentProject);
      currentProject = null;
    }
    document.body.classList.remove('modal-open');
  };
  const closeProject = () => {
    clearProjectHash();
    if (modal.open) modal.close();
  };
  const routeProject = () => {
    const project = articles.find(article => '#' + article.id === location.hash);
    if (!project) { if (modal.open) modal.close(); return; }
    if (currentProject === project && modal.open) return;
    const focus = document.activeElement;
    restoreArticle();
    returnFocus = focus && focus.matches('[data-project]') ? focus : document.querySelector('[href="#' + project.id + '"]');
    currentProject = project;
    modalContent.appendChild(project);
    project.hidden = false;
    modal.setAttribute('aria-labelledby', project.querySelector('h2').id);
    document.body.classList.add('modal-open');
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    document.querySelector('#modalClose').focus({ preventScroll: true });
  };
  if (supportsDialog) {
    modal.addEventListener('close', () => {
      restoreArticle();
      clearProjectHash();
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
    document.querySelector('#modalClose').addEventListener('click', closeProject);
    modal.addEventListener('click', event => {
      if (event.target.closest('.back-projects')) { event.preventDefault(); closeProject(); }
    });
    window.addEventListener('hashchange', routeProject);
    document.querySelectorAll('[data-project]').forEach(link => link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (location.hash === link.hash) { event.preventDefault(); routeProject(); }
    }));
    articles.forEach(article => { article.hidden = true; });
    routeProject();
  }

  const copy = document.querySelector('#copyEmail');
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    const status = document.querySelector('#copyStatus');
    try {
      await navigator.clipboard.writeText('irenesansa2005@gmail.com');
      status.textContent = language === 'es' ? '¡Email copiado!' : 'Email copied!';
    } catch {
      status.textContent = language === 'es' ? 'Selecciona el email para copiarlo, o púlsalo para escribirme.' : 'Select the email to copy it, or click it to write to me.';
    }
  });

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('waiting'); observer.unobserve(entry.target); }
    }), { threshold: .04 });
    document.querySelectorAll('.reveal').forEach(el => { el.classList.add('waiting'); observer.observe(el); });
    reducedMotion.addEventListener('change', event => {
      if (event.matches) { document.querySelectorAll('.waiting').forEach(el => el.classList.remove('waiting')); observer.disconnect(); }
    });
  }
  const animatedImages = Array.from(document.querySelectorAll('img[data-motion]'));
  const applyMotionPreference = () => animatedImages.forEach(img => {
    img.src = reducedMotion.matches ? img.dataset.still : img.dataset.motion;
  });
  applyMotionPreference();
  reducedMotion.addEventListener('change', applyMotionPreference);

  const cursor = document.querySelector('.cursor-dot');
  if (matchMedia('(pointer: fine) and (hover: hover)').matches && !reducedMotion.matches) {
    document.addEventListener('pointermove', event => {
      cursor.style.left = event.clientX + 'px'; cursor.style.top = event.clientY + 'px'; cursor.classList.add('active');
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('active'));
    window.addEventListener('blur', () => cursor.classList.remove('active'));
  }

  // Fullscreen pinned image wipe: scroll reveals each new project from the bottom.
  const scrollShowcase = document.querySelector('#works .scroll-showcase');
  const scrollSlides = Array.from(document.querySelectorAll('#works .scroll-slide'));
  const scrollProgress = document.querySelector('#works .showcase-progress');
  if (scrollShowcase && scrollSlides.length) {
    let ticking = false;
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const render = () => {
      ticking = false;
      const rect = scrollShowcase.getBoundingClientRect();
      const travel = Math.max(1, scrollShowcase.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / travel, 0, 1) * (scrollSlides.length - 1);
      const current = Math.min(scrollSlides.length - 1, Math.floor(progress + 0.5));
      scrollSlides.forEach((slide, i) => {
        // Previous image stays put; incoming image is uncovered vertically.
        const reveal = i === 0 ? 1 : clamp(progress - (i - 1), 0, 1);
        const shown = reducedMotion.matches ? (i <= current ? 1 : 0) : reveal;
        slide.style.clipPath = 'inset(' + ((1 - shown) * 100).toFixed(3) + '% 0 0 0)';
        slide.style.zIndex = String(i + 1);
        slide.style.opacity = '1';
        slide.style.visibility = 'visible';
        slide.style.pointerEvents = i === current ? 'auto' : 'none';
        slide.tabIndex = i === current ? 0 : -1;
        slide.setAttribute('aria-hidden', String(i !== current));
        slide.classList.toggle('is-active', i === current);
      });
      if (scrollProgress) scrollProgress.textContent = String(current + 1).padStart(2, '0') + ' — ' + String(scrollSlides.length).padStart(2, '0');
    };
    const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
    window.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize', schedule, {passive:true});
    reducedMotion.addEventListener('change', schedule);
    schedule();
  }
})();
