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

  // Galería de portada: manual con flechas/teclado y avance automático discreto.
  const showcase = document.querySelector('.project-showcase');
  if (showcase) {
    const slides = Array.from(showcase.querySelectorAll('.showcase-slide'));
    const progress = showcase.querySelector('.showcase-progress');
    let active = 0, autoTimer;
    function showSlide(next) {
      active = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const selected = i === active;
        slide.classList.toggle('is-active', selected);
        slide.setAttribute('aria-hidden', String(!selected));
        slide.tabIndex = selected ? 0 : -1;
      });
      progress.textContent = String(active + 1).padStart(2, '0') + ' — ' + String(slides.length).padStart(2, '0');
    }
    function restartAuto() {
      clearInterval(autoTimer);
      if (reducedMotion.matches || document.hidden || showcase.matches(':hover') || showcase.contains(document.activeElement)) return;
      autoTimer = setInterval(() => showSlide(active + 1), 5500);
    }
    showcase.querySelector('.showcase-prev').addEventListener('click', () => { showSlide(active - 1); restartAuto(); });
    showcase.querySelector('.showcase-next').addEventListener('click', () => { showSlide(active + 1); restartAuto(); });
    showcase.addEventListener('mouseenter', () => clearInterval(autoTimer));
    showcase.addEventListener('mouseleave', restartAuto);
    showcase.addEventListener('focusin', () => clearInterval(autoTimer));
    showcase.addEventListener('focusout', () => setTimeout(restartAuto, 0));
    showcase.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); showSlide(active + (event.key === 'ArrowRight' ? 1 : -1)); restartAuto();
      }
    });
    document.addEventListener('visibilitychange', restartAuto);
    reducedMotion.addEventListener('change', restartAuto);
    let touchX = null;
    showcase.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, {passive:true});
    showcase.addEventListener('touchend', e => { if(touchX===null)return;const d=e.changedTouches[0].clientX-touchX;if(Math.abs(d)>45){showSlide(active+(d<0?1:-1));restartAuto();}touchX=null; }, {passive:true});
    showSlide(0); restartAuto();
  }
})();
