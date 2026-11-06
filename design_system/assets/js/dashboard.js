/* ==========================================================================
   Immo+ — Dashboard KPI (données fictives, tout est calculé côté navigateur)
   ========================================================================== */
(function () {
  'use strict';
  var I = window.Immo, $ = I.$, $$ = I.$$, num = I.num;
  var main = $('#main');
  var state = { port: 'all', period: '30j', filter: 'all', q: '' };

  /* ---------- Données de démonstration ---------- */
  var PORT = {
    all: { label: 'Tous les sites', f: 1, adj: 0, occ: 92.3, vac: 11, late: 14 },
    abj: { label: 'Abidjan', f: 0.52, adj: 0.015, occ: 94.6, vac: 3, late: 6 },
    dkr: { label: 'Dakar', f: 0.31, adj: -0.012, occ: 90.1, vac: 5, late: 5 },
    dla: { label: 'Douala', f: 0.17, adj: -0.025, occ: 88.7, vac: 3, late: 3 }
  };
  var DELTAS = {
    '30j': { encaisse: 8.4, occ: 1.8, impayes: -12, rec: 2.3 },
    '90j': { encaisse: 6.1, occ: 2.4, impayes: -8, rec: 1.9 },
    '12m': { encaisse: 12.7, occ: 4.1, impayes: -21, rec: 3.2 }
  };
  var PAY = {
    all: [['Orange Money', 38, 'var(--forest-800)'], ['Wave', 27, 'var(--olive-600)'], ['MTN MoMo', 18, 'var(--terracotta-600)'], ['Virement', 11, 'var(--sand-400)'], ['Espèces', 6, 'var(--olive-300)']],
    abj: [['Orange Money', 41, 'var(--forest-800)'], ['MTN MoMo', 24, 'var(--olive-600)'], ['Wave', 21, 'var(--terracotta-600)'], ['Virement', 9, 'var(--sand-400)'], ['Espèces', 5, 'var(--olive-300)']],
    dkr: [['Wave', 46, 'var(--forest-800)'], ['Orange Money', 31, 'var(--olive-600)'], ['Virement', 13, 'var(--terracotta-600)'], ['Espèces', 7, 'var(--sand-400)'], ['MTN MoMo', 3, 'var(--olive-300)']],
    dla: [['MTN MoMo', 44, 'var(--forest-800)'], ['Orange Money', 29, 'var(--olive-600)'], ['Virement', 15, 'var(--terracotta-600)'], ['Espèces', 8, 'var(--sand-400)'], ['Wave', 4, 'var(--olive-300)']]
  };
  var LATE = [
    { n: 'Mariam Cissé', i: 'MC', b: 'Villa Mermoz', c: 'dkr', v: 'Dakar', amt: 750000, d: 41 },
    { n: 'Kouassi Yao', i: 'KY', b: 'Villa Angré · Cocody', c: 'abj', v: 'Abidjan', amt: 650000, d: 34 },
    { n: 'Christelle Nkoulou', i: 'CN', b: 'Appt Akwa · A4', c: 'dla', v: 'Douala', amt: 280000, d: 27 },
    { n: 'Fatou Sow', i: 'FS', b: 'Apt 3B · Almadies', c: 'dkr', v: 'Dakar', amt: 480000, d: 21 },
    { n: 'Jean-Marc Mbarga', i: 'JM', b: 'Studio · Bonanjo', c: 'dla', v: 'Douala', amt: 300000, d: 18 },
    { n: 'Awa Traoré', i: 'AT', b: 'Apt B12 · Riviera 3', c: 'abj', v: 'Abidjan', amt: 250000, d: 12 },
    { n: 'Ibrahim Koné', i: 'IK', b: 'Rés. Les Palmiers', c: 'abj', v: 'Abidjan', amt: 400000, d: 9 },
    { n: 'Serge Ouattara', i: 'SO', b: 'Marcory · Zone 4', c: 'abj', v: 'Abidjan', amt: 320000, d: 6 },
    { n: 'Binta Ndiaye', i: 'BN', b: 'Apt 2A · Plateau', c: 'dkr', v: 'Dakar', amt: 350000, d: 15 },
    { n: 'Rodrigue Essomba', i: 'RE', b: 'Local · Bonapriso', c: 'dla', v: 'Douala', amt: 520000, d: 5 }
  ];
  var reminded = {};

  /* ---------- Séries (attendu / encaissé, en M FCFA, pour « Tous les sites ») ---------- */
  function fmtShort(d) { return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d).replace('.', ''); }
  function weeks(n) {
    var out = [], t = new Date();
    for (var i = n - 1; i >= 0; i--) { var d = new Date(t); d.setDate(d.getDate() - i * 7); out.push(fmtShort(d)); }
    return out;
  }
  function months(n) {
    var out = [], t = new Date();
    for (var i = n - 1; i >= 0; i--) { var d = new Date(t.getFullYear(), t.getMonth() - i, 1); out.push(new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d).replace('.', '')); }
    return out;
  }
  var SERIES = {
    '30j': { labels: ['16 oct', '23 oct', '30 oct', '6 nov'], a: [12.4, 12.8, 12.6, 13.5], b: [11.3, 12.1, 11.9, 12.9], sub: 'En millions de FCFA, par semaine' },
    '90j': (function () {
      var a = [], b = [];
      for (var i = 0; i < 13; i++) { var x = 12.2 + i * 0.1 + Math.sin(i * 1.3) * 0.7; a.push(+x.toFixed(1)); b.push(+(x * (0.91 + Math.cos(i * 2.1) * 0.035 + i * 0.002)).toFixed(1)); }
      return { labels: weeks(13), a: a, b: b, sub: 'En millions de FCFA, par semaine' };
    })(),
    '12m': (function () {
      var a = [42.1, 43.0, 43.8, 44.5, 45.9, 46.4, 47.2, 48.0, 49.1, 49.8, 50.6, 51.3];
      var r = [0.91, 0.9, 0.93, 0.92, 0.94, 0.9, 0.93, 0.95, 0.92, 0.94, 0.93, 0.94];
      return { labels: months(12), a: a, b: a.map(function (v, i) { return +(v * r[i]).toFixed(1); }), sub: 'En millions de FCFA, par mois' };
    })()
  };
  function series() {
    var p = PORT[state.port], s = SERIES[state.period];
    return {
      labels: s.labels, sub: s.sub,
      a: s.a.map(function (v) { return v * p.f; }),
      b: s.b.map(function (v, i) { return Math.min(s.a[i] * p.f, v * p.f * (1 + p.adj)); })
    };
  }
  var sum = function (arr) { return arr.reduce(function (x, y) { return x + y; }, 0); };

  /* ---------- KPI ---------- */
  function setKpi(key, val, dec) {
    var el = $('[data-kpi="' + key + '"]');
    var prev = el.__v || 0;
    el.__v = val;
    el.setAttribute('data-from', prev);
    el.setAttribute('data-count', val);
    el.setAttribute('data-decimals', dec);
    I.animateCount(el);
  }
  function setDelta(key, v, goodWhenDown, unit) {
    var el = $('[data-delta="' + key + '"]');
    var good = goodWhenDown ? v < 0 : v > 0, abs = Math.abs(v);
    var txt = (v > 0 ? '+' : v < 0 ? '−' : '') + num(abs, abs % 1 === 0 ? 0 : 1) + (unit === '%' ? ' %' : ' ' + unit);
    el.className = 'delta ' + (good ? 'delta--up' : 'delta--down');
    el.innerHTML = I.icon(v < 0 ? 'arrow-down' : 'arrow-up') + txt;
  }
  function spark(key, data, warn) {
    var el = $('[data-spark="' + key + '"]');
    var pts = data.slice(-12), mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts), W = 88, H = 36, pad = 4;
    var xy = pts.map(function (v, i) { return [i / (pts.length - 1) * W, H - pad - (mx === mn ? 0.5 : (v - mn) / (mx - mn)) * (H - pad * 2)]; });
    var d = xy.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    el.innerHTML = '<path class="spark-area" d="' + d + ' L' + W + ' ' + H + ' L0 ' + H + 'Z"/><path class="spark-line" pathLength="1" d="' + d + '"/>';
  }
  function renderKpis() {
    var p = PORT[state.port], s = series(), dl = DELTAS[state.period];
    var enc = sum(s.b), att = sum(s.a), imp = att - enc;
    var decE = enc >= 100 ? 0 : 1;
    setKpi('encaisse', enc, decE);
    setKpi('occ', p.occ, 1);
    setKpi('impayes', imp, imp >= 100 ? 0 : 1);
    setKpi('rec', enc / att * 100, 1);
    setDelta('encaisse', dl.encaisse, false, '%');
    setDelta('occ', dl.occ, false, 'pt');
    setDelta('impayes', dl.impayes, true, '%');
    setDelta('rec', dl.rec, false, 'pts');
    spark('encaisse', s.b);
    spark('occ', [88.2, 89.1, 88.8, 90.2, 90.9, 91.4, 91.2, 92.0, p.occ]);
    spark('impayes', s.a.map(function (v, i) { return v - s.b[i]; }));
    spark('rec', s.b.map(function (v, i) { return v / s.a[i] * 100; }));
    $('[data-spark="occ"]').closest('.kpi').querySelector('.kpi__foot span:last-child').textContent = p.vac + ' lots vacants';
    $('[data-spark="impayes"]').closest('.kpi').querySelector('.kpi__foot span:last-child').textContent = p.late + ' locataires concernés';
  }

  /* ---------- Histogramme ---------- */
  var chartEl = $('#chart-rev'), tip;
  function renderChart() {
    var s = series(), W = chartEl.clientWidth, H = chartEl.clientHeight;
    if (!W) return;
    var m = { t: 12, r: 6, b: 26, l: 38 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    var rawMax = Math.max.apply(null, s.a) * 1.12, mag = Math.pow(10, Math.floor(Math.log10(rawMax))), step = [1, 2, 2.5, 5, 10].map(function (k) { return k * mag / 2; }).filter(function (v) { return rawMax / v <= 5; })[0] || mag;
    var max = Math.ceil(rawMax / step) * step, n = s.labels.length, band = iw / n, bw = Math.min(band * 0.62, 38);
    var y = function (v) { return m.t + ih - v / max * ih; };
    var out = '';
    for (var v = 0; v <= max + 0.001; v += step) out += '<line class="grid-line" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (m.l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + num(v, step < 1 ? 1 : 0) + '</text>';
    var skip = n > 8 ? 2 : 1;
    s.labels.forEach(function (lb, i) {
      var cx = m.l + band * i + band / 2;
      out += '<g class="bar-group" data-i="' + i + '"><rect x="' + (m.l + band * i) + '" y="' + m.t + '" width="' + band + '" height="' + ih + '" fill="transparent"/>' +
        '<rect class="bar-bg" style="--k:' + i + '" x="' + (cx - bw / 2) + '" y="' + y(s.a[i]) + '" width="' + bw + '" height="' + (ih - (y(s.a[i]) - m.t)) + '" rx="6"/>' +
        '<rect class="bar-fg" style="--k:' + (i + 3) + '" x="' + (cx - bw * 0.31) + '" y="' + y(s.b[i]) + '" width="' + (bw * 0.62) + '" height="' + (ih - (y(s.b[i]) - m.t)) + '" rx="5"/></g>';
      if (i % skip === 0 || i === n - 1) out += '<text x="' + cx + '" y="' + (H - 6) + '" text-anchor="middle">' + lb + '</text>';
    });
    chartEl.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">' + out + '</svg><div class="chart__tip" role="presentation"></div>';
    tip = $('.chart__tip', chartEl);
    $$('.bar-group', chartEl).forEach(function (g) {
      g.addEventListener('mouseenter', function () {
        var i = +g.getAttribute('data-i'), cx = m.l + band * i + band / 2;
        tip.innerHTML = '<b>' + s.labels[i] + '</b>Encaissé : ' + num(s.b[i], 1) + ' M FCFA<br>Attendu : ' + num(s.a[i], 1) + ' M FCFA<br>Recouvrement : ' + num(s.b[i] / s.a[i] * 100, 0) + ' %';
        tip.style.left = Math.max(70, Math.min(W - 70, cx)) + 'px';
        tip.style.top = (y(Math.max(s.a[i], s.b[i])) - 84) + 'px';
        tip.classList.add('is-on');
      });
      g.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });
    });
    $('#rev-sub').textContent = s.sub;
  }

  /* ---------- Anneau d'occupation ---------- */
  var C = 2 * Math.PI * 48;
  function renderDonut() {
    var p = PORT[state.port], tr = 2.6, va = +(100 - p.occ - tr).toFixed(1);
    var segs = [['Occupés', p.occ, 'var(--olive-600)'], ['Vacants', va, 'var(--sand-400)'], ['En travaux', tr, 'var(--terracotta-600)']];
    var svg = $('#donut-svg'), acc = 0;
    if (!svg.__init) {
      segs.forEach(function (s) { var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', 60); c.setAttribute('cy', 60); c.setAttribute('r', 48); c.setAttribute('stroke', s[2]); c.setAttribute('stroke-dasharray', '0 ' + C); svg.appendChild(c); });
      svg.__init = true;
    }
    var circles = $$('circle', svg).slice(1);
    requestAnimationFrame(function () {
      segs.forEach(function (s, i) {
        var len = Math.max(0, s[1] / 100 * C - 2);
        circles[i].setAttribute('stroke-dasharray', len + ' ' + (C - len));
        circles[i].setAttribute('stroke-dashoffset', -acc / 100 * C);
        acc += s[1];
      });
    });
    $('#donut-val').textContent = Math.round(p.occ) + '%';
    $('#donut-legend').innerHTML = segs.map(function (s) { return '<li><i style="--c:' + s[2] + '"></i>' + s[0] + '<b>' + num(s[1], 1) + ' %</b></li>'; }).join('');
  }

  /* ---------- Modes de paiement ---------- */
  function renderPay() {
    $('#hbars').innerHTML = PAY[state.port].map(function (r, i) {
      return '<div><div class="hbar__row"><span>' + r[0] + '</span><b>' + r[1] + ' %</b></div><div class="hbar__track"><span class="hbar__fill" style="--w:' + r[1] * 2 + '%;--c:' + r[2] + ';--k:' + i + '"></span></div></div>';
    }).join('');
  }

  /* ---------- Tableau des loyers en retard ---------- */
  function badgeFor(d) { return d > 30 ? '<span class="badge badge--danger badge--dot">Critique</span>' : d >= 15 ? '<span class="badge badge--warning badge--dot">En retard</span>' : '<span class="badge badge--info badge--dot">À relancer</span>'; }
  function rows() {
    return LATE.filter(function (r) {
      if (state.port !== 'all' && r.c !== state.port) return false;
      if (state.filter === 'crit' && !(r.d > 30)) return false;
      if (state.filter === 'mid' && !(r.d >= 15 && r.d <= 30)) return false;
      if (state.filter === 'low' && !(r.d < 15)) return false;
      if (state.q && (r.n + ' ' + r.b + ' ' + r.v).toLowerCase().indexOf(state.q) < 0) return false;
      return true;
    }).sort(function (a, b) { return b.d - a.d; });
  }
  function renderLate() {
    var rs = rows(), body = $('#late-body');
    if (!rs.length) {
      body.innerHTML = '<tr><td colspan="5"><div class="empty"><span class="icon-tile">' + I.icon('check-circle') + '</span><h4>Aucun loyer en retard ici</h4><p>Changez de filtre ou de site pour voir d’autres résultats.</p></div></td></tr>';
    } else {
      body.innerHTML = rs.map(function (r) {
        var id = r.n.replace(/\W/g, '');
        return '<tr><td><div class="who"><span class="avatar">' + r.i + '</span><div><strong>' + r.n + '</strong><span>' + r.b + ' · ' + r.v + '</span></div></div></td>' +
          '<td class="num"><strong>' + num(r.amt) + '</strong> <span class="text-muted t-xs">FCFA</span></td>' +
          '<td class="pill-late">' + r.d + ' j</td><td>' + badgeFor(r.d) + '</td>' +
          '<td><div class="row-actions">' + (reminded[id] ? '<span class="badge badge--success">' + I.icon('check', 'icon--sm') + 'Relancé</span>' : '<button class="btn btn--soft btn--sm" data-remind="' + id + '">Relancer</button>') + '</div></td></tr>';
      }).join('');
    }
    var tot = rs.reduce(function (a, r) { return a + r.amt; }, 0);
    $('#late-sub').textContent = rs.length + ' locataire' + (rs.length > 1 ? 's' : '') + ' · ' + I.fcfa(tot) + ' à recouvrer';
  }
  $('#late-body').addEventListener('click', function (e) {
    var b = e.target.closest('[data-remind]');
    if (!b) return;
    b.classList.add('is-loading');
    setTimeout(function () {
      reminded[b.getAttribute('data-remind')] = true;
      var name = b.closest('tr').querySelector('strong').textContent;
      b.parentNode.innerHTML = '<span class="badge badge--success" style="animation:pop-in .4s var(--ease-spring)">' + I.icon('check', 'icon--sm') + 'Relancé</span>';
      I.toast({ type: 'success', title: 'Relance envoyée', message: name + ' a reçu un message WhatsApp avec son lien de paiement.' });
    }, 800);
  });
  $('#late-filters').addEventListener('click', function (e) {
    var c = e.target.closest('.chip');
    if (!c) return;
    $$('.chip', this).forEach(function (x) { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', x === c); });
    state.filter = c.getAttribute('data-f');
    renderLate();
  });
  $('#global-search').addEventListener('input', function () { state.q = this.value.trim().toLowerCase(); renderLate(); });

  /* ---------- Rendu complet (avec squelette de chargement) ---------- */
  function renderAll() {
    renderKpis(); renderChart(); renderDonut(); renderPay(); renderLate();
    $('#scope-label').textContent = PORT[state.port].label;
  }
  function refresh() {
    main.setAttribute('data-loading', '');
    setTimeout(function () { renderAll(); main.removeAttribute('data-loading'); }, 520);
  }
  $('#portfolio').addEventListener('change', function () { state.port = this.value; refresh(); });
  $$('input[name=period]').forEach(function (r) { r.addEventListener('change', function () { state.period = r.value; refresh(); }); });

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (!main.hasAttribute('data-loading')) renderChart(); }, 150); });

  // premier chargement
  setTimeout(function () { renderAll(); main.removeAttribute('data-loading'); }, I.reduceMotion ? 0 : 1000);

  /* ---------- Suggestions IA ---------- */
  $('#ai-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-ai]');
    if (!b) return;
    var wrap = b.closest('.suggest-wrap');
    if (b.getAttribute('data-ai') === 'ok') I.toast({ type: 'success', title: b.getAttribute('data-msg'), message: b.getAttribute('data-text') });
    wrap.classList.add('is-removed');
    setTimeout(function () {
      wrap.remove();
      if (!$('.suggest-wrap', $('#ai-list'))) { var em = $('#ai-empty'); em.hidden = false; em.style.animation = 'pop-in .6s var(--ease-out)'; }
    }, 520);
  });

  /* ---------- Navigation mobile, liens « bientôt », cloche, export ---------- */
  var app = $('#app');
  $$('[data-nav-toggle]').forEach(function (b) { b.addEventListener('click', function () { app.classList.toggle('is-nav-open'); }); });
  $$('[data-nav-close]').forEach(function (b) { b.addEventListener('click', function () { app.classList.remove('is-nav-open'); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') app.classList.remove('is-nav-open'); });
  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-soon]');
    if (s) { e.preventDefault(); app.classList.remove('is-nav-open'); I.toast({ title: 'Bientôt dans la maquette', message: 'Cette page n’est pas encore dessinée.', duration: 2600 }); }
  });
  $('#bell').addEventListener('click', function () {
    this.classList.remove('notif-dot');
    I.toast({ title: '3 notifications', message: '2 paiements reçus et 1 bail à renouveler dans 12 jours.' });
  });
  $('#export-btn').addEventListener('click', function () {
    var b = this; b.classList.add('is-loading');
    setTimeout(function () { b.classList.remove('is-loading'); I.toast({ type: 'success', title: 'Export prêt', message: 'Fichier simulé : cette maquette ne télécharge rien.' }); }, 1100);
  });

  /* ---------- Formulaire « Ajouter un bien » ---------- */
  var loyer = $('#b-loyer');
  loyer.addEventListener('blur', function () { var d = this.value.replace(/\D/g, ''); if (d) this.value = new Intl.NumberFormat('fr-FR').format(parseInt(d, 10)); });
  $('#form-bien').addEventListener('immo:submit', function () {
    I.closeModal('modal-bien');
    var badge = $('.side-link .badge'); if (badge) badge.textContent = (parseInt(badge.textContent, 10) || 0) + 1;
  });

  /* ---------- Simulation d'un paiement en direct ---------- */
  setTimeout(function () {
    var tl = $('#timeline'), li = document.createElement('li');
    $$('li.is-new', tl).forEach(function (x) { x.classList.remove('is-new'); });
    li.className = 'is-new';
    li.style.animation = 'pop-in .6s var(--ease-out)';
    li.innerHTML = '<strong>Paiement Orange Money reçu</strong> — Kouassi Y., 650 000 FCFA<time>À l’instant</time>';
    tl.insertBefore(li, tl.firstChild);
    I.toast({ type: 'success', title: 'Paiement reçu', message: 'Orange Money · 650 000 FCFA · Villa Angré' });
  }, 9000);
})();
