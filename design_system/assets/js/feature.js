/* ==========================================================================
   Immo+ — Page fonctionnalité : flux de paiements, parcours animé, simulateur
   ========================================================================== */
(function () {
  'use strict';
  var I = window.Immo, $ = I.$, $$ = I.$$, num = I.num, reduce = I.reduceMotion;

  /* ---------- 1. Téléphone : paiements Mobile Money qui arrivent ---------- */
  var FEED = [
    ['AD', 'Aminata D.', 'Orange Money · Apt B12', 250000, ''],
    ['KY', 'Kouassi Y.', 'Orange Money · Villa Angré', 650000, 'terracotta'],
    ['FS', 'Fatou S.', 'Wave · Apt 3B', 120000, 'olive'],
    ['IK', 'Ibrahim K.', 'Wave · Rés. Palmiers', 400000, 'olive'],
    ['JM', 'Jean-Marc M.', 'MTN MoMo · Studio Bonanjo', 300000, ''],
    ['AT', 'Awa T.', 'Orange Money · Riviera 3', 250000, 'terracotta'],
    ['BN', 'Binta N.', 'Wave · Apt 2A', 350000, 'olive']
  ];
  var list = $('#phone-list'), totalEl = $('#phone-total'), total = 48240000, idx = 0;
  function pushPayment(animate) {
    var p = FEED[idx++ % FEED.length], row = document.createElement('div');
    row.className = 'pay-row';
    if (!animate) row.style.animation = 'none';
    row.innerHTML = '<span class="avatar avatar--' + (p[4] || 'olive') + '">' + p[0] + '</span><div><strong>' + p[1] + '</strong><span>' + p[2] + '</span></div><b>+' + num(p[3]) + '</b>';
    list.insertBefore(row, list.firstChild);
    while (list.children.length > 5) list.removeChild(list.lastChild);
    if (animate) {
      totalEl.setAttribute('data-from', total);
      total += p[3];
      totalEl.setAttribute('data-count', total);
      totalEl.setAttribute('data-duration', 900);
      I.animateCount(totalEl);
    }
  }
  if (list) {
    for (var k = 0; k < 4; k++) pushPayment(false);
    var timer = null;
    var phoneIO = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && !reduce) { if (!timer) timer = setInterval(function () { pushPayment(true); }, 2800); }
      else { clearInterval(timer); timer = null; }
    });
    phoneIO.observe(list);
  }

  /* ---------- 2. Parcours animé ---------- */
  var flow = $('#flow');
  if (flow) {
    var steps = $$('.flow__step', flow), panels = $$('.flow__panel', flow), cur = 0, hover = false, visible = false;
    var sync = function () { flow.classList.toggle('is-paused', hover || !visible); };
    var go = function (i) {
      steps.forEach(function (s, k) {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-done', k < i);
        s.setAttribute('aria-selected', k === i);
        panels[k].classList.toggle('is-active', k === i);
      });
      cur = i;
    };
    steps.forEach(function (s, i) {
      s.addEventListener('click', function () { if (i !== cur) go(i); });
      $('.flow__bar i', s).addEventListener('animationend', function () { if (!reduce && i === cur) go((i + 1) % steps.length); });
    });
    flow.addEventListener('mouseenter', function () { hover = true; sync(); });
    flow.addEventListener('mouseleave', function () { hover = false; sync(); });
    flow.addEventListener('focusin', function () { hover = true; sync(); });
    flow.addEventListener('focusout', function () { hover = false; sync(); });
    flow.classList.add('is-paused');
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; sync(); }, { threshold: 0.35 }).observe(flow);
  }

  /* ---------- 3. Simulateur de gain ---------- */
  var sim = $('.sim');
  if (sim) {
    var f = { b: $('#s-biens'), l: $('#s-loyer'), i: $('#s-imp'), h: $('#s-h') };
    var out = { fcfa: $('#r-fcfa'), h: $('#r-h') };
    var shown = { fcfa: 0, h: 0 }, raf = {};
    function tween(key, to, render) {
      var from = shown[key], t0 = null, dur = reduce ? 1 : 650;
      cancelAnimationFrame(raf[key]);
      (function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
        shown[key] = from + (to - from) * e;
        render(shown[key]);
        if (p < 1) raf[key] = requestAnimationFrame(step);
      })(performance.now());
    }
    var money = function (v) { return v >= 1e6 ? num(v / 1e6, 1) + '<small>M FCFA</small>' : num(Math.round(v / 1000) * 1000) + '<small>FCFA</small>'; };
    function calc() {
      var n = +f.b.value, loyer = +f.l.value, taux = +f.i.value / 100, h = +f.h.value;
      $('#o-biens').textContent = num(n);
      $('#o-loyer').textContent = I.fcfa(loyer);
      $('#o-imp').textContent = f.i.value + ' %';
      $('#o-h').textContent = h + ' h';
      tween('fcfa', n * loyer * taux * 0.4, function (v) { out.fcfa.innerHTML = money(v); });
      tween('h', h * 4.33 * 0.6, function (v) { out.h.innerHTML = num(v, 0) + '<small>heures</small>'; });
    }
    Object.keys(f).forEach(function (k) { f[k].addEventListener('input', calc); });
    var ready = false;
    new IntersectionObserver(function (en, o) { if (en[0].isIntersecting && !ready) { ready = true; calc(); o.disconnect(); } }, { threshold: 0.3 }).observe(sim);
  }
})();
