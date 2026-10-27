/* 커먼빌리지 공통 스크립트: 메뉴, 보관함(브라우저 저장), 목록 필터·정렬, 검색, 측정 이벤트.
   본문 텍스트는 모두 HTML에 들어 있으므로 이 파일이 없어도 페이지는 읽힙니다. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var SAVE_KEY = 'cv-saves-v2';
  var BOOKMARK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 4h12v17l-6-4-6 4z"/></svg>';

  window.dataLayer = window.dataLayer || [];
  function track(event, params) {
    var payload = { event: event };
    for (var k in (params || {})) payload[k] = params[k];
    window.dataLayer.push(payload);
  }

  /* ---------- 토스트·모달 ---------- */
  var toastTimer, lastFocus;
  function toast(msg) {
    var t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }
  function showModal(title, html) {
    var m = $('#modal'); if (!m || !m.showModal) return;
    lastFocus = document.activeElement;
    $('#modalTitle').textContent = title; $('#modalBody').innerHTML = html;
    if (!m.open) m.showModal(); m.scrollTop = 0; $('#closeModal').focus();
  }
  function closeModal() { var m = $('#modal'); if (m && m.open) m.close(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  /* ---------- 보관함 ---------- */
  function readSaves() {
    try { var v = JSON.parse(localStorage.getItem(SAVE_KEY)); return Array.isArray(v) ? v.filter(function (x) { return x && x.slug; }) : []; } catch (e) { return []; }
  }
  function writeSaves(list) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); return true; } catch (e) { toast('브라우저 저장 공간을 사용할 수 없어 이번 화면에서만 유지돼요.'); return false; }
  }
  var saves = readSaves();
  function isSaved(slug) { return saves.some(function (s) { return s.slug === slug; }); }
  function paintSaves() {
    $$('[data-save]').forEach(function (b) {
      var on = isSaved(b.dataset.save);
      b.classList.toggle('saved', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (b.classList.contains('save-toggle')) b.textContent = on ? '✓ 보관함에 담았어요' : '보관함에 담기';
      else b.setAttribute('aria-label', (b.dataset.title || '') + (on ? ' 보관함에서 빼기' : ' 보관함에 저장'));
    });
    $$('#saveCount').forEach(function (c) { c.textContent = saves.length; });
  }
  function toggleSave(b) {
    var slug = b.dataset.save;
    if (isSaved(slug)) { saves = saves.filter(function (s) { return s.slug !== slug; }); writeSaves(saves); toast('보관함에서 꺼냈어요.'); }
    else {
      saves.unshift({ slug: slug, title: b.dataset.title || slug, cat: b.dataset.cat || '', url: b.dataset.url || '', icon: b.dataset.icon || '✳' });
      if (writeSaves(saves)) toast('보관함에 담았어요. 이 브라우저에서 다시 볼 수 있어요.');
      track('save_click', { slug: slug });
    }
    paintSaves();
  }
  function showSaved() {
    var items = saves.length ? saves.map(function (s) {
      return '<div class="saved-item"><span class="mini-art" aria-hidden="true">' + esc(s.icon) + '</span><a href="' + esc(s.url) + '"><strong>' + esc(s.title) + '</strong><small>' + esc(s.cat) + ' · 자세히 보기 ↗</small></a><button type="button" class="remove" data-remove="' + esc(s.slug) + '" aria-label="' + esc(s.title) + ' 보관함에서 삭제">삭제</button></div>';
    }).join('') : '<div class="info-box">공고 카드 오른쪽 위의 북마크를 누르면 여기에 모아볼 수 있어요.</div>';
    showModal('내 보관함', '<h2>다시 보고 싶은 기회 <span style="color:var(--pink)">' + saves.length + '</span></h2><p>이 브라우저에서 저장한 공고예요. 다른 기기와 동기화되지 않고, 브라우저 데이터를 지우면 함께 지워져요.</p>' + items);
  }

  /* ---------- 목록 필터·정렬 (홈·카테고리·지역 목록) ---------- */
  var cards = $('#cards');
  var state = { filter: 'all', sort: 'default' };
  function applyFilters() {
    if (!cards) return;
    var list = $$('.card', cards), shown = 0;
    list.forEach(function (c, i) { if (!c.dataset.order) c.dataset.order = i; });
    list.forEach(function (c) {
      var ok = state.filter === 'all' || (state.filter === 'free' && c.dataset.free === '1') || (state.filter === 'soon' && c.dataset.soon === '1') || (state.filter === 'open' && !c.classList.contains('status-closed'));
      c.hidden = !ok; if (ok) shown++;
    });
    if (state.sort !== 'default') {
      var sorted = list.slice().sort(function (a, b) {
        if (state.sort === 'deadline') return (+a.dataset.days) - (+b.dataset.days);
        if (state.sort === 'title') return a.dataset.title.localeCompare(b.dataset.title, 'ko');
        return (+a.dataset.order) - (+b.dataset.order);
      });
      sorted.forEach(function (c) { cards.appendChild(c); });
    } else { list.slice().sort(function (a, b) { return (+a.dataset.order) - (+b.dataset.order); }).forEach(function (c) { cards.appendChild(c); }); }
    var empty = $('#filterEmpty'); if (empty) empty.hidden = !(list.length && !shown);
  }

  /* ---------- 검색 페이지 ---------- */
  function initSearch() {
    var box = $('#searchResults'); if (!box) return;
    var q = (new URLSearchParams(location.search).get('q') || '').trim();
    var input = $('#searchInput'); if (input && q) input.value = q;
    var summary = $('#searchSummary');
    if (!q) return;
    summary.textContent = '"' + q + '" 검색 중…';
    fetch(box.dataset.index).then(function (r) { return r.json(); }).then(function (index) {
      var words = q.toLowerCase().split(/\s+/).filter(Boolean);
      var hits = index.filter(function (n) {
        var hay = [n.title, n.cat, n.region, n.area, n.target, n.benefit, n.host, n.summary].join(' ').toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) >= 0; });
      });
      track('search', { search_term: q, results: hits.length });
      summary.textContent = hits.length ? '"' + q + '" 검색 결과 ' + hits.length + '건' : '"' + q + '"에 맞는 공고가 없어요. 다른 키워드로 찾아보세요.';
      box.innerHTML = hits.map(function (n) {
        return '<article class="card status-' + esc(n.status) + '"><a class="poster-link" href="' + esc(n.url) + '"><div class="poster ' + esc(n.cat_key) + '"><span class="poster-top">' + esc(n.en) + '</span><h3 class="poster-text auto">' + esc(n.title) + '</h3><span class="poster-bottom">' + esc(n.place) + '</span><span class="poster-art" aria-hidden="true">' + esc(n.icon) + '</span></div></a><div class="card-content"><div class="card-meta"><span class="category-tag">' + esc(n.cat) + '</span><span class="deadline ' + (n.status === 'urgent' ? 'urgent' : n.status === 'closed' ? 'closed' : '') + '">' + esc(n.status_label) + '</span></div><a class="card-title" href="' + esc(n.url) + '">' + esc(n.title) + '</a><dl class="facts"><dt>지역</dt><dd>' + esc(n.place) + '</dd><dt>대상</dt><dd>' + esc(n.target) + '</dd><dt>혜택</dt><dd>' + esc(n.benefit) + '</dd></dl></div></article>';
      }).join('');
    }).catch(function () { summary.textContent = '검색 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'; });
  }

  /* ---------- 이벤트 연결 ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button, a'); if (!b) return;
    if (b.dataset.save !== undefined && b.tagName === 'BUTTON') { toggleSave(b); return; }
    if (b.dataset.remove) { saves = saves.filter(function (s) { return s.slug !== b.dataset.remove; }); writeSaves(saves); paintSaves(); showSaved(); return; }
    if (b.dataset.filter) {
      state.filter = b.dataset.filter;
      $$('[data-filter]').forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      applyFilters(); return;
    }
    if (b.dataset.action === 'saved') { showSaved(); return; }
    if (b.dataset.event) track(b.dataset.event, { slug: b.dataset.slug || '', href: b.getAttribute('href') || '' });
  });
  var sortSel = $('#sortSelect'); if (sortSel) sortSel.addEventListener('change', function () { state.sort = sortSel.value; applyFilters(); });
  var menuBtn = $('#menuBtn'), nav = $('#mainNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { var open = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기'); });
  }
  var close = $('#closeModal'); if (close) close.addEventListener('click', closeModal);
  var modal = $('#modal');
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal) { var r = modal.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(); } });
    modal.addEventListener('cancel', function (e) { e.preventDefault(); closeModal(); });
  }
  paintSaves();
  initSearch();
  if ($('.notice-page')) track('notice_view', { slug: $('.notice-page').dataset.slug });
})();
