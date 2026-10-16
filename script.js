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
  const setLanguage = (next, updateURL = true) => {
    language = next === 'en' ? 'en' : 'es';
    document.documentElement.lang = language;
    translations.forEach(item => { item.el.textContent = item[language]; });
    if (typeof currentProject !== 'undefined' && currentProject) requestAnimationFrame(() => watchProjectCaption(currentProject));
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

  // Project captions: prepare when the project opens, observe within the dialog.
  // This avoids animations firing while the archived articles are hidden.
  const captionTimers = new WeakMap();
  let projectCaptionObserver = null;
  const resetProjectCaption = caption => {
    projectCaptionObserver?.unobserve(caption);
    caption.querySelectorAll('.project-caption-word').forEach(word => word.getAnimations().forEach(animation => animation.cancel()));
    const original = caption.textContent;
    const parts = original.match(/\S+\s*/g) || [];
    caption.replaceChildren(...parts.map(part => {
      const span = document.createElement('span');
      span.className = 'project-caption-word';
      span.textContent = part;
      return span;
    }));
    caption.classList.add('project-caption-pending');
  };
  const watchProjectCaption = project => {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    projectCaptionObserver?.disconnect();
    const caption = project.querySelector('.gallery-note-copy');
    if (!caption) return;
    resetProjectCaption(caption);
    projectCaptionObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      projectCaptionObserver.disconnect();
      const words = [...caption.querySelectorAll('.project-caption-word')];
      words.forEach((word,index) => {
        const animation = word.animate([
          {opacity:0,filter:'blur(2px)'},
          {opacity:1,filter:'blur(0px)'}
        ], {duration:650,delay:index*115,easing:'ease-out',fill:'forwards'});
        animation.onfinish = () => {
          word.style.opacity = '1';
          animation.cancel();
        };
      });
      caption.classList.remove('project-caption-pending');
    }, {root:document.querySelector('#projectModal'),threshold:0,rootMargin:'-35% 0px -35% 0px'});
    projectCaptionObserver.observe(caption);
  };

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
    projectCaptionObserver?.disconnect();
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
    watchProjectCaption(project);
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
      const nextLink = event.target.closest('.back-projects');
      if (nextLink) {
        event.preventDefault();
        if (nextLink.hash.startsWith('#project-')) {
          if (location.hash === nextLink.hash) routeProject();
          else location.hash = nextLink.hash;
        } else closeProject();
      }
    });
    window.addEventListener('hashchange', routeProject);
    document.querySelectorAll('[data-project]').forEach(link => link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (location.hash === link.hash) { event.preventDefault(); routeProject(); }
    }));
    articles.forEach(article => { article.hidden = true; });
    routeProject();
  }

  // Prepare the hidden words BEFORE observing them; reveal only when the user
  // actually reaches the paragraph area, not when the heading enters view.
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const aboutTexts = [...document.querySelectorAll('#about .about-copy > p')];
    const aboutSection = document.querySelector('#about');
    const prepare = paragraph => {
      const original = paragraph.textContent;
      const words = original.match(/\S+\s*/g) || [];
      const spans = words.map(fragment => {
        const span = document.createElement('span');
        span.className = 'about-reveal-word';
        span.textContent = fragment;
        return span;
      });
      paragraph.replaceChildren(...spans);
      paragraph.classList.add('about-reveal-pending');
      return spans;
    };
    const prepared = aboutTexts.map(prepare);
    let played = false;
    const reveal = () => {
      if (played) return;
      played = true;
      prepared.forEach((words, paragraphIndex) => {
        words.forEach((word, index) => {
          word.animate([
            { opacity: 0, filter: 'blur(2px)' },
            { opacity: 1, filter: 'blur(0px)' }
          ], {
            duration: 650,
            delay: paragraphIndex * 230 + index * 115,
            easing: 'ease-out',
            fill: 'forwards'
          });
        });
      });
    };
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      reveal();
    }, { threshold: 0, rootMargin: '-42% 0px -42% 0px' });
    if (aboutSection) {
      // Track the actual text region rather than the full About section.
      const target = aboutTexts[0];
      observer.observe(target);
    }
    // Keep accessibility and translated text usable; translation updates
    // replace the spans, so don't start a second animation on language change.
    document.querySelectorAll('#langToggle, #modalLang').forEach(button => button.addEventListener('click', () => {
      observer.disconnect();
      prepared.forEach((words, i) => {
        aboutTexts[i]?.classList.remove('about-reveal-pending');
      });
      played = true;
    }));
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
