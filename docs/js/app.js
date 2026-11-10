/* app.js: prototype behaviour for the Allegro product discovery model.
   Vanilla JS, written directly (never generated). Every feature is driven by
   data- attributes so pages stay declarative. State that crosses pages uses
   ?query params first and sessionStorage as a fallback. */
(function () {
  'use strict';

  var D = window.ALLEGRO;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var params = new URLSearchParams(window.location.search);

  function store(k, v) {
    try {
      if (v === undefined) { var raw = window.sessionStorage.getItem('al-' + k); return raw ? JSON.parse(raw) : null; }
      window.sessionStorage.setItem('al-' + k, JSON.stringify(v));
    } catch (e) { return null; }
    return v;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function root() { var a = $('[data-root]'); return a ? a.getAttribute('href') : './'; }
  function url(p) { return root() + p; }
  function toast(msg) {
    var t = $('[data-toast]'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    window.clearTimeout(toast.t); toast.t = window.setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* ---------------------------------------------------------------------
     Region: currency and which distributors are shown */
  var REGIONS = {
    US: { cur: 'USD', sym: '$', fx: 1, dist: ['DigiKey', 'Mouser', 'Arrow'] },
    DE: { cur: 'EUR', sym: '€', fx: 0.92, dist: ['DigiKey', 'Mouser', 'Future Electronics'] },
    CN: { cur: 'CNY', sym: '¥', fx: 7.1, dist: ['DigiKey', 'Arrow'] },
    JP: { cur: 'JPY', sym: '¥', fx: 150, dist: ['DigiKey', 'Mouser'] },
    IN: { cur: 'USD', sym: '$', fx: 1, dist: ['DigiKey', 'Mouser'] },
    KR: { cur: 'USD', sym: '$', fx: 1, dist: ['DigiKey', 'Mouser'] },
    TW: { cur: 'USD', sym: '$', fx: 1, dist: ['DigiKey', 'Arrow'] },
    PH: { cur: 'USD', sym: '$', fx: 1, dist: ['DigiKey', 'Arrow'] }
  };
  function region() { return REGIONS[store('region') || 'US'] ? (store('region') || 'US') : 'US'; }
  function money(usd) {
    var r = REGIONS[region()]; var v = usd * r.fx;
    return r.sym + (r.fx >= 100 ? Math.round(v).toLocaleString('en-GB') : v.toFixed(2)) + ' ' + r.cur;
  }

  /* ---------------------------------------------------------------------
     Orderable parts. A1335 is defined in data.js; others are synthesised
     deterministically so the sample behaves the same on every visit. */
  function seed(s) { var n = 0; for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 9973; return n; }
  function opnsFor(id) {
    if (D.opns[id]) return D.opns[id];
    var n = seed(id);
    return [
      { opn: id + 'LLETR-T', pkg: 'TSSOP-14, tape and reel', temp: '-40°C to 150°C', market: 'Automotive', moq: 4000, price: 2.5 + (n % 300) / 100, stock: (n % 3 === 0) ? 0 : (n % 50) * 120, lead: (n % 3 === 0) ? '12 weeks' : 'In stock', sample: true, dist: { DigiKey: (n % 7) * 85, Mouser: (n % 5) * 40, Arrow: 0 } },
      { opn: id + 'GLPTR-T', pkg: 'SOIC-8, tape and reel', temp: '-40°C to 150°C', market: 'Automotive', moq: 3000, price: 2.2 + (n % 250) / 100, stock: (n % 4) * 900, lead: (n % 4) ? 'In stock' : '10 weeks', sample: n % 2 === 0, dist: { DigiKey: (n % 9) * 60, Mouser: 0 } }
    ];
  }
  function inStock(id) { return opnsFor(id).some(function (o) { return o.stock > 0; }); }
  function findOpn(code) {
    code = code.toUpperCase();
    for (var i = 0; i < D.parts.length; i++) {
      var list = opnsFor(D.parts[i].id);
      for (var j = 0; j < list.length; j++) if (list[j].opn === code) return { part: D.parts[i], opn: list[j] };
    }
    return null;
  }

  /* ---------------------------------------------------------------------
     Basket: samples, quotes and (future) direct purchase */
  function basket() { return store('basket') || []; }
  function setBasket(b) { store('basket', b); renderBasketCount(); }
  function addToBasket(opn, mode, qty) {
    var b = basket();
    var existing = b.filter(function (x) { return x.opn === opn && x.mode === mode; })[0];
    if (existing) existing.qty = qty || existing.qty; else b.push({ opn: opn, mode: mode, qty: qty || (mode === 'sample' ? 5 : 1000) });
    setBasket(b);
    toast(opn + (mode === 'sample' ? ' added to samples' : mode === 'quote' ? ' added to quote request' : ' added to basket'));
  }
  function renderBasketCount() { $$('[data-basket-count]').forEach(function (el) { el.textContent = basket().length; }); }

  /* ---------------------------------------------------------------------
     Design profile: the "my vehicle" idea. Requirements set once in the
     finder are remembered and used to mark parts that fit. */
  function profile() { return store('profile'); }
  function fits(p, pr) {
    if (!pr) return null;
    if (pr.type && pr.type !== 'angle') return false;
    if (pr.market && p.market.indexOf(pr.market) < 0) return false;
    if (pr.safety && safetyRank(p.safety) < safetyRank(pr.safety)) return false;
    if (pr.mount && p.mount.indexOf(pr.mount) < 0) return false;
    if (pr.iface && p.iface.indexOf(pr.iface) < 0) return false;
    if (pr.volt && !(p.supply[0] <= pr.volt && p.supply[1] >= pr.volt)) return false;
    if (pr.tmax && p.tmax < pr.tmax) return false;
    return true;
  }
  function safetyRank(s) { return { QM: 0, 'ASIL B': 1, 'ASIL C': 2, 'ASIL D': 3 }[s] || 0; }
  function profileSummary(pr) {
    var bits = [];
    if (pr.market) bits.push(pr.market);
    if (pr.safety) bits.push(pr.safety + ' or higher');
    if (pr.mount) bits.push(pr.mount);
    if (pr.iface) bits.push(pr.iface);
    if (pr.volt) bits.push(pr.volt + ' V supply');
    if (pr.tmax) bits.push('to ' + pr.tmax + '°C');
    return bits.join(' · ') || 'No requirements set';
  }
  function renderProfileBars() {
    $$('[data-profile-bar]').forEach(function (bar) {
      var pr = profile();
      if (!pr) { bar.hidden = true; return; }
      bar.hidden = false;
      bar.innerHTML = '<strong>Your design:</strong> <span>' + esc(pr.name || 'Untitled design') + '</span><span class="wf-meta">' + esc(profileSummary(pr)) + '</span>' +
        '<a href="' + url('pages/finder.html') + '">Edit</a> <button type="button" class="btn btn-sm btn-ghost" data-profile-clear>Clear</button>';
      $('[data-profile-clear]', bar).addEventListener('click', function () { store('profile', null); try { sessionStorage.removeItem('al-profile'); } catch (e) {} renderProfileBars(); if (window.__relist) window.__relist(); toast('Design profile cleared'); });
    });
  }

  /* ---------------------------------------------------------------------
     Prototype navigator, pager */
  var SEQ = [
    { f: 'index.html', t: 'Overview', pn: 'index' },
    { f: 'pages/home.html', t: 'Home: four ways in', pn: 'home' },
    { f: 'pages/search.html?q=A1335', t: '1 · Search for a part', pn: 'j1', key: 'search' },
    { f: 'pages/part.html?id=A1335', t: '1 · Part page', pn: 'j1', key: 'part' },
    { f: 'pages/basket.html', t: '1 · Samples, quote and buy', pn: 'j1', key: 'basket' },
    { f: 'pages/products.html', t: '2 · Products', pn: 'j2', key: 'products' },
    { f: 'pages/listing.html?type=angle', t: '2 · Filter the product type', pn: 'j2', key: 'listing' },
    { f: 'pages/compare.html', t: '2 · Compare parts', pn: 'j2', key: 'compare' },
    { f: 'pages/applications.html', t: '3 · Applications', pn: 'j3', key: 'applications' },
    { f: 'pages/system.html?id=sbw', t: '3 · Steer-by-Wire system', pn: 'j3', key: 'system' },
    { f: 'pages/finder.html', t: '4 · Product Finder', pn: 'j4', key: 'finder' },
    { f: 'thinking.html', t: 'Our thinking', pn: 'thinking', key: 'thinking' }
  ];
  function initProtoNav() {
    var key = document.body.getAttribute('data-page') || 'index';
    var cur = SEQ.filter(function (s) { return (s.key || s.pn) === key; })[0];
    if (cur) $$('.proto-nav [data-pn]').forEach(function (a) { if (a.getAttribute('data-pn') === cur.pn) a.classList.add('current'); });
    var host = $('[data-pager]'); if (!host || !cur) return;
    var i = SEQ.indexOf(cur), prev = SEQ[i - 1], next = SEQ[i + 1];
    host.innerHTML = (prev ? '<a href="' + url(prev.f) + '"><small>Previous</small>&larr; ' + esc(prev.t) + '</a>' : '<span></span>') +
      (next ? '<a href="' + url(next.f) + '" style="text-align:right"><small>Next</small>' + esc(next.t) + ' &rarr;</a>' : '<span></span>');
  }

  /* ---------------------------------------------------------------------
     Header utilities: region and language */
  var I18N = {
    zh: { 'Supply voltage': '电源电压', 'Resolution': '分辨率', 'Response time': '响应时间', 'Sensing axis': '敏感轴', 'Max temperature': '最高温度', 'Interfaces': '接口', 'Functional safety': '功能安全', 'Markets': '市场', 'Availability': '供货情况', 'Order sample': '申请样品', 'Add to quote': '加入询价', 'Buy': '购买', 'Datasheet': '数据手册', 'Key specifications': '关键参数' },
    ja: { 'Supply voltage': '電源電圧', 'Resolution': '分解能', 'Response time': '応答時間', 'Sensing axis': '感度軸', 'Max temperature': '最高温度', 'Interfaces': 'インターフェース', 'Functional safety': '機能安全', 'Markets': '市場', 'Availability': '在庫状況', 'Order sample': 'サンプル請求', 'Add to quote': '見積に追加', 'Buy': '購入', 'Datasheet': 'データシート', 'Key specifications': '主な仕様' }
  };
  function t(label) { var l = store('lang') || 'en'; return (I18N[l] && I18N[l][label]) || label; }
  function initUtil() {
    var r = $('[data-region]');
    if (r) {
      r.value = region();
      r.addEventListener('change', function () { store('region', r.value); toast('Region set to ' + r.options[r.selectedIndex].text + '. Prices and distributors update.'); rerender(); });
    }
    var l = $('[data-lang]');
    if (l) {
      l.value = store('lang') || 'en';
      l.addEventListener('change', function () { store('lang', l.value); toast(l.value === 'en' ? 'English' : 'Labels translated. Part numbers, values and URLs stay the same.'); rerender(); });
    }
  }
  var renderers = [];
  function rerender() { renderers.forEach(function (fn) { fn(); }); }

  /* ---------------------------------------------------------------------
     Search: typeahead and results */
  var DOCS = [
    { t: 'A1335 datasheet', k: 'Datasheet', parts: ['A1335'] },
    { t: 'Advanced On-Chip Linearization in the A1335 Angle Sensor IC (AN296127)', k: 'Application note', parts: ['A1335'] },
    { t: 'Using the A1335 in a Short Stroke Application (AN296166)', k: 'Application note', parts: ['A1335'] },
    { t: 'Applying Harmonic Compensation to the A1335 Output Signal', k: 'Application note', parts: ['A1335'] },
    { t: 'A1335 Programming Manual', k: 'User guide', parts: ['A1335'] },
    { t: 'Output Protocols for Angle and Linear Position Sensors (AN296191)', k: 'Application note', parts: ['A1335', 'A33020', 'A1337'] },
    { t: 'Guidelines for Using Allegro Angular Sensors', k: 'Application note', parts: ['A1335', 'A1330', 'A1339'] },
    { t: 'Steer-by-wire: designing for fail-operational sensing', k: 'Article', parts: ['A33020', 'A33110'] }
  ];
  function searchAll(q) {
    q = (q || '').trim(); var Q = q.toUpperCase(); var res = { parts: [], opns: [], xref: [], types: [], apps: [], docs: [] };
    if (!q) return res;
    D.parts.forEach(function (p) { if (p.id.indexOf(Q) === 0 || (Q.length > 3 && p.name.toUpperCase().indexOf(Q) >= 0)) res.parts.push(p); });
    D.parts.forEach(function (p) { opnsFor(p.id).forEach(function (o) { if (Q.length >= 4 && o.opn.indexOf(Q) === 0) res.opns.push({ p: p, o: o }); }); });
    Object.keys(D.xref).forEach(function (k) { if (Q.length >= 3 && k.indexOf(Q) === 0) res.xref.push({ k: k, x: D.xref[k] }); });
    D.types.forEach(function (ty) { if (Q.length > 2 && (ty.name + ' ' + ty.group).toUpperCase().indexOf(Q) >= 0) res.types.push(ty); });
    Object.keys(D.applications).forEach(function (k) { if (Q.length > 2 && D.applications[k].toUpperCase().indexOf(Q) >= 0) res.apps.push({ k: k, n: D.applications[k] }); });
    if (/角度|角度センサ/.test(q)) res.types.push(D.types[0]);
    DOCS.forEach(function (d) { if (Q.length > 2 && (d.t.toUpperCase().indexOf(Q) >= 0 || d.parts.indexOf(Q) >= 0)) res.docs.push(d); });
    res.parts.sort(function (a, b) { return (a.id === Q ? -1 : 0) - (b.id === Q ? -1 : 0) || a.id.length - b.id.length; });
    return res;
  }
  function hl(s, q) { var i = s.toUpperCase().indexOf(q.toUpperCase()); return i < 0 ? esc(s) : esc(s.slice(0, i)) + '<strong>' + esc(s.slice(i, i + q.length)) + '</strong>' + esc(s.slice(i + q.length)); }
  function initTypeahead() {
    $$('[data-typeahead]').forEach(function (form) {
      var input = $('input', form), box = $('.typeahead', form), active = -1;
      function links() { return $$('a', box); }
      function render() {
        var q = input.value.trim(); var r = searchAll(q); var h = '';
        if (!q) { box.classList.remove('open'); return; }
        if (r.parts.length) h += '<h6>Parts</h6>' + r.parts.slice(0, 5).map(function (p) { return '<a href="' + url('pages/part.html?id=' + p.id) + '">' + hl(p.id, q) + ' <span class="ta-meta">' + esc(p.name) + '</span></a>'; }).join('');
        if (r.opns.length) h += '<h6>Orderable part numbers</h6>' + r.opns.slice(0, 4).map(function (x) { return '<a href="' + url('pages/part.html?id=' + x.p.id + '&opn=' + x.o.opn) + '">' + hl(x.o.opn, q) + ' <span class="ta-meta">' + (x.o.stock > 0 ? 'In stock' : 'Lead time ' + esc(x.o.lead)) + '</span></a>'; }).join('');
        if (r.xref.length) h += '<h6>Cross-reference</h6>' + r.xref.map(function (x) { return '<a href="' + url('pages/search.html?q=' + x.k) + '">' + hl(x.k, q) + ' <span class="ta-meta">&rarr; Allegro ' + esc(x.x.match) + ' (' + esc(x.x.type.toLowerCase()) + ')</span></a>'; }).join('');
        if (r.types.length) h += '<h6>Product types</h6>' + r.types.slice(0, 3).map(function (ty) { return '<a href="' + url('pages/listing.html?type=' + ty.id) + '">' + hl(ty.name, q) + ' <span class="ta-meta">' + ty.count + ' parts</span></a>'; }).join('');
        if (r.apps.length) h += '<h6>Applications</h6>' + r.apps.slice(0, 3).map(function (a) { return '<a href="' + url('pages/system.html?id=' + a.k) + '">' + hl(a.n, q) + '</a>'; }).join('');
        if (r.docs.length) h += '<h6>Documents</h6>' + r.docs.slice(0, 3).map(function (d) { return '<a href="#">' + hl(d.t, q) + ' <span class="ta-meta">' + esc(d.k) + '</span></a>'; }).join('');
        if (!h) h = '<h6>No direct matches</h6><a href="' + url('pages/search.html?q=' + encodeURIComponent(q)) + '">Search everything for &ldquo;' + esc(q) + '&rdquo;</a><a href="' + url('pages/finder.html') + '">Not sure of the part? Use the Product Finder</a>';
        box.innerHTML = h; box.classList.add('open'); active = -1;
      }
      input.addEventListener('input', render);
      input.addEventListener('focus', render);
      input.addEventListener('keydown', function (e) {
        var ls = links();
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); if (!ls.length) return;
          active = (active + (e.key === 'ArrowDown' ? 1 : -1) + ls.length) % ls.length;
          ls.forEach(function (a, i) { a.classList.toggle('active', i === active); });
        } else if (e.key === 'Enter' && active >= 0 && ls[active]) { e.preventDefault(); window.location.href = ls[active].href; }
        else if (e.key === 'Escape') box.classList.remove('open');
      });
      form.addEventListener('submit', function (e) {
        /* An exact part or orderable part number skips the results page. */
        var q = input.value.trim().toUpperCase();
        if (D.part(q)) { e.preventDefault(); window.location.href = url('pages/part.html?id=' + q); return; }
        var o = q && findOpn(q); if (o) { e.preventDefault(); window.location.href = url('pages/part.html?id=' + o.part.id + '&opn=' + o.opn.opn); }
      });
      document.addEventListener('click', function (e) { if (!form.contains(e.target)) box.classList.remove('open'); });
    });
  }

  function initSearchPage() {
    var host = $('[data-search-results]'); if (!host) return;
    var q = params.get('q') || store('lastq') || 'A1335'; store('lastq', q);
    $$('[data-q]').forEach(function (el) { el.textContent = q; });
    var gi = $('#q-global'); if (gi) gi.value = q;
    var r = searchAll(q); var Q = q.toUpperCase(); var exact = D.part(Q);
    var h = '';
    if (r.xref.length) {
      var x = r.xref[0], mp = D.part(x.x.match);
      h += '<section class="box" aria-label="Cross-reference"><p class="wf-meta">Cross-reference for ' + esc(x.k) + '</p><h2 style="font-size:1.375rem">Allegro ' + esc(mp.id) + ' <span class="pill">' + esc(x.x.type) + '</span></h2><p>' + esc(mp.name) + '</p><p class="wf-meta">' + esc(x.x.note) + '</p>' +
        '<div class="row"><a class="btn" href="' + url('pages/part.html?id=' + mp.id) + '">View ' + esc(mp.id) + '</a><a class="btn btn-ghost" href="' + url('pages/compare.html?ids=' + mp.id + ',' + D.parts.filter(function (p) { return p.id !== mp.id && p.tech === mp.tech; })[0].id) + '">Compare with similar Allegro parts</a></div></section>';
    }
    if (exact) {
      var os = opnsFor(exact.id);
      h += '<section class="box" aria-label="Exact match"><p class="wf-meta">Exact part match</p><div class="two-col"><div><h2 style="font-size:1.5rem">' + esc(exact.id) + ' <span class="pill">' + esc(exact.status) + '</span></h2><p>' + esc(exact.name) + '</p>' +
        '<dl class="kv"><dt>Supply</dt><dd>' + exact.supply[0] + ' to ' + exact.supply[1] + ' V</dd><dt>Resolution</dt><dd>' + exact.res + ' bit</dd><dt>Interfaces</dt><dd>' + esc(exact.iface.join(', ')) + '</dd><dt>Markets</dt><dd>' + esc(exact.market.join(', ')) + '</dd></dl></div>' +
        '<div class="stack"><a class="btn" href="' + url('pages/part.html?id=' + exact.id) + '">Open part page</a><a class="btn btn-ghost" href="#">Datasheet (PDF)</a><a class="btn btn-ghost" href="' + url('pages/part.html?id=' + exact.id) + '#buy">Samples and availability</a><p class="wf-meta">' + os.length + ' orderable versions · ' + (inStock(exact.id) ? 'some in stock' : 'lead time applies') + '</p></div></div></section>';
    }
    var rest = r.parts.filter(function (p) { return p !== exact; });
    h += '<div class="tabs" role="tablist"><button class="tab active" data-tab="t-all">All</button><button class="tab" data-tab="t-parts">Parts (' + rest.length + ')</button><button class="tab" data-tab="t-docs">Documents (' + r.docs.length + ')</button><button class="tab" data-tab="t-other">Product types and applications (' + (r.types.length + r.apps.length) + ')</button></div>';
    var partsHtml = rest.map(function (p) { return '<div class="result-item"><h3><a href="' + url('pages/part.html?id=' + p.id) + '">' + esc(p.id) + '</a></h3><p>' + esc(p.name) + '</p><p class="wf-meta">Magnetic Rotary Angle Sensors · ' + esc(p.market.join(', ')) + '</p></div>'; }).join('') || '<p class="wf-meta" style="padding:1rem 0">No other parts.</p>';
    var opnHtml = r.opns.map(function (x) { return '<div class="result-item"><h3><a href="' + url('pages/part.html?id=' + x.p.id + '&opn=' + x.o.opn) + '">' + esc(x.o.opn) + '</a></h3><p class="wf-meta">Orderable version of ' + esc(x.p.id) + ' · ' + esc(x.o.pkg) + '</p></div>'; }).join('');
    var docsHtml = r.docs.map(function (d) { return '<div class="result-item"><span class="pill">' + esc(d.k) + '</span><h3><a href="#">' + esc(d.t) + '</a></h3><p class="wf-meta">Applies to ' + esc(d.parts.join(', ')) + '</p></div>'; }).join('') || '<p class="wf-meta" style="padding:1rem 0">No documents.</p>';
    var otherHtml = r.types.map(function (ty) { return '<div class="result-item"><span class="pill">Product type</span><h3><a href="' + url('pages/listing.html?type=' + ty.id) + '">' + esc(ty.name) + '</a></h3><p class="wf-meta">' + ty.count + ' parts</p></div>'; }).join('') + r.apps.map(function (a) { return '<div class="result-item"><span class="pill">Application</span><h3><a href="' + url('pages/system.html?id=' + a.k) + '">' + esc(a.n) + '</a></h3></div>'; }).join('') || '<p class="wf-meta" style="padding:1rem 0">None.</p>';
    h += '<div><div class="tab-panel active" id="t-all">' + opnHtml + partsHtml + docsHtml + '</div><div class="tab-panel" id="t-parts">' + opnHtml + partsHtml + '</div><div class="tab-panel" id="t-docs">' + docsHtml + '</div><div class="tab-panel" id="t-other">' + otherHtml + '</div></div>';
    if (!exact && !r.xref.length && !r.parts.length && !r.opns.length) h = '<div class="box"><h2 style="font-size:1.25rem">No parts match &ldquo;' + esc(q) + '&rdquo;</h2><p>Try a shorter part number, a competitor part number, or tell us what you need.</p><a class="btn" href="' + url('pages/finder.html') + '">Use the Product Finder</a></div>';
    host.innerHTML = h;
    initResultTabs(host);
  }
  function initResultTabs(scope) {
    $$('.tabs', scope).forEach(function (group) {
      var tabs = $$('.tab', group);
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (x) { x.classList.toggle('active', x === tab); });
          var target = document.getElementById(tab.getAttribute('data-tab'));
          $$('.tab-panel', target.parentElement).forEach(function (p) { p.classList.toggle('active', p === target); });
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Part page */
  function initPartPage() {
    var host = $('[data-part]'); if (!host) return;
    var id = (params.get('id') || store('lastpart') || 'A1335').toUpperCase();
    var p = D.part(id) || D.part('A1335'); store('lastpart', p.id);
    var focusOpn = params.get('opn');
    document.title = p.id + ' | ' + p.name + ' | Allegro MicroSystems (prototype)';
    function render() {
      $$('[data-p]').forEach(function (el) {
        var k = el.getAttribute('data-p');
        var v = { id: p.id, name: p.name, status: p.status, tech: p.tech, market: p.market.join(', '), safety: p.safety }[k];
        if (v !== undefined) el.textContent = v;
      });
      $$('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
      var spec = $('[data-specs]');
      if (spec) spec.innerHTML = [
        ['Supply voltage', p.supply[0] + ' to ' + p.supply[1] + ' V'], ['Resolution', p.res + ' bit'], ['Response time', p.resp + ' µs'],
        ['Sensing axis', p.axis], ['Max temperature', p.tmax + '°C'], ['Interfaces', p.iface.join(', ')],
        ['Functional safety', p.safety + (p.aec ? ' · AEC-Q100' : '')], ['Markets', p.market.join(', ')]
      ].map(function (r) { return '<dt>' + esc(t(r[0])) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
      var used = $('[data-used-in]');
      if (used) used.innerHTML = p.apps.map(function (a) { return '<li><a href="' + url('pages/system.html?id=' + a) + '">' + esc(D.applications[a]) + '</a></li>'; }).join('');
      var reg = REGIONS[region()];
      var tb = $('[data-opns]');
      if (tb) tb.innerHTML = opnsFor(p.id).map(function (o, i) {
        var dists = reg.dist.map(function (d) { return '<li>' + esc(d) + ': ' + ((o.dist[d] || 0) > 0 ? o.dist[d].toLocaleString('en-GB') + ' in stock' : 'none') + ' <a href="#">Buy at ' + esc(d) + '</a></li>'; }).join('');
        return '<tr class="' + (o.opn === focusOpn ? 'match' : '') + '"><td><strong>' + esc(o.opn) + '</strong><br><span class="wf-meta">' + esc(o.pkg) + '</span></td><td>' + esc(o.temp) + '<br><span class="wf-meta">' + esc(o.market) + '</span></td>' +
          '<td class="num">' + (o.stock > 0 ? '<strong>' + o.stock.toLocaleString('en-GB') + '</strong> in stock' : 'Lead time ' + esc(o.lead)) + '<br><span class="wf-meta">MOQ ' + o.moq.toLocaleString('en-GB') + '</span></td>' +
          '<td class="num">' + money(o.price) + '<br><span class="wf-meta">per unit at MOQ</span></td>' +
          '<td><div class="row">' + (o.sample ? '<button class="btn btn-sm" data-add="sample" data-opn="' + esc(o.opn) + '">' + esc(t('Order sample')) + '</button>' : '<span class="wf-meta">No samples</span>') +
          '<button class="btn btn-sm btn-ghost" data-add="quote" data-opn="' + esc(o.opn) + '">' + esc(t('Add to quote')) + '</button></div>' +
          '<details style="margin-top:0.4rem"><summary class="wf-meta">Distributors (' + esc(region()) + ')</summary><ul style="font-size:0.8125rem;padding-left:1rem">' + dists + '</ul></details></td></tr>';
      }).join('');
      $$('[data-add]', host).forEach(function (b) { b.addEventListener('click', function () { addToBasket(b.getAttribute('data-opn'), b.getAttribute('data-add')); }); });
      var sim = $('[data-similar]');
      if (sim) {
        var list = D.parts.filter(function (x) { return x.id !== p.id && (x.tech === p.tech || x.iface.some(function (i) { return p.iface.indexOf(i) >= 0; })); }).slice(0, 4);
        sim.innerHTML = list.map(function (x) {
          return '<article class="card"><h3 class="card-title"><a href="' + url('pages/part.html?id=' + x.id) + '">' + esc(x.id) + '</a></h3><p class="card-text">' + esc(x.name) + '</p><p class="wf-meta">' + x.res + ' bit · ' + x.resp + ' µs · ' + esc(x.safety) + '</p><label style="font-weight:400"><input type="checkbox" data-compare="' + esc(x.id) + '"> Compare</label></article>';
        }).join('');
        bindCompare(sim);
      }
      $$('[data-not-a1335]').forEach(function (el) { el.hidden = p.id === 'A1335'; });
      var fitEl = $('[data-fit]'); var pr = profile();
      if (fitEl) { var f = fits(p, pr); fitEl.innerHTML = f === null ? '' : f ? '<span class="fits">Fits your design: ' + esc(pr.name || '') + '</span>' : '<span class="nofit">Does not meet every requirement in your design profile</span>'; }
      var me = $('[data-compare-self]'); if (me) { me.setAttribute('data-compare', p.id); bindCompare(me.parentElement); }
    }
    renderers.push(render); render();
    if (focusOpn) { var b = $('#buy'); if (b) b.scrollIntoView(); }
  }

  /* ---------------------------------------------------------------------
     Compare tray */
  function cmp() { return store('compare') || []; }
  function setCmp(list) { store('compare', list); renderTray(); }
  function renderTray() {
    var tray = $('[data-tray]'); if (!tray) return;
    var list = cmp(); var onCompare = document.body.getAttribute('data-page') === 'compare';
    tray.classList.toggle('show', list.length > 0 && !onCompare);
    document.body.classList.toggle('has-tray', list.length > 0 && !onCompare);
    $('[data-tray-items]', tray).innerHTML = list.map(function (id) { return '<span class="pill">' + esc(id) + '</span>'; }).join(' ') + (list.length < 2 ? ' <span class="wf-meta">Pick at least two</span>' : '');
    var go = $('[data-tray-go]', tray); go.href = url('pages/compare.html?ids=' + list.join(','));
    go.classList.toggle('btn-ghost', list.length < 2);
    $$('[data-compare]').forEach(function (cb) { cb.checked = list.indexOf(cb.getAttribute('data-compare')) >= 0; });
  }
  function bindCompare(scope) {
    $$('[data-compare]', scope).forEach(function (cb) {
      if (cb.__b) return; cb.__b = true;
      cb.addEventListener('change', function () {
        var list = cmp(); var id = cb.getAttribute('data-compare');
        if (cb.checked) { if (list.length >= 4) { cb.checked = false; toast('Compare up to four parts at a time'); return; } if (list.indexOf(id) < 0) list.push(id); }
        else list = list.filter(function (x) { return x !== id; });
        setCmp(list);
      });
    });
    renderTray();
  }
  function initTray() {
    var tray = $('[data-tray]'); if (!tray) return;
    $('[data-tray-clear]', tray).addEventListener('click', function () { setCmp([]); });
    renderTray();
  }

  function initComparePage() {
    var host = $('[data-compare-table]'); if (!host) return;
    var ids = (params.get('ids') ? params.get('ids').split(',') : cmp());
    if (ids.length < 2) ids = ['A1335', 'A33020', 'A33110'];
    store('compare', ids);
    var ps = ids.map(D.part).filter(Boolean);
    var rows = [
      ['Description', function (p) { return p.name; }], ['Status', function (p) { return p.status; }], ['Technology', function (p) { return p.tech; }],
      ['Supply voltage', function (p) { return p.supply[0] + ' to ' + p.supply[1] + ' V'; }], ['Resolution', function (p) { return p.res + ' bit'; }],
      ['Response time', function (p) { return p.resp + ' µs'; }], ['Sensing axis', function (p) { return p.axis; }], ['Max temperature', function (p) { return p.tmax + '°C'; }],
      ['Interfaces', function (p) { return p.iface.join(', '); }], ['Functional safety', function (p) { return p.safety; }], ['AEC-Q100', function (p) { return p.aec ? 'Yes' : 'No'; }],
      ['Mounting', function (p) { return p.mount.join(', '); }], ['Markets', function (p) { return p.market.join(', '); }],
      ['Availability', function (p) { return inStock(p.id) ? 'In stock' : 'Lead time'; }], ['From (per unit)', function (p) { return money(Math.min.apply(null, opnsFor(p.id).map(function (o) { return o.price; }))); }]
    ];
    function render() {
      var only = $('#diff-only') && $('#diff-only').checked;
      var h = '<table class="data"><thead><tr><th scope="col">Specification</th>' + ps.map(function (p) { return '<th scope="col"><a href="' + url('pages/part.html?id=' + p.id) + '">' + esc(p.id) + '</a> <button type="button" class="wf-meta" data-rm="' + esc(p.id) + '" aria-label="Remove ' + esc(p.id) + '" style="border:0;background:none;cursor:pointer">✕</button></th>'; }).join('') + '</tr></thead><tbody>';
      rows.forEach(function (r) {
        var vals = ps.map(r[1]); var same = vals.every(function (v) { return v === vals[0]; });
        if (only && same) return;
        h += '<tr class="' + (same ? '' : 'match') + '"><th scope="row">' + esc(r[0]) + '</th>' + vals.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>';
      });
      h += '<tr><th scope="row"></th>' + ps.map(function (p) { return '<td><button class="btn btn-sm" data-add="sample" data-opn="' + esc(opnsFor(p.id)[0].opn) + '">Order sample</button></td>'; }).join('') + '</tr></tbody></table>';
      host.innerHTML = h;
      $$('[data-rm]', host).forEach(function (b) { b.addEventListener('click', function () { ps = ps.filter(function (p) { return p.id !== b.getAttribute('data-rm'); }); store('compare', ps.map(function (p) { return p.id; })); render(); }); });
      $$('[data-add]', host).forEach(function (b) { b.addEventListener('click', function () { addToBasket(b.getAttribute('data-opn'), 'sample'); }); });
    }
    var d = $('#diff-only'); if (d) d.addEventListener('change', render);
    renderers.push(render); render();
  }

  /* ---------------------------------------------------------------------
     Listing with parametric filters (journey 2, and landing point for 3 and 4) */
  var FACETS = [
    { k: 'app', label: 'Application', multi: true, vals: function () { return Object.keys(D.applications); }, name: function (v) { return D.applications[v]; }, test: function (p, v) { return p.apps.indexOf(v) >= 0; } },
    { k: 'market', label: 'Market', multi: true, vals: function () { return ['Automotive', 'Industrial']; }, test: function (p, v) { return p.market.indexOf(v) >= 0; } },
    { k: 'safety', label: 'Functional safety (minimum)', multi: false, vals: function () { return ['ASIL B', 'ASIL C', 'ASIL D']; }, test: function (p, v) { return safetyRank(p.safety) >= safetyRank(v); } },
    { k: 'tech', label: 'Sensing technology', multi: true, vals: function () { return ['Hall', 'Hall (CVH)', 'TMR']; }, test: function (p, v) { return p.tech === v; } },
    { k: 'iface', label: 'Interface', multi: true, vals: function () { return ['SPI', 'SENT', 'I²C', 'PWM', 'ABI/UVW', 'Analog', 'Analog sin/cos']; }, test: function (p, v) { return p.iface.indexOf(v) >= 0; } },
    { k: 'mount', label: 'Magnet position', multi: true, vals: function () { return ['On-axis', 'Off-axis']; }, test: function (p, v) { return p.mount.indexOf(v) >= 0; } },
    { k: 'status', label: 'Lifecycle', multi: true, vals: function () { return ['New', 'Active']; }, test: function (p, v) { return p.status === v; } }
  ];
  function initListing() {
    var host = $('[data-listing]'); if (!host) return;
    var type = params.get('type') || 'angle';
    var ty = D.types.filter(function (x) { return x.id === type; })[0] || D.types[0];
    $$('[data-type-name]').forEach(function (el) { el.textContent = ty.name; });
    if (ty.id !== 'angle') { var n = $('[data-other-type]'); if (n) n.hidden = false; }
    var state = { stock: params.get('stock') === '1', fit: params.get('fit') === '1', volt: params.get('volt') || '', tmax: params.get('tmax') || '', res: params.get('res') || '', resp: params.get('resp') || '', sort: params.get('sort') || 'rel' };
    FACETS.forEach(function (f) { state[f.k] = params.get(f.k) ? params.get(f.k).split(',') : []; });
    var facetHost = $('[data-facets]'); var out = $('[data-results]'); var countEl = $('[data-count]'); var chips = $('[data-chips]');

    function passes(p, skip) {
      for (var i = 0; i < FACETS.length; i++) {
        var f = FACETS[i]; if (f.k === skip || !state[f.k].length) continue;
        if (!state[f.k].some(function (v) { return f.test(p, v); })) return false;
      }
      if (state.stock && skip !== 'stock' && !inStock(p.id)) return false;
      if (state.volt && !(p.supply[0] <= +state.volt && p.supply[1] >= +state.volt)) return false;
      if (state.tmax && p.tmax < +state.tmax) return false;
      if (state.res && p.res < +state.res) return false;
      if (state.resp && p.resp > +state.resp) return false;
      if (state.fit && profile() && !fits(p, profile())) return false;
      return true;
    }
    function syncUrl() {
      var u = new URLSearchParams(); u.set('type', type);
      FACETS.forEach(function (f) { if (state[f.k].length) u.set(f.k, state[f.k].join(',')); });
      ['volt', 'tmax', 'res', 'resp'].forEach(function (k) { if (state[k]) u.set(k, state[k]); });
      if (state.stock) u.set('stock', '1'); if (state.fit) u.set('fit', '1'); if (state.sort !== 'rel') u.set('sort', state.sort);
      try { window.history.replaceState(null, '', '?' + u.toString()); } catch (e) { /* file:// */ }
      store('listing', u.toString());
    }
    function renderFacets() {
      var h = '<div class="facet"><h3>Availability</h3><label><input type="checkbox" data-st="stock"' + (state.stock ? ' checked' : '') + '> In stock now <span class="c">' + D.parts.filter(function (p) { return inStock(p.id) && passes(p, 'stock'); }).length + '</span></label></div>';
      if (profile()) h += '<div class="facet"><h3>Your design</h3><label><input type="checkbox" data-st="fit"' + (state.fit ? ' checked' : '') + '> Only parts that fit ' + esc(profile().name || 'my design') + '</label></div>';
      FACETS.forEach(function (f) {
        h += '<div class="facet"><h3>' + esc(f.label) + '</h3>';
        f.vals().forEach(function (v) {
          var c = D.parts.filter(function (p) { return passes(p, f.k) && f.test(p, v); }).length;
          var on = state[f.k].indexOf(v) >= 0;
          h += '<label class="' + (c === 0 && !on ? 'zero' : '') + '"><input type="' + (f.multi ? 'checkbox' : 'radio') + '" name="f-' + f.k + '" data-f="' + f.k + '" value="' + esc(v) + '"' + (on ? ' checked' : '') + (c === 0 && !on ? ' disabled' : '') + '> ' + esc(f.name ? f.name(v) : v) + ' <span class="c">' + c + '</span></label>';
        });
        if (!f.multi && state[f.k].length) h += '<button type="button" class="chip" data-clear="' + f.k + '" style="margin-top:0.3rem">Any</button>';
        h += '</div>';
      });
      h += '<div class="facet"><h3>Electrical and thermal</h3>' +
        '<div class="field"><label for="f-volt" style="font-weight:400;font-size:0.875rem">Must run at supply (V)</label><input id="f-volt" type="text" inputmode="decimal" data-num="volt" value="' + esc(state.volt) + '" placeholder="e.g. 5 or 12"></div>' +
        '<div class="field"><label for="f-tmax" style="font-weight:400;font-size:0.875rem">Max operating temp at least (°C)</label><select id="f-tmax" data-num="tmax"><option value="">Any</option><option value="125"' + (state.tmax === '125' ? ' selected' : '') + '>125</option><option value="150"' + (state.tmax === '150' ? ' selected' : '') + '>150</option></select></div>' +
        '<div class="field"><label for="f-res" style="font-weight:400;font-size:0.875rem">Resolution at least (bit)</label><select id="f-res" data-num="res"><option value="">Any</option><option value="12"' + (state.res === '12' ? ' selected' : '') + '>12</option><option value="14"' + (state.res === '14' ? ' selected' : '') + '>14</option></select></div>' +
        '<div class="field" style="margin-bottom:0"><label for="f-resp" style="font-weight:400;font-size:0.875rem">Response time at most (µs)</label><select id="f-resp" data-num="resp"><option value="">Any</option><option value="10"' + (state.resp === '10' ? ' selected' : '') + '>10</option><option value="25"' + (state.resp === '25' ? ' selected' : '') + '>25</option><option value="60"' + (state.resp === '60' ? ' selected' : '') + '>60</option></select></div></div>';
      facetHost.innerHTML = h;
      $$('[data-f]', facetHost).forEach(function (cb) {
        cb.addEventListener('change', function () {
          var k = cb.getAttribute('data-f'); var f = FACETS.filter(function (x) { return x.k === k; })[0];
          if (!f.multi) state[k] = [cb.value];
          else if (cb.checked) state[k].push(cb.value); else state[k] = state[k].filter(function (v) { return v !== cb.value; });
          update(k);
        });
      });
      $$('[data-st]', facetHost).forEach(function (cb) { cb.addEventListener('change', function () { state[cb.getAttribute('data-st')] = cb.checked; update(); }); });
      $$('[data-clear]', facetHost).forEach(function (b) { b.addEventListener('click', function () { state[b.getAttribute('data-clear')] = []; update(); }); });
      $$('[data-num]', facetHost).forEach(function (el) {
        el.addEventListener('change', function () {
          var k = el.getAttribute('data-num'); var v = el.value.trim();
          if (k === 'volt' && v && isNaN(+v)) { el.closest('.field').classList.add('has-error'); return; }
          state[k] = v; update();
        });
      });
    }
    function renderChips() {
      var c = [];
      if (state.stock) c.push(['stock', 'In stock now']);
      if (state.fit) c.push(['fit', 'Fits my design']);
      FACETS.forEach(function (f) { state[f.k].forEach(function (v) { c.push([f.k + ':' + v, (f.name ? f.name(v) : v)]); }); });
      if (state.volt) c.push(['volt', 'Runs at ' + state.volt + ' V']);
      if (state.tmax) c.push(['tmax', '≥ ' + state.tmax + '°C']);
      if (state.res) c.push(['res', '≥ ' + state.res + ' bit']);
      if (state.resp) c.push(['resp', '≤ ' + state.resp + ' µs']);
      chips.innerHTML = c.map(function (x) { return '<button type="button" class="chip" data-chip="' + esc(x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + (c.length ? '<button type="button" class="btn btn-sm btn-ghost" data-chip="*">Clear all</button>' : '');
      $$('[data-chip]', chips).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-chip');
          if (k === '*') { FACETS.forEach(function (f) { state[f.k] = []; }); state.stock = state.fit = false; state.volt = state.tmax = state.res = state.resp = ''; }
          else if (k.indexOf(':') > 0) { var a = k.split(':'); state[a[0]] = state[a[0]].filter(function (v) { return v !== a.slice(1).join(':'); }); }
          else if (k === 'stock' || k === 'fit') state[k] = false; else state[k] = '';
          update();
        });
      });
    }
    function renderResults() {
      var list = D.parts.filter(function (p) { return passes(p); });
      var s = state.sort;
      if (s === 'res') list.sort(function (a, b) { return b.res - a.res; });
      if (s === 'resp') list.sort(function (a, b) { return a.resp - b.resp; });
      if (s === 'new') list.sort(function (a, b) { return (a.status === 'New' ? -1 : 1) - (b.status === 'New' ? -1 : 1); });
      countEl.textContent = list.length + ' of ' + D.parts.length + ' parts';
      var pr = profile();
      out.innerHTML = list.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Compare</th><th>Part</th><th>Supply (V)</th><th>Resolution</th><th>Response (µs)</th><th>Interfaces</th><th>Safety</th><th>Max temp</th><th>Availability</th>' + (pr ? '<th>Your design</th>' : '') + '</tr></thead><tbody>' +
        list.map(function (p) {
          var f = fits(p, pr);
          return '<tr><td><input type="checkbox" data-compare="' + esc(p.id) + '" aria-label="Compare ' + esc(p.id) + '"></td><td><a href="' + url('pages/part.html?id=' + p.id) + '"><strong>' + esc(p.id) + '</strong></a> ' + (p.status === 'New' ? '<span class="pill">New</span>' : '') + '<br><span class="wf-meta">' + esc(p.name) + '</span></td>' +
            '<td class="num">' + p.supply[0] + '–' + p.supply[1] + '</td><td class="num">' + p.res + ' bit</td><td class="num">' + p.resp + '</td><td>' + esc(p.iface.join(', ')) + '</td><td>' + esc(p.safety) + '</td><td class="num">' + p.tmax + '°C</td>' +
            '<td>' + (inStock(p.id) ? 'In stock' : '<span class="wf-meta">Lead time</span>') + '</td>' + (pr ? '<td>' + (f ? '<span class="fits">Fits</span>' : '<span class="nofit">No</span>') + '</td>' : '') + '</tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="box"><h3>No parts match every filter</h3><p>Remove a filter, or ask an applications engineer about a custom variant.</p><a class="btn btn-ghost" href="#">Ask an engineer</a></div>';
      bindCompare(out);
    }
    function update() { syncUrl(); renderFacets(); renderChips(); renderResults(); }
    var sortSel = $('[data-sort]'); if (sortSel) { sortSel.value = state.sort; sortSel.addEventListener('change', function () { state.sort = sortSel.value; update(); }); }
    var ft = $('[data-filter-toggle]'); if (ft) ft.addEventListener('click', function () { facetHost.classList.toggle('open'); ft.setAttribute('aria-expanded', facetHost.classList.contains('open')); });
    var csv = $('[data-csv]'); if (csv) csv.addEventListener('click', function (e) { e.preventDefault(); toast('Exports the filtered table as CSV, as the current site already does'); });
    window.__relist = update;
    renderers.push(update);
    update();
  }

  /* ---------------------------------------------------------------------
     System block diagram (journey 3) */
  var BLOCKS = {
    hwa: { name: 'Handwheel angle sensor', type: 'Magnetic Rotary Angle Sensors', typeId: 'angle', why: 'Reads the driver\'s steering input. With no column, this is the only record of intent, so redundancy (dual die) and ASIL D matter.', filter: 'app=sbw&safety=ASIL%20D' },
    torque: { name: 'Steering torque / feel sensor', type: 'Linear Hall Sensors (1D)', typeId: 'linear', why: 'Measures torque at the handwheel to drive the feedback motor that recreates road feel.', filter: '' },
    hwmotor: { name: 'Feedback motor position', type: 'Magnetic Rotary Angle Sensors', typeId: 'angle', why: 'Commutates the feedback motor. Low latency matters more than absolute accuracy here.', filter: 'app=sbw&resp=25' },
    rwamotor: { name: 'Rack motor position', type: 'Magnetic Rotary Angle Sensors', typeId: 'angle', why: 'Commutates the road wheel actuator motor. Stray field immunity helps next to high phase currents.', filter: 'app=sbw&tech=Hall' },
    current: { name: 'Phase current sensing', type: 'Isolated Current Sensors', typeId: 'current', why: 'Measures motor phase current for torque control and fault detection.', filter: '' },
    gate: { name: 'BLDC gate driver', type: 'BLDC Gate Drivers', typeId: 'gate', why: 'Drives the inverter MOSFETs. 48V variants for higher-power racks.', filter: '' },
    pmic: { name: 'Safety PMIC', type: 'Safety PMICs', typeId: 'pmic', why: 'Supplies and supervises the ECU, with watchdog and safe-state control.', filter: '' }
  };
  function initDiagram() {
    var host = $('[data-diagram]'); if (!host) return;
    var sid = params.get('id') || 'sbw';
    if (sid !== 'sbw' && D.applications[sid]) { $$('[data-sys-name]').forEach(function (el) { el.textContent = D.applications[sid]; }); var fl = $('[data-sys-flag]'); if (fl) fl.hidden = false; }
    var panel = $('[data-block-panel]');
    $$('.block[data-block]', host).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.block', host).forEach(function (x) { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var k = b.getAttribute('data-block'); var bl = BLOCKS[k];
        var parts = bl.typeId === 'angle' ? D.parts.filter(function (p) { return p.apps.indexOf('sbw') >= 0; }) : [];
        if (k === 'hwa') parts = parts.filter(function (p) { return p.safety === 'ASIL D'; });
        if (k === 'hwmotor') parts = parts.filter(function (p) { return p.resp <= 25; });
        var href = url('pages/listing.html?type=' + bl.typeId + (bl.filter ? '&' + bl.filter : ''));
        panel.innerHTML = '<p class="wf-meta">Selected block</p><h3>' + esc(bl.name) + '</h3><p>' + esc(bl.why) + '</p>' +
          '<p><strong>Product type:</strong> <a href="' + url('pages/listing.html?type=' + bl.typeId) + '">' + esc(bl.type) + '</a></p>' +
          (parts.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Suggested part</th><th>Why it suits this block</th><th>Safety</th><th></th></tr></thead><tbody>' +
            parts.slice(0, 5).map(function (p) { return '<tr><td><a href="' + url('pages/part.html?id=' + p.id) + '"><strong>' + esc(p.id) + '</strong></a></td><td>' + esc(p.name) + '</td><td>' + esc(p.safety) + '</td><td><label style="font-weight:400"><input type="checkbox" data-compare="' + esc(p.id) + '"> Compare</label></td></tr>'; }).join('') + '</tbody></table></div>'
            : '<p class="wf-meta">Sample data in this prototype only covers angle sensors. In the build, every block draws its suggestions from the parts database in the same way.</p>') +
          '<div class="row" style="margin-top:1rem"><a class="btn" href="' + href + '">See all ' + esc(bl.type.toLowerCase()) + ' for this block</a><a class="btn btn-ghost" href="#">Reference design and BOM</a></div>';
        panel.hidden = false; bindCompare(panel);
        store('lastblock', k);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Product Finder (journey 4) */
  function initFinder() {
    var host = $('[data-finder]'); if (!host) return;
    var pr = profile() || {}; var ans = { type: pr.type || '', market: pr.market || '', safety: pr.safety || '', mount: pr.mount || '', iface: pr.iface || '', volt: pr.volt || '', tmax: pr.tmax || '' };
    var step = ans.type ? 1 : 0; var chosen = {}; Object.keys(ans).forEach(function (k) { if (ans[k]) chosen[k] = true; });
    var STEPS = [
      { k: 'type', q: 'What do you need to sense or control?', opts: [['angle', 'Rotation or angle', 'Shaft angle, motor position, knobs and pedals'], ['linear', 'Linear position', 'Stroke, travel, gear position'], ['current', 'Electric current', 'Phase current, battery current, overcurrent'], ['speed', 'Speed', 'Wheel, transmission or crank speed'], ['switch', 'Presence or open/closed', 'Lids, latches, limit positions'], ['motor', 'Drive a motor', 'Gate drivers and integrated motor drivers']] },
      { k: 'market', q: 'Where will it be used?', opts: [['Automotive', 'Automotive', 'AEC-Q100 qualified parts'], ['Industrial', 'Industrial, robotics or consumer', 'Wider choice of packages'], ['', 'Not sure yet', 'Show both']] },
      { k: 'safety', q: 'What functional safety level does the system need?', opts: [['ASIL D', 'ASIL D', 'Steering, braking, steer-by-wire'], ['ASIL C', 'ASIL C or higher', ''], ['ASIL B', 'ASIL B or higher', 'Many powertrain and body systems'], ['', 'None or not sure', '']] },
      { k: 'mount', q: 'Where does the magnet sit relative to the sensor?', opts: [['On-axis', 'End of shaft (on-axis)', 'Magnet on the end of the shaft, sensor below'], ['Off-axis', 'Side of shaft (off-axis)', 'Ring magnet or through-shaft designs'], ['', 'Not decided', '']] },
      { k: 'iface', q: 'Which output does your controller expect?', opts: [['SPI', 'SPI', ''], ['SENT', 'SENT', ''], ['ABI/UVW', 'Incremental ABI / UVW', 'Encoder-style outputs'], ['Analog sin/cos', 'Analogue sine/cosine', 'For your own interpolation'], ['PWM', 'PWM', ''], ['', 'Any', '']] },
      { k: 'env', q: 'Supply and temperature', opts: null }
    ];
    var progress = $('[data-steps]'), body = $('[data-step-body]'), countEl = $('[data-live-count]'), listEl = $('[data-live-list]'), showBtn = $('[data-show]');
    function current() { var a = {}; Object.keys(ans).forEach(function (k) { if (ans[k]) a[k] = ans[k]; }); return a; }
    function matches(a) { return D.parts.filter(function (p) { return fits(p, a); }); }
    function countIf(k, v) { var a = current(); if (v) a[k] = v; else delete a[k]; return a.type && a.type !== 'angle' ? null : matches(a).length; }
    function listingHref() {
      var a = current(); var u = new URLSearchParams(); u.set('type', a.type || 'angle');
      if (a.market) u.set('market', a.market); if (a.safety) u.set('safety', a.safety); if (a.mount) u.set('mount', a.mount); if (a.iface) u.set('iface', a.iface);
      if (a.volt) u.set('volt', a.volt); if (a.tmax) u.set('tmax', a.tmax);
      return url('pages/listing.html?' + u.toString());
    }
    function render() {
      progress.innerHTML = STEPS.map(function (s, i) { return '<li class="' + (i === step ? 'on' : i < step ? 'done' : '') + '">' + ['Need', 'Market', 'Safety', 'Magnet', 'Output', 'Supply'][i] + '</li>'; }).join('');
      var s = STEPS[step]; var h = '<h2 style="font-size:1.375rem">' + esc(s.q) + '</h2>';
      if (s.opts) {
        h += '<div class="options">' + s.opts.map(function (o) {
          var n = s.k === 'type' ? (o[0] === 'angle' ? D.parts.length : null) : countIf(s.k, o[0]);
          var disabled = n === 0;
          return '<button type="button" class="option' + (chosen[s.k] && ans[s.k] === o[0] ? ' sel' : '') + '" data-opt="' + esc(o[0]) + '"' + (disabled ? ' disabled' : '') + '><strong>' + esc(o[1]) + '</strong>' + (o[2] ? '<span class="n">' + esc(o[2]) + '</span>' : '') + '<span class="n">' + (n === null ? (s.k === 'type' && o[0] !== 'angle' ? 'Not in sample data' : '') : n + ' parts') + '</span></button>';
        }).join('') + '</div>';
      } else {
        h += '<div class="grid grid-2" style="max-width:40rem"><div class="field"><label for="fv">Supply voltage (V)</label><input id="fv" type="text" inputmode="decimal" value="' + esc(ans.volt) + '" placeholder="e.g. 5 or 12"><p class="field-hint">Leave blank if flexible.</p></div>' +
          '<div class="field"><label for="ft">Highest operating temperature</label><select id="ft"><option value="">Not sure</option><option value="125"' + (ans.tmax == 125 ? ' selected' : '') + '>Up to 125°C</option><option value="150"' + (ans.tmax == 150 ? ' selected' : '') + '>Up to 150°C</option></select></div></div>' +
          '<div class="field"><label for="fn">Name this design (optional)</label><input id="fn" type="text" placeholder="e.g. SbW handwheel ECU, gen 2" value="' + esc(pr.name || '') + '" style="max-width:24rem"></div>';
      }
      h += '<div class="row" style="margin-top:1.25rem">' + (step > 0 ? '<button type="button" class="btn btn-ghost" data-back>Back</button>' : '') + (step === 5 ? '<button type="button" class="btn" data-save>Save as my design and see parts</button>' : '') + '</div>';
      body.innerHTML = h;
      if (ans.type && ans.type !== 'angle') {
        body.innerHTML += '<div class="wf-note query" data-note="!" style="display:block"><span class="wf-note-label">Sample data</span>This prototype only carries data for rotary angle sensors. In the build each need has its own short question set (current sensors ask about range, isolation and bandwidth).</div>';
      }
      $$('[data-opt]', body).forEach(function (b) {
        b.addEventListener('click', function () {
          ans[s.k] = b.getAttribute('data-opt'); chosen[s.k] = true;
          if (s.k === 'type' && ans.type !== 'angle') { render(); renderLive(); return; }
          step = Math.min(step + 1, 5); render(); renderLive();
        });
      });
      var back = $('[data-back]', body); if (back) back.addEventListener('click', function () { step -= 1; render(); renderLive(); });
      var fv = $('#fv'), ft = $('#ft');
      if (fv) fv.addEventListener('input', function () {
        var v = fv.value.trim(); var bad = v && (isNaN(+v) || +v <= 0 || +v > 60);
        fv.closest('.field').classList.toggle('has-error', !!bad);
        var e = $('.field-error', fv.closest('.field')); if (bad && !e) fv.insertAdjacentHTML('afterend', '<p class="field-error">Enter a voltage between 1 and 60.</p>'); if (!bad && e) e.remove();
        ans.volt = bad ? '' : v; renderLive();
      });
      if (ft) ft.addEventListener('change', function () { ans.tmax = ft.value; renderLive(); });
      var save = $('[data-save]', body);
      if (save) save.addEventListener('click', function () {
        if ($('.has-error', body)) { fv.focus(); return; }
        var a = current(); a.name = ($('#fn').value || '').trim() || 'My design'; store('profile', a);
        window.location.href = listingHref() + '&fit=1';
      });
    }
    function renderLive() {
      var a = current();
      if (a.type && a.type !== 'angle') { countEl.textContent = '–'; listEl.innerHTML = '<li class="wf-meta">Not in sample data</li>'; showBtn.href = url('pages/products.html'); return; }
      var m = matches(a); countEl.textContent = m.length;
      listEl.innerHTML = m.slice(0, 6).map(function (p) { return '<li><a href="' + url('pages/part.html?id=' + p.id) + '">' + esc(p.id) + '</a> <span class="wf-meta">' + esc(p.safety) + ' · ' + esc(p.iface.slice(0, 2).join(', ')) + '</span></li>'; }).join('') + (m.length > 6 ? '<li class="wf-meta">and ' + (m.length - 6) + ' more</li>' : '');
      showBtn.href = listingHref(); showBtn.textContent = 'Show ' + m.length + ' parts';
    }
    var reset = $('[data-reset]'); if (reset) reset.addEventListener('click', function () { Object.keys(ans).forEach(function (k) { ans[k] = ''; }); chosen = {}; step = 0; render(); renderLive(); });

    /* Start from what you already know: competitor part or existing Allegro part */
    var xf = $('[data-xref-form]');
    if (xf) xf.addEventListener('submit', function (e) {
      e.preventDefault(); var inp = $('input', xf); var v = inp.value.trim().toUpperCase(); var outEl = $('[data-xref-out]');
      var field = inp.closest('.field'); var err = $('.field-error', field);
      if (!v) { field.classList.add('has-error'); if (!err) inp.insertAdjacentHTML('afterend', '<p class="field-error">Enter a part number.</p>'); return; }
      field.classList.remove('has-error'); if (err) err.remove();
      var hit = D.xref[v]; var own = D.part(v);
      if (hit) outEl.innerHTML = '<div class="box muted"><p class="wf-meta">' + esc(v) + ' → ' + esc(hit.type) + '</p><h3><a href="' + url('pages/part.html?id=' + hit.match) + '">Allegro ' + esc(hit.match) + '</a></h3><p>' + esc(hit.note) + '</p><a class="btn btn-sm" href="' + url('pages/compare.html?ids=' + hit.match + ',' + (hit.match === 'A1335' ? 'A33020' : 'A1335')) + '">Compare options</a></div>';
      else if (own) outEl.innerHTML = '<div class="box muted"><p class="wf-meta">You already use ' + esc(own.id) + '</p><p>Newer or higher-safety alternatives with the same interfaces:</p><ul>' + D.parts.filter(function (p) { return p.id !== own.id && p.iface.some(function (i) { return own.iface.indexOf(i) >= 0; }) && safetyRank(p.safety) >= safetyRank(own.safety); }).slice(0, 3).map(function (p) { return '<li><a href="' + url('pages/part.html?id=' + p.id) + '">' + esc(p.id) + '</a> <span class="wf-meta">' + esc(p.safety) + '</span></li>'; }).join('') + '</ul></div>';
      else outEl.innerHTML = '<div class="box muted"><p>No cross-reference found for ' + esc(v) + '. Try MLX90316, TLE5012B or AS5047P in this prototype, or send it to an applications engineer.</p><a class="btn btn-sm btn-ghost" href="#">Ask an engineer</a></div>';
    });
    render(); renderLive();
  }

  /* ---------------------------------------------------------------------
     Basket: samples, quote, buy */
  function initBasketPage() {
    var host = $('[data-basket]'); if (!host) return;
    if (!basket().length && params.get('demo') !== '0') setBasket([{ opn: 'A1335LLETR-T', mode: 'sample', qty: 5 }, { opn: 'A1335LLETR-DD-T', mode: 'quote', qty: 24000 }]);
    function render() {
      var b = basket();
      var groups = { sample: [], quote: [], buy: [] };
      b.forEach(function (x, i) { x.i = i; (groups[x.mode] || groups.quote).push(x); });
      function line(x) {
        var f = findOpn(x.opn); var o = f ? f.opn : { price: 0, stock: 0, moq: 1, lead: '' };
        return '<tr><td><strong>' + esc(x.opn) + '</strong><br><span class="wf-meta">' + (f ? esc(f.part.id) + ' · ' + esc(o.pkg) : '') + '</span></td>' +
          '<td><label class="visually-hidden" for="qty' + x.i + '">Quantity</label><input id="qty' + x.i + '" type="text" inputmode="numeric" value="' + x.qty + '" data-qty="' + x.i + '" style="width:7rem"></td>' +
          '<td class="num">' + (x.mode === 'sample' ? 'Free' : money(o.price) + ' / unit') + '</td>' +
          '<td class="num">' + (o.stock > 0 ? 'In stock' : 'Lead time ' + esc(o.lead)) + '</td>' +
          '<td><button type="button" class="btn btn-sm btn-ghost" data-move="' + x.i + '">' + (x.mode === 'sample' ? 'Move to quote' : 'Move to samples') + '</button> <button type="button" class="btn btn-sm btn-ghost" data-del="' + x.i + '" aria-label="Remove ' + esc(x.opn) + '">Remove</button></td></tr>';
      }
      var head = '<thead><tr><th>Part</th><th>Quantity</th><th>Price</th><th>Availability</th><th></th></tr></thead>';
      host.innerHTML =
        '<section><h2 class="section-title">Free samples <span class="wf-meta">(' + groups.sample.length + ')</span></h2>' + (groups.sample.length ? '<div class="table-wrap"><table class="data">' + head + '<tbody>' + groups.sample.map(line).join('') + '</tbody></table></div><p class="wf-meta">Up to 5 units per part. Today this is the only thing the site can fulfil directly.</p><button class="btn" type="button" data-submit="sample">Request samples</button>' : '<p class="wf-meta">No samples yet.</p>') + '</section>' +
        '<section><h2 class="section-title">Quote request <span class="wf-meta">(' + groups.quote.length + ')</span></h2>' + (groups.quote.length ? '<div class="table-wrap"><table class="data">' + head + '<tbody>' + groups.quote.map(line).join('') + '</tbody></table></div>' +
          '<form data-quote-form novalidate class="box muted" style="margin-top:1rem"><div class="grid grid-2"><div class="field"><label for="qc">Company</label><input id="qc" type="text" required></div><div class="field"><label for="qe">Business email</label><input id="qe" type="email" required></div>' +
          '<div class="field"><label for="qv">Estimated annual volume</label><input id="qv" type="text" inputmode="numeric" placeholder="e.g. 250000"></div><div class="field"><label for="qp">Project or design name</label><input id="qp" type="text" value="' + esc((profile() && profile().name) || '') + '"></div></div>' +
          '<div class="field"><label for="qr">Ship-to country</label><select id="qr"><option>' + esc(document.getElementById('region') ? document.getElementById('region').selectedOptions[0].text.split(' · ')[0] : 'United States') + '</option><option>Other</option></select></div><button class="btn" type="submit">Send quote request</button></form>' : '<p class="wf-meta">No quote lines yet.</p>') + '</section>' +
        '<section><h2 class="section-title">Buy now</h2><div class="box"><p><strong>Future state.</strong> When the parts systems can expose price and stock reliably, small-quantity lines below MOQ could be bought here with a card or on account. Until then each line offers authorised distributors for your region.</p><button class="btn" type="button" disabled>Checkout (not yet available)</button></div></section>';
      $$('[data-qty]', host).forEach(function (inp) { inp.addEventListener('change', function () { var n = parseInt(inp.value, 10); var bb = basket(); var it = bb[+inp.getAttribute('data-qty')]; if (it.mode === 'sample' && n > 5) { n = 5; toast('Samples are limited to 5 units per part'); } it.qty = n > 0 ? n : 1; setBasket(bb); render(); }); });
      $$('[data-del]', host).forEach(function (btn) { btn.addEventListener('click', function () { var bb = basket(); bb.splice(+btn.getAttribute('data-del'), 1); setBasket(bb); render(); }); });
      $$('[data-move]', host).forEach(function (btn) { btn.addEventListener('click', function () { var bb = basket(); var it = bb[+btn.getAttribute('data-move')]; it.mode = it.mode === 'sample' ? 'quote' : 'sample'; it.qty = it.mode === 'sample' ? Math.min(it.qty, 5) : Math.max(it.qty, 1000); setBasket(bb); render(); }); });
      var ss = $('[data-submit="sample"]', host); if (ss) ss.addEventListener('click', function () { toast('Sample request sent (prototype). Sign-in would be needed in the build.'); });
      var qf = $('[data-quote-form]', host);
      if (qf) qf.addEventListener('submit', function (e) {
        e.preventDefault(); var ok = true;
        ['qc', 'qe'].forEach(function (id) {
          var el = document.getElementById(id); var f = el.closest('.field'); var bad = !el.value.trim() || (id === 'qe' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim()));
          f.classList.toggle('has-error', bad); var er = $('.field-error', f);
          if (bad && !er) el.insertAdjacentHTML('afterend', '<p class="field-error">' + (id === 'qe' ? 'Enter a valid business email.' : 'Enter your company name.') + '</p>');
          if (!bad && er) er.remove(); if (bad) ok = false;
        });
        if (ok) { qf.innerHTML = '<p><strong>Quote request sent.</strong> Reference Q-SAMPLE-0001. You can retrieve it later from your account.</p>'; }
      });
    }
    renderers.push(render); render();
  }

  function initMenu() {
    var b = $('[data-menu-toggle]'); if (!b) return;
    b.addEventListener('click', function () { var n = b.closest('.nav-secondary'); n.classList.toggle('open'); b.setAttribute('aria-expanded', n.classList.contains('open') ? 'true' : 'false'); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu(); initProtoNav(); initUtil(); initTypeahead(); renderBasketCount(); renderProfileBars(); initTray();
    initSearchPage(); initPartPage(); initComparePage(); initListing(); initDiagram(); initFinder(); initBasketPage();
  });
})();
