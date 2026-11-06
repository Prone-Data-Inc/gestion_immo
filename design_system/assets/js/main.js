/* ==========================================================================
   Immo+ — JS partagé (navigation, animations, composants interactifs)
   Aucune dépendance. Exposé via window.Immo pour les scripts de page.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var icon = function (n, cls) { return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };

  /* ---------- Formats (fr-FR, FCFA) ---------- */
  // fr-FR sépare les milliers par une espace fine insécable (U+202F) que beaucoup de polices
  // n'ont pas : on la remplace par l'espace insécable classique (U+00A0), plus sûre.
  var sp = function (s) { return s.replace(/ /g, ' '); };
  var nf = new Intl.NumberFormat('fr-FR');
  function num(n, d) { return sp(new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }).format(n)); }
  function fcfa(n) { return sp(nf.format(Math.round(n))) + ' FCFA'; }

  /* ==========================================================================
     TOASTS
     ========================================================================== */
  var region;
  function toast(o) {
    o = o || {};
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    var type = o.type || 'info';
    var ic = type === 'success' ? 'check-circle' : type === 'danger' ? 'alert' : 'info';
    var el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.setAttribute('role', 'status');
    el.innerHTML = icon(ic) +
      '<div><div class="toast__title"></div>' + (o.message ? '<div class="toast__text"></div>' : '') + '</div>' +
      '<button class="toast__close" aria-label="Fermer">' + icon('x', 'icon--sm') + '</button>';
    $('.toast__title', el).textContent = o.title || '';
    if (o.message) $('.toast__text', el).textContent = o.message;
    region.appendChild(el);
    var done = function () {
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 300);
    };
    $('.toast__close', el).addEventListener('click', done);
    setTimeout(done, o.duration || 4200);
    return el;
  }

  /* ==========================================================================
     MODALES (<dialog class="modal">)
     ========================================================================== */
  function openModal(id) {
    var d = typeof id === 'string' ? document.getElementById(id) : id;
    if (!d) return;
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('is-open'); }); });
    var f = $('input, select, textarea, button:not([data-modal-close])', d);
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 120);
  }
  function closeModal(id) {
    var d = typeof id === 'string' ? document.getElementById(id) : id;
    if (!d || !d.open) return;
    d.classList.remove('is-open');
    setTimeout(function () {
      if (d.close) d.close(); else d.removeAttribute('open');
      document.documentElement.style.overflow = '';
    }, reduceMotion ? 0 : 280);
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-modal-open]');
    if (o) { e.preventDefault(); openModal(o.getAttribute('data-modal-open')); return; }
    var c = e.target.closest('[data-modal-close]');
    if (c) { closeModal(c.closest('dialog')); return; }
    if (e.target.matches && e.target.matches('dialog.modal')) closeModal(e.target);
  });
  $$('dialog.modal').forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeModal(d); });
  });

  /* ==========================================================================
     COPIER
     ========================================================================== */
  function copyText(t) {
    var ok = function () { toast({ type: 'success', title: 'Copié', message: t.length > 60 ? t.slice(0, 57) + '…' : t, duration: 1800 }); };
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(t).then(ok, fallback); } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (err) { /* ignore */ }
      ta.remove();
    }
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (c) { e.preventDefault(); copyText(c.getAttribute('data-copy')); }
  });

  /* ==========================================================================
     TRANSITION ENTRE PAGES (fondu à la sortie, voir base.css pour l'arrivée)
     ========================================================================== */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    if (a.protocol !== location.protocol || a.host !== location.host) return;
    if (a.pathname === location.pathname && a.hash) return;     // ancre sur la même page
    if (a.pathname === location.pathname && !a.hash && a.search === location.search) return;
    if (reduceMotion) return;
    e.preventDefault();
    document.body.classList.add('is-leaving');
    var href = a.href;
    setTimeout(function () { location.href = href; }, 230);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) document.body.classList.remove('is-leaving'); });

  /* ==========================================================================
     EN-TÊTE : état au scroll, menu mobile, menus déroulants
     ========================================================================== */
  var header = $('[data-header]');
  if (header) {
    var setScrolled = function () { header.classList.toggle('is-scrolled', window.scrollY > 12); };
    setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });
    var tg = $('.nav-toggle', header);
    if (tg) {
      tg.addEventListener('click', function () {
        var open = header.classList.toggle('is-menu-open');
        tg.setAttribute('aria-expanded', open);
      });
      $$('.nav a', header).forEach(function (a) {
        a.addEventListener('click', function () { header.classList.remove('is-menu-open'); tg.setAttribute('aria-expanded', 'false'); });
      });
    }
  }
  $$('[data-dropdown]').forEach(function (dd) {
    var t = $('[data-dropdown-toggle]', dd);
    if (!t) return;
    t.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !dd.classList.contains('is-open');
      $$('[data-dropdown].is-open').forEach(function (o) { o.classList.remove('is-open'); var x = $('[data-dropdown-toggle]', o); if (x) x.setAttribute('aria-expanded', 'false'); });
      dd.classList.toggle('is-open', open);
      t.setAttribute('aria-expanded', open);
    });
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-dropdown]') && !e.target.closest('.dropdown__item')) return;
    $$('[data-dropdown].is-open').forEach(function (o) { o.classList.remove('is-open'); var x = $('[data-dropdown-toggle]', o); if (x) x.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $$('[data-dropdown].is-open').forEach(function (o) { o.classList.remove('is-open'); });
  });

  /* ==========================================================================
     APPARITION AU SCROLL + COMPTEURS + BARRES DE PROGRESSION
     ========================================================================== */
  $$('[data-stagger]').forEach(function (p) {
    Array.prototype.forEach.call(p.children, function (c, i) {
      if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', p.getAttribute('data-stagger') || '');
      c.style.setProperty('--i', i);
    });
  });

  function animateCount(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var d = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
    var from = parseFloat(el.getAttribute('data-from') || '0');
    var dur = parseInt(el.getAttribute('data-duration') || '1400', 10);
    if (reduceMotion) { el.textContent = pre + num(to, d) + suf; return; }
    var t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = pre + num(from + (to - from) * e, d) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var targets = $$('[data-reveal], [data-inview], [data-count], .progress');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('is-visible');
        if (el.classList.contains('progress')) el.classList.add('is-ready');
        if (el.hasAttribute('data-count') && !el.__counted) { el.__counted = true; animateCount(el); }
        io.unobserve(el);
        if (el.hasAttribute('data-reveal')) {
          // une fois révélé, on retire l'état d'animation pour libérer les hover/transform
          setTimeout(function () { el.removeAttribute('data-reveal'); el.style.removeProperty('--i'); }, 1500 + (parseInt(el.style.getPropertyValue('--i') || '0', 10) * 80));
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('is-visible', 'is-ready'); if (t.hasAttribute('data-count')) animateCount(t); });
  }

  /* ==========================================================================
     PARALLAXE (vagues, mascotte)
     ========================================================================== */
  var layers = $$('[data-speed]');
  var mascot = $('[data-mascot]');
  if ((layers.length || mascot) && !reduceMotion) {
    var ticking = false;
    var update = function () {
      var y = window.scrollY, vh = window.innerHeight;
      ticking = false;
      if (y > vh * 1.3) return;
      layers.forEach(function (l) { l.style.setProperty('--py', (y * parseFloat(l.getAttribute('data-speed'))).toFixed(1) + 'px'); });
      if (mascot) {
        mascot.style.setProperty('--dive', Math.min(y * 0.45, 300).toFixed(1) + 'px');
        mascot.style.setProperty('--dive-o', Math.max(0, 1 - y / (vh * 0.72)).toFixed(3));
      }
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ==========================================================================
     ACCORDÉON
     ========================================================================== */
  $$('.accordion').forEach(function (acc) {
    var single = acc.hasAttribute('data-single');
    $$('.accordion__item', acc).forEach(function (item, i) {
      var trig = $('.accordion__trigger', item), panel = $('.accordion__panel', item);
      var id = 'acc-' + Math.random().toString(36).slice(2, 7);
      panel.id = panel.id || id; trig.setAttribute('aria-controls', panel.id);
      trig.setAttribute('aria-expanded', item.classList.contains('is-open'));
      trig.addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        if (single && open) $$('.accordion__item.is-open', acc).forEach(function (o) { o.classList.remove('is-open'); $('.accordion__trigger', o).setAttribute('aria-expanded', 'false'); });
        item.classList.toggle('is-open', open);
        trig.setAttribute('aria-expanded', open);
      });
    });
  });

  /* ==========================================================================
     ONGLETS (avec indicateur animé)
     ========================================================================== */
  function initTabs(root) {
    var list = $('.tabs', root);
    if (!list) return;
    var tabs = $$('.tabs__tab', list);
    var ind = document.createElement('span');
    ind.className = 'tabs__indicator';
    list.insertBefore(ind, list.firstChild);
    function place(t) {
      ind.style.width = t.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + t.offsetLeft + 'px)';
    }
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on);
        x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      place(t);
      if (focus) t.focus();
      if (t.scrollIntoView && list.scrollWidth > list.clientWidth) t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
    tabs.forEach(function (t, i) {
      t.setAttribute('role', 'tab');
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    list.setAttribute('role', 'tablist');
    var cur = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    select(cur);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { var s = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0]; if (s) place(s); });
    window.addEventListener('resize', function () { var s = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0]; if (s) place(s); });
    root.__selectTab = select;
    root.__tabs = tabs;
  }
  $$('[data-tabs]').forEach(initTabs);
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-tab-open]');
    if (!o) return;
    var id = o.getAttribute('data-tab-open');
    $$('[data-tabs]').forEach(function (root) {
      (root.__tabs || []).forEach(function (t) { if (t.getAttribute('aria-controls') === id) root.__selectTab(t); });
    });
  });

  /* ==========================================================================
     CURSEURS (range) : remplissage de la piste
     ========================================================================== */
  function paintRange(r) {
    var min = parseFloat(r.min || 0), max = parseFloat(r.max || 100), v = parseFloat(r.value);
    r.style.setProperty('--val', ((v - min) / (max - min) * 100) + '%');
  }
  $$('input.range').forEach(function (r) { paintRange(r); r.addEventListener('input', function () { paintRange(r); }); });

  /* Stepper numérique */
  $$('.stepper').forEach(function (s) {
    var inp = $('input', s), btns = $$('button', s);
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        var v = parseInt(inp.value || '0', 10) + (i === 0 ? -1 : 1);
        var min = inp.min !== '' ? parseInt(inp.min, 10) : -Infinity, max = inp.max !== '' ? parseInt(inp.max, 10) : Infinity;
        inp.value = Math.max(min, Math.min(max, v));
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  });

  /* Dropzone (démo) */
  $$('.dropzone').forEach(function (z) {
    var inp = $('input[type=file]', z);
    ['dragenter', 'dragover'].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.remove('is-over'); }); });
    z.addEventListener('drop', function (e) { if (e.dataTransfer.files.length) toast({ type: 'success', title: e.dataTransfer.files.length + ' fichier(s) ajouté(s)', message: e.dataTransfer.files[0].name }); });
    if (inp) inp.addEventListener('change', function () { if (inp.files.length) toast({ type: 'success', title: inp.files.length + ' fichier(s) ajouté(s)', message: inp.files[0].name }); });
  });

  /* ==========================================================================
     VALIDATION DE FORMULAIRE
     ========================================================================== */
  function fieldOf(c) { return c.closest('.field'); }
  function setError(field, msg) {
    var err = $('.field__error', field);
    if (!err) {
      err = document.createElement('p');
      err.className = 'field__error';
      field.appendChild(err);
    }
    err.innerHTML = icon('alert', 'icon--sm') + '<span></span>';
    $('span', err).textContent = msg;
    field.classList.add('is-invalid'); field.classList.remove('is-valid');
    var c = $('.control, input, select, textarea', field); if (c) c.setAttribute('aria-invalid', 'true');
  }
  function clearError(field, valid) {
    field.classList.remove('is-invalid');
    if (valid) field.classList.add('is-valid');
    var c = $('.control, input, select, textarea', field); if (c) c.removeAttribute('aria-invalid');
  }
  function messageFor(c) {
    if (c.dataset.error) return c.dataset.error;
    var v = c.validity;
    if (v.valueMissing) return c.type === 'checkbox' ? 'Merci de cocher cette case pour continuer.' : 'Ce champ est obligatoire.';
    if (v.typeMismatch && c.type === 'email') return 'Saisissez une adresse e-mail valide (ex. nom@agence.com).';
    if (v.patternMismatch) return c.title || 'Le format n’est pas valide.';
    if (v.rangeUnderflow) return 'La valeur minimale est ' + c.min + '.';
    if (v.rangeOverflow) return 'La valeur maximale est ' + c.max + '.';
    return c.validationMessage || 'Valeur invalide.';
  }
  $$('form[data-validate]').forEach(function (form) {
    form.setAttribute('novalidate', '');
    $$('.control, input[type=checkbox], input[type=radio]', form).forEach(function (c) {
      var f = fieldOf(c);
      if (!f) return;
      c.addEventListener('input', function () { if (f.classList.contains('is-invalid') && c.checkValidity()) clearError(f, true); });
      c.addEventListener('blur', function () { if (c.value && c.willValidate && c.type !== 'checkbox' && c.type !== 'radio') { if (c.checkValidity()) clearError(f, true); else setError(f, messageFor(c)); } });
      c.addEventListener('change', function () { if (f.classList.contains('is-invalid') && c.checkValidity()) clearError(f, true); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      $$('.control, input[type=checkbox]', form).forEach(function (c) {
        var f = fieldOf(c); if (!f || !c.willValidate) return;
        if (!c.checkValidity()) { setError(f, messageFor(c)); if (!first) first = c; } else if (c.required || c.value) clearError(f, c.type !== 'checkbox');
      });
      if (first) { first.focus(); var f1 = fieldOf(first); if (f1 && !reduceMotion && f1.animate) f1.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 360, easing: 'ease-out' }); return; }
      var btn = $('[type=submit]', form) || $('button:not([type])', form);
      if (btn) btn.classList.add('is-loading');
      setTimeout(function () {
        if (btn) btn.classList.remove('is-loading');
        var card = form.closest('[data-form-card]');
        if (card) card.classList.add('is-sent');
        var msg = form.getAttribute('data-success-toast');
        if (msg) toast({ type: 'success', title: msg, message: form.getAttribute('data-success-text') || '' });
        form.dispatchEvent(new CustomEvent('immo:submit', { bubbles: true }));
        if (!card) { form.reset(); $$('.field', form).forEach(function (f) { f.classList.remove('is-valid'); }); $$('input.range', form).forEach(paintRange); }
      }, 900);
    });
  });

  /* ==========================================================================
     NAVIGATION « PROTOTYPE » (aide les co-fondateurs à parcourir les pages)
     ========================================================================== */
  if (document.body.getAttribute('data-proto-nav') !== 'off') {
    var pages = [['index.html', 'Site vitrine'], ['fonctionnalites.html', 'Fonctionnalité'], ['dashboard.html', 'Dashboard'], ['design-system.html', 'Design system']];
    var cur = location.pathname.split('/').pop() || 'index.html';
    var nav = document.createElement('nav');
    nav.className = 'proto-nav';
    nav.setAttribute('aria-label', 'Navigation du prototype');
    nav.innerHTML = '<span class="proto-nav__label">Prototype</span>' + pages.map(function (p) {
      return '<a href="' + p[0] + '"' + (p[0] === cur ? ' aria-current="page"' : '') + '>' + p[1] + '</a>';
    }).join('');
    document.body.appendChild(nav);
  }

  /* ---------- Petits utilitaires de contenu ---------- */
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
  $$('[data-today]').forEach(function (e) {
    var s = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    e.textContent = s.charAt(0).toUpperCase() + s.slice(1);
  });

  window.Immo = { toast: toast, openModal: openModal, closeModal: closeModal, copy: copyText, fcfa: fcfa, num: num, icon: icon, animateCount: animateCount, reduceMotion: reduceMotion, $: $, $$: $$ };
})();
