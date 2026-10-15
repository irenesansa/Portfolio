/* Contenido editable en index.html. Este archivo añade idioma e interacciones. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const translations = Array.from(document.querySelectorAll('[data-en]'), el => ({ el, es: el.textContent, en: el.dataset.en }));
  const accessibleLabels = Array.from(document.querySelectorAll('[data-en-label]'), el => ({ el, es: el.getAttribute('aria-label'), en: el.dataset.enLabel }));
  const languageButtons = [document.querySelector('#langToggle'), document.querySelector('#modalLang')].filter(Boolean);
  const pageDescription = document.querySelector('meta[name="description"]');
  const spanishDescription = pageDescription.content;
  let language = 'es';
  const setLanguage = (next, updateURL = true) => {
    language = next === 'en' ? 'en' : 'es';
    document.documentElement.lang = language;
    translations.forEach(item => { item.el.textContent = item[language]; });
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

  // Scroll-driven pinned showcase: one fixed viewport, changing image and title.
  const scrollShowcase = document.querySelector('#works .scroll-showcase');
  const scrollSlides = Array.from(document.querySelectorAll('#works .scroll-slide'));
  const scrollProgress = document.querySelector('#works .showcase-progress');
  if (scrollShowcase && scrollSlides.length && scrollProgress) {
    let scheduled = false;
    let activeSlide = -1;
    const updateShowcase = () => {
      scheduled = false;
      const rect = scrollShowcase.getBoundingClientRect();
      const travel = Math.max(1, scrollShowcase.offsetHeight - window.innerHeight);
      const position = Math.min(1, Math.max(0, -rect.top / travel));
      const positionInSlides = position * (scrollSlides.length - 1);
      const nearest = Math.min(scrollSlides.length - 1, Math.floor(positionInSlides + 0.5));
      // Crossfade occupies a short interval around each project boundary.
      scrollSlides.forEach((slide, i) => {
        const proximity = Math.abs(positionInSlides - i);
        const alpha = Math.min(1, Math.max(0, (0.7 - proximity) / 0.4));
        const visible = reducedMotion.matches ? i === nearest : alpha > 0.001;
        const opacity = reducedMotion.matches ? (i === nearest ? 1 : 0) : alpha;
        slide.style.opacity = String(opacity);
        slide.style.zIndex = String(i + 1);
        slide.style.pointerEvents = i === nearest ? 'auto' : 'none';
        slide.style.visibility = visible ? 'visible' : 'hidden';
        slide.classList.toggle('is-active', i === nearest);
        slide.tabIndex = i === nearest ? 0 : -1;
        slide.setAttribute('aria-hidden', String(i !== nearest));
        const image = slide.querySelector('img');
        const overlay = slide.querySelector('.showcase-overlay');
        if (image) image.style.transform = reducedMotion.matches ? 'none' : 'scale(' + (1.06 - Math.max(0, 1 - proximity) * .06) + ')';
        if (overlay) overlay.style.transform = reducedMotion.matches ? 'none' : 'translateY(' + Math.min(18, proximity * 18) + 'px)';
      });
      if (nearest !== activeSlide) {
        activeSlide = nearest;
        scrollProgress.textContent = String(nearest + 1).padStart(2, '0') + ' — ' + String(scrollSlides.length).padStart(2, '0');
      }
    };
    const requestShowcase = () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(updateShowcase); }
    };
    window.addEventListener('scroll', requestShowcase, {passive: true});
    window.addEventListener('resize', requestShowcase, {passive: true});
    reducedMotion.addEventListener('change', requestShowcase);
    requestShowcase();
  }
})();
