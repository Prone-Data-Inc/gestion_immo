/* ==========================================================================
   Immo+ — Page de référence du design system
   Partie 1 : capture du code des démos AVANT que main.js ne les enrichisse.
   Partie 2 : génération des tableaux (couleurs, espacement, icônes…) à partir
              des tokens CSS réels — la page ne peut donc pas se désynchroniser.
   ========================================================================== */
(function () {
  'use strict';

  /* ============ PARTIE 1 — blocs « Voir le code » ============ */
  function dedent(s) {
    var lines = s.replace(/\t/g, '  ').split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    var min = Math.min.apply(null, lines.filter(function (l) { return l.trim(); }).map(function (l) { return l.match(/^ */)[0].length; }));
    return lines.map(function (l) { return l.slice(min); }).join('\n');
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function hl(s) {
    s = esc(s);
    s = s.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tk-tag">$2</span>');
    s = s.replace(/([\w:-]+)=(&quot;[^]*?&quot;)/g, '<span class="tk-attr">$1</span>=<span class="tk-str">$2</span>');
    return s;
  }
  Array.prototype.forEach.call(document.querySelectorAll('.ds-demo[data-code]'), function (demo) {
    var code = dedent(demo.innerHTML.replace(/=""/g, '').replace(/\s+style=""/g, ''));
    var d = document.createElement('details');
    d.className = 'ds-code';
    d.innerHTML = '<summary><svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg>Voir le code HTML<button type="button" class="ds-code__copy">Copier</button></summary><pre><code>' + hl(code) + '</code></pre>';
    d.querySelector('.ds-code__copy').setAttribute('data-copy', code);
    d.querySelector('.ds-code__copy').addEventListener('click', function (e) { e.stopPropagation(); });
    demo.parentNode.insertBefore(d, demo.nextSibling);
  });

  /* ============ PARTIE 2 — tableaux issus des tokens ============ */
  document.addEventListener('DOMContentLoaded', function () {
    var I = window.Immo, $ = I.$, $$ = I.$$;
    var css = getComputedStyle(document.documentElement);
    var tok = function (n) { return css.getPropertyValue(n).trim(); };

    /* --- utilitaires couleur --- */
    function rgb(h) {
      h = h.trim();
      if (h.charAt(0) === '#') { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
      var m = h.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
    }
    function lum(c) { var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
    function ratio(a, b) { var x = lum(rgb(a)), y = lum(rgb(b)); if (x < y) { var t = x; x = y; y = t; } return (x + 0.05) / (y + 0.05); }
    function onColor(h) { return ratio(h, tok('--cream-50')) >= ratio(h, tok('--forest-900')) ? tok('--cream-50') : tok('--forest-900'); }

    /* --- échelles de couleurs --- */
    var ramps = $('#ramps');
    if (ramps) {
      var defs = [['Terracotta', 'terracotta', 600], ['Sable', 'sand', 400], ['Olive', 'olive', 600], ['Forêt', 'forest', 800], ['Crème', 'cream', 100]];
      ramps.innerHTML = defs.map(function (d) {
        var steps = d[1] === 'cream' ? [50, 100, 200, 300] : [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
        var cells = steps.map(function (s) {
          var h = tok('--' + d[1] + '-' + s);
          return '<button type="button" class="ramp__cell" style="--c:' + h + ';--on:' + onColor(h) + '" data-copy="' + h + '" title="' + h + '">' + (s === d[2] ? '● ' : '') + s + '<span>' + h + '</span></button>';
        }).join('');
        return '<div class="ramp"><div class="ramp__name">' + d[0] + ' <code>--' + d[1] + '-*</code></div><div class="ramp__row" style="grid-template-columns:repeat(' + steps.length + ',1fr)">' + cells + '</div></div>';
      }).join('');
    }

    /* --- tokens sémantiques --- */
    var sem = [
      ['--bg', 'Fond de page'], ['--surface', 'Cartes, champs, panneaux'], ['--surface-sunken', 'Zones en retrait, en-têtes de tableau'], ['--surface-inverse', 'Sections et barres latérales sombres'],
      ['--text', 'Texte courant'], ['--text-strong', 'Titres'], ['--text-muted', 'Texte secondaire, légendes'], ['--text-subtle', 'Placeholders, désactivé'],
      ['--primary', 'Boutons primaires, éléments d’action'], ['--accent', 'Fonds et icônes d’accent, séries de graphique'], ['--accent-text', 'Texte d’accent sur fond clair'], ['--highlight', 'Surlignage, éléments chaleureux'],
      ['--success', 'Succès, positif, encaissé'], ['--warning', 'Attention, à relancer'], ['--danger', 'Erreur, impayé critique'], ['--info', 'Information neutre'],
      ['--border', 'Filets, séparateurs'], ['--border-strong', 'Contour des champs']
    ];
    var semBody = $('#sem-body');
    if (semBody) semBody.innerHTML = sem.map(function (r) {
      var v = tok(r[0]);
      return '<tr><td><code data-copy="var(' + r[0] + ')" style="cursor:pointer">' + r[0] + '</code></td><td><span style="display:inline-flex;align-items:center;gap:.6rem"><i style="width:1.4rem;height:1.4rem;border-radius:6px;border:1px solid var(--border);background:var(' + r[0] + ')"></i><code>' + v + '</code></span></td><td>' + r[1] + '</td></tr>';
    }).join('');

    /* --- tableau de contraste (calcul WCAG en direct) --- */
    var pairs = [
      ['--text', '--bg', 'Texte courant sur fond de page'], ['--text-strong', '--surface', 'Titres sur carte'], ['--text-muted', '--bg', 'Texte secondaire (olive)'],
      ['--accent-text', '--bg', 'Texte d’accent (terracotta 700)'], ['--cream-100', '--forest-800', 'Texte crème sur bouton primaire / zone sombre'],
      ['#ffffff', '--terracotta-600', 'Texte blanc sur bouton accent'], ['--terracotta-600', '--bg', 'Terracotta sur crème (icônes, titres XL)'],
      ['--forest-800', '--sand-400', 'Texte forêt sur sable'], ['--sand-400', '--bg', 'Sable sur crème (décoration seulement)'],
      ['--olive-800', '--olive-100', 'Badge succès'], ['--warning-text', '--warning-bg', 'Badge avertissement'], ['--danger-text', '--danger-bg', 'Badge erreur'], ['--text-subtle', '--surface', 'Placeholder']
    ];
    var cBody = $('#contrast-body');
    if (cBody) cBody.innerHTML = pairs.map(function (p) {
      var f = p[0].charAt(0) === '#' ? p[0] : tok(p[0]), b = tok(p[1]), r = ratio(f, b);
      var cls = r >= 7 ? 'aaa' : r >= 4.5 ? 'aa' : r >= 3 ? 'aal' : 'fail', lbl = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA grand texte / UI' : 'Décoratif seulement';
      return '<tr><td><span class="sample" style="color:' + f + ';background:' + b + '">Aa</span></td><td>' + p[2] + '</td><td><code>' + p[0].replace('--', '') + '</code> sur <code>' + p[1].replace('--', '') + '</code></td><td class="num" style="font-variant-numeric:tabular-nums"><strong>' + r.toFixed(2).replace('.', ',') + ' : 1</strong></td><td><span class="contrast-pill ' + cls + '">' + lbl + '</span></td></tr>';
    }).join('');

    /* --- espacement --- */
    var sp = $('#space-list');
    if (sp) sp.innerHTML = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32].map(function (n) {
      var v = tok('--space-' + n), px = parseFloat(v) * 16;
      return '<div class="space-row"><code data-copy="var(--space-' + n + ')" style="cursor:pointer">--space-' + n + '</code><span class="text-muted t-small">' + px + ' px</span><i style="--w:' + px + 'px"></i></div>';
    }).join('');

    /* --- icônes --- */
    var ig = $('#icon-grid');
    if (ig && window.ImmoIcons) {
      ig.innerHTML = window.ImmoIcons.map(function (n) {
        return '<button type="button" class="icon-cell" data-name="' + n + '" data-copy="&lt;svg class=&quot;icon&quot; aria-hidden=&quot;true&quot;&gt;&lt;use href=&quot;#i-' + n + '&quot;/&gt;&lt;/svg&gt;"><svg class="icon" aria-hidden="true"><use href="#i-' + n + '"/></svg>' + n + '</button>';
      }).join('');
      $('#icon-count').textContent = window.ImmoIcons.length;
      $('#icon-search').addEventListener('input', function () {
        var q = this.value.trim().toLowerCase();
        $$('.icon-cell', ig).forEach(function (c) { c.hidden = q && c.getAttribute('data-name').indexOf(q) < 0; });
      });
    }

    /* --- courbes d'accélération --- */
    $$('.ease-svg').forEach(function (s) {
      var b = s.getAttribute('data-bezier').split(',').map(Number);
      s.innerHTML = '<path d="M0 0H100V100H0Z" fill="none" stroke="var(--border)"/><path d="M0 100C' + b[0] * 100 + ' ' + (100 - b[1] * 100) + ' ' + b[2] * 100 + ' ' + (100 - b[3] * 100) + ' 100 0" fill="none" stroke="var(--terracotta-600)" stroke-width="4" stroke-linecap="round"/>';
    });

    /* --- rejouer les démos de mouvement --- */
    function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
    $$('[data-replay="track"]').forEach(function (btn) {
      var card = btn.closest('.motion-card'), i = $('.track i', card);
      var run = function () { i.style.setProperty('--d', card.getAttribute('data-dur') + 'ms'); i.style.setProperty('--e', card.getAttribute('data-ease')); replay(i, 'go'); };
      btn.addEventListener('click', run);
      new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { run(); o.disconnect(); } }).observe(card);
    });
    var st = $('#stagger-demo');
    if (st) $('[data-replay="stagger"]').addEventListener('click', function () { replay(st, 'go'); });
    var rv = $('#reveal-demo');
    if (rv) {
      var showRv = function () { $$('.rv', rv).forEach(function (e) { e.classList.remove('is-in'); }); void rv.offsetWidth; $$('.rv', rv).forEach(function (e, k) { setTimeout(function () { e.classList.add('is-in'); }, 120 + k * 120); }); };
      $('[data-replay="reveal"]').addEventListener('click', showRv);
      new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { showRv(); o.disconnect(); } }).observe(rv);
    }
    var cnt = $('#count-demo');
    if (cnt) $('[data-replay="count"]').addEventListener('click', function () { cnt.setAttribute('data-from', 0); I.animateCount(cnt); });

    /* --- démo toasts --- */
    $$('[data-toast]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-toast');
        I.toast({ type: t, title: { success: 'Loyer encaissé', danger: 'Paiement refusé', info: 'Nouvelle version disponible' }[t], message: { success: '250 000 FCFA · Apt B12', danger: 'Le solde Mobile Money est insuffisant.', info: 'Rechargez la page pour en profiter.' }[t] });
      });
    });
    $$('[data-load-demo]').forEach(function (b) {
      b.addEventListener('click', function () { b.classList.add('is-loading'); setTimeout(function () { b.classList.remove('is-loading'); }, 1500); });
    });

    /* --- démo formats africains --- */
    var amt = $('#fmt-amount');
    if (amt) {
      var upd = function () {
        var d = parseInt(amt.value.replace(/\D/g, ''), 10) || 0;
        $('#fmt-out').textContent = I.fcfa(d);
        $('#fmt-short').textContent = d >= 1e6 ? I.num(d / 1e6, 1) + ' M FCFA' : d >= 1e3 ? I.num(d / 1e3, 0) + ' k FCFA' : I.fcfa(d);
      };
      amt.addEventListener('input', upd); upd();
    }

    /* --- navigation latérale : scrollspy + mobile --- */
    var links = $$('.docs-nav a[href^="#"]'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) { links.forEach(function (l) { l.classList.remove('is-active'); }); map[en.target.id].classList.add('is-active'); }
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    $$('.ds-section[id]').forEach(function (s) { spy.observe(s); });
    var docs = $('#docs');
    $('.docs-nav__toggle').addEventListener('click', function () { docs.classList.toggle('is-nav-open'); });
    links.forEach(function (a) { a.addEventListener('click', function () { docs.classList.remove('is-nav-open'); }); });
  });
})();
