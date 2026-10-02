(function () {
  "use strict";

  var CFG = window.CV_CONFIG || {};
  var PROGRAMS = window.CV_PROGRAMS || [];
  var PROVINCES = window.CV_PROVINCES || [];
  var REGIONS = window.CV_REGIONS || [];
  var METRICS = window.CV_METRICS || [];
  var app = document.getElementById("app");

  /* ---------- 저장소 ---------- */
  var store = {
    get: function (k, fallback) {
      try { var v = localStorage.getItem("cv." + k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set: function (k, v) { try { localStorage.setItem("cv." + k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경 */ } },
    del: function (k) { try { localStorage.removeItem("cv." + k); } catch (e) { /* noop */ } }
  };

  /* ---------- 측정 ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(name, props) {
    var ev = Object.assign({ event: name, at: new Date().toISOString() }, props || {});
    window.dataLayer.push(ev);
  }

  /* ---------- 유틸 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function parseDate(iso) { if (!iso) return null; var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function daysLeft(iso) { var d = parseDate(iso); return d ? Math.round((d - today()) / 864e5) : null; }
  function md(iso) { var d = parseDate(iso); return d ? (d.getMonth() + 1) + "." + d.getDate() : ""; }
  function dotDate(iso) { return iso ? iso.replace(/-/g, ".") : ""; }
  function isOpen(p) {
    if (p.status !== "open") return false;
    if (p.deadlineType === "date" && p.deadline && daysLeft(p.deadline) < 0) return false;
    return true;
  }
  var ICON_CHECK = '<svg class="mark" viewBox="0 0 22 22" fill="none" stroke="#EB6226" stroke-width="2.5" aria-hidden="true"><polyline points="5,11 9.5,15.5 17,7"/></svg>';
  var ICON_NEXT = '<svg class="mark" viewBox="0 0 20 20" fill="none" stroke="#EB6226" stroke-width="2" aria-hidden="true"><polyline points="7,4 13,10 7,16"/></svg>';
  var ICON_BACK = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#1D405B" stroke-width="2" aria-hidden="true"><polyline points="14,4 7,11 14,18"/></svg>';
  var ICON_LOCK = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#1D405B" stroke-width="2" aria-hidden="true"><rect x="6" y="12" width="16" height="12" rx="2"/><path d="M9 12V9a5 5 0 0 1 10 0v3"/></svg>';
  var ICON_SAVE = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#1D405B" stroke-width="2" aria-hidden="true"><path d="M6 3h10v16l-5-4-5 4z"/></svg>';
  var ICON_KAKAO = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3C5.6 3 2 5.8 2 9.2c0 2.2 1.5 4.1 3.7 5.2l-.9 3.3 3.8-2.5c.5.1 1 .1 1.4.1 4.4 0 8-2.8 8-6.1S14.4 3 10 3z" fill="#191600"/></svg>';
  var ICON_GOOGLE = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7.5" fill="none" stroke="#4F6475" stroke-width="1.5"/><text x="9" y="12.5" text-anchor="middle" font-size="10" font-weight="700" fill="#4F6475" font-family="sans-serif">G</text></svg>';
  var ICON_X = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1D405B" stroke-width="2" aria-hidden="true"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>';
  var ICON_TICK_W = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="2.5" aria-hidden="true"><polyline points="3,7 6,10 11,4"/></svg>';

  /* ---------- 진단 문항 ---------- */
  var TYPE_LABEL = { workation: "워케이션", month: "한달살기·여행", trial: "살아보기" };
  var PURPOSE_TYPE = { work: "workation", rest: "month", settle: "trial" };
  var PURPOSE_LABEL = { work: "일하며 머물기", rest: "쉬면서 한 달", settle: "정착 전 살아보기" };
  var RESIDENCES = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
  var AGES = [{ v: "20s", t: "19~29세" }, { v: "30s", t: "30대" }, { v: "40s", t: "40대" }, { v: "50s", t: "50대" }, { v: "60s", t: "60대 이상" }];
  var PRIORITY_OPTIONS = {
    work: ["업무 공간·와이파이", "비용 부담 적게", "자연 가까이", "생활 편의"],
    rest: ["자연·풍경", "비용 부담 적게", "생활 편의", "지역 체험 프로그램"],
    settle: ["생활 편의", "병원 가까이", "주거 비용", "교통"]
  };
  var QUESTIONS = [
    { key: "purpose", q: "어떻게 머물고 싶으세요?", options: [
      { v: "work", t: "노트북 들고 2주 일하러", s: "워케이션" },
      { v: "rest", t: "쉬면서 한 달", s: "한달살기·지역 여행" },
      { v: "settle", t: "이사 전에 세 달 살아보기", s: "귀촌·정착 준비" }] },
    { key: "duration", q: "얼마나 머물 계획인가요?", help: "기간에 맞는 공고를 먼저 보여드려요", options: [
      { v: "1w", t: "1주 정도" }, { v: "2-4w", t: "2~4주" }, { v: "1-3m", t: "1~3개월" }, { v: "3m+", t: "3개월 이상" }] },
    { key: "companion", q: "누구와 함께 가나요?", help: "동반 조건이 있는 공고를 가려드려요", options: [
      { v: "alone", t: "혼자" }, { v: "two", t: "둘이 (친구·연인·부부)" }, { v: "family", t: "아이와 가족" }, { v: "pet", t: "반려동물과 함께" }] },
    { key: "mobility", q: "현지에서 어떻게 다닐 건가요?", help: "차 없이 지내기 좋은 곳인지 함께 봐요", options: [
      { v: "car", t: "차를 가져가요" }, { v: "transit", t: "대중교통으로 다녀요" }] },
    { key: "priorities", q: "가장 중요한 것 두 가지를 골라주세요", help: "지역 추천 순서에 반영해요", multi: 2 },
    { key: "basic", q: "신청 자격 확인을 위해 두 가지만 알려주세요", help: "나이 제한과 거주지 조건을 판정할 때만 써요" }
  ];
  var DURATION_LABEL = { "1w": "1주", "2-4w": "2~4주", "1-3m": "1~3개월", "3m+": "3개월 이상" };
  var COMPANION_LABEL = { alone: "혼자", two: "둘이", family: "가족", pet: "반려동물과" };

  function getDiag() { return store.get("diag", {}); }
  function setDiag(d) { store.set("diag", d); }
  function diagComplete(d) { return d.purpose && d.duration && d.companion && d.mobility && d.priorities && d.priorities.length && d.age && d.residence; }

  /* ---------- 판정 ---------- */
  function fitOf(p, purpose) {
    var want = PURPOSE_TYPE[purpose];
    if (!want) return 1;
    if (p.type === want) return 2;
    if ((want === "month" && p.type === "trial") || (want === "trial" && p.type === "month")) return 1;
    return 0;
  }
  function judge(p, d) {
    var items = [];
    var r = p.rules || {};
    if (!isOpen(p)) return { state: "closed", items: [{ s: "no", t: "모집이 끝났어요. 다시 열리면 알림으로 알려드려요." }] };
    if (d && d.purpose) {
      var f = fitOf(p, d.purpose);
      if (f === 2) items.push({ s: "ok", t: "원하는 방식(" + TYPE_LABEL[p.type] + ")과 같은 유형이에요." });
      else if (f === 1) items.push({ s: "ok", t: "비슷한 유형(" + TYPE_LABEL[p.type] + ")이에요." });
      else items.push({ s: "warn", t: "원하는 방식과 유형이 달라요 (" + TYPE_LABEL[p.type] + ")." });
    }
    if (r.youth && d && d.age) {
      if (d.age === "20s") items.push({ s: "ok", t: "청년 대상 공고이고 연령대가 해당돼요. 세부 나이 기준은 원문을 확인하세요." });
      else if (d.age === "30s") items.push({ s: "warn", t: "청년 대상 공고예요. 청년 나이 기준은 지역마다 달라 원문 확인이 필요해요." });
      else items.push({ s: "no", t: "청년 대상 공고라 연령대가 맞지 않을 가능성이 높아요." });
    }
    if (typeof r.ageMin === "number" || typeof r.ageMax === "number") {
      items.push({ s: "warn", t: "나이 기준(" + (r.ageMin || "") + "~" + (r.ageMax || "") + "세)을 원문에서 확인하세요." });
    }
    if (r.residence) items.push({ s: "warn", t: "거주지 조건: " + r.residence });
    var structured = Object.keys(r).some(function (k) { return k !== "youth"; });
    if (!structured) items.push({ s: "warn", t: "세부 자격 조건(거주지·동반 등)이 아직 정리되지 않았어요. 원문을 확인하세요." });
    var state = items.some(function (i) { return i.s === "no"; }) ? "no" : items.some(function (i) { return i.s === "warn"; }) ? "warn" : "ok";
    return { state: state, items: items };
  }
  var VERDICT_LABEL = { ok: "신청 가능", warn: "확인 필요", no: "대상 아님", closed: "모집 종료" };

  /* ---------- 추천 ---------- */
  function regionKeyOf(p) { return p.area || p.province; }
  function recommend(d, provinceFilter) {
    var list = PROGRAMS.filter(isOpen).filter(function (p) {
      if (p.province === "전국") return false;
      return !provinceFilter || !provinceFilter.length || provinceFilter.indexOf(p.province) >= 0;
    });
    var groups = {};
    list.forEach(function (p) {
      var j = judge(p, d), f = fitOf(p, d.purpose);
      if (j.state === "no" || f === 0) return;
      var k = regionKeyOf(p);
      var g = groups[k] || (groups[k] = { key: k, province: p.province, programs: [], score: 0, ok: 0, warn: 0 });
      g.programs.push({ p: p, j: j, fit: f });
      g.score += f * 10 + (j.state === "ok" ? 5 : 2) + (p.verify === "official" ? 2 : 0) + (p.deadlineType === "date" ? 1 : 0);
      if (j.state === "ok") g.ok++; else g.warn++;
    });
    var ranked = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return soonest(a) - soonest(b);
    });
    var nationwide = PROGRAMS.filter(function (p) { return isOpen(p) && p.province === "전국" && fitOf(p, d.purpose) > 0; });
    var total = ranked.reduce(function (n, g) { return n + g.programs.length; }, 0) + nationwide.length;
    var ok = ranked.reduce(function (n, g) { return n + g.ok; }, 0);
    return { ranked: ranked, nationwide: nationwide, total: total, ok: ok, warn: total - ok };
  }
  function soonest(g) {
    var ds = g.programs.map(function (x) { return x.p.deadline ? daysLeft(x.p.deadline) : 999; });
    return Math.min.apply(null, ds);
  }
  function regionRecord(name) { return REGIONS.filter(function (r) { return r.name === name; })[0] || null; }
  function reasonsFor(g, d) {
    var out = [];
    var same = g.programs.filter(function (x) { return x.fit === 2; }).length;
    if (same) out.push("원하는 방식과 같은 " + TYPE_LABEL[PURPOSE_TYPE[d.purpose]] + " 공고 " + same + "건이 모집 중이에요.");
    else out.push("비슷한 유형의 공고 " + g.programs.length + "건이 모집 중이에요.");
    var dated = g.programs.filter(function (x) { return x.p.deadlineType === "date"; }).sort(function (a, b) { return daysLeft(a.p.deadline) - daysLeft(b.p.deadline); })[0];
    if (dated) out.push(dated.p.title + " 마감은 " + md(dated.p.deadline) + "이에요.");
    var reg = regionRecord(g.key);
    var filled = reg && Object.keys(reg.metrics).length;
    out.push(filled ? "생활 정보가 정리된 지역이에요." : "생활 정보는 운영팀이 정리 중이에요. 우선순위(" + (d.priorities || []).join(", ") + ")는 정리 후 순위에 반영돼요.");
    return out;
  }

  /* ---------- 사용자(로그인) ---------- */
  function getUser() { return store.get("user", null); }
  function login(provider) {
    track("login_click", { provider: provider });
    if (CFG.authMode === "supabase" && CFG.supabaseUrl && window.supabase) {
      var client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
      client.auth.signInWithOAuth({ provider: provider, options: { redirectTo: location.href } });
      return;
    }
    var user = { provider: provider, name: provider === "kakao" ? "카카오 계정" : "Google 계정", at: new Date().toISOString(),
      channels: provider === "kakao" ? { kakao: true, email: false } : { kakao: false, email: true },
      alerts: { deadline: true, reopen: true, fresh: false } };
    store.set("user", user);
    var d = getDiag();
    if (diagComplete(d)) store.set("savedResult", { at: new Date().toISOString(), diag: d });
    track("login_success", { provider: provider, mode: "demo" });
  }
  function logout() { store.del("user"); toast("로그아웃했어요."); go("#/"); }

  /* ---------- 화면 공통 ---------- */
  function header(active) {
    var u = getUser();
    return '<header class="site-header"><div class="inner">' +
      '<a class="logo" href="#/" aria-label="커먼빌리지 홈"><img class="logo-mobile" src="brand/logo-ko-mobile.svg" alt="커먼빌리지"><img class="logo-wide" src="brand/logo-ko-header.svg" alt="커먼빌리지 Common Village"></a>' +
      '<nav class="nav" aria-label="주요 메뉴">' +
      '<a class="nav-link" href="#/programs"' + (active === "programs" ? ' aria-current="page"' : "") + '>공고 전체</a>' +
      '<a class="nav-link" href="#/regions"' + (active === "regions" ? ' aria-current="page"' : "") + '>지역 정보</a>' +
      '<a class="nav-link" href="#/for-gov"' + (active === "gov" ? ' aria-current="page"' : "") + '>지자체 안내</a>' +
      (u ? '<a class="nav-login" href="#/my">내 결과</a>' : '<a class="nav-login" href="#" data-action="open-login" data-reason="header">로그인</a>') +
      "</nav></div></header>";
  }
  function footer() {
    return '<footer class="site-footer"><div class="inner"><nav aria-label="하단 메뉴"><a href="#/programs">공고 전체</a><a href="#/regions">지역 정보</a><a href="#/for-gov">지자체 안내</a><a href="#/report">성과 리포트 샘플</a><a href="#/privacy">개인정보 처리방침</a></nav>' +
      "<p>공고 정보는 기관 원문을 기준으로 정리하며 확인일을 함께 표시합니다. 신청 전 반드시 원문을 확인하세요.</p><p>© 커먼빌리지 · 이음전략소</p></div></footer>";
  }
  var keepScroll = false;
  function render(html, active) {
    var y = window.scrollY;
    app.innerHTML = header(active) + "<main id=\"main\" tabindex=\"-1\">" + html + "</main>" + footer();
    window.scrollTo(0, keepScroll ? y : 0);
    keepScroll = false;
  }
  function refresh(fn) { keepScroll = true; fn(); }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function toast(msg) {
    var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2400);
  }

  function deadlineTag(p) {
    if (!isOpen(p)) return '<span class="tag tag-closed">모집 종료</span>';
    if (p.deadlineType === "date") {
      var n = daysLeft(p.deadline);
      var cls = n <= 7 ? "tag-urgent" : n <= 14 ? "tag-soon" : "tag-plain";
      return '<span class="tag ' + cls + '">' + md(p.deadline) + " 마감</span>";
    }
    var label = { "first-come": "선착순", budget: "예산 소진 시", "year-round": "연중" }[p.deadlineType] || "마감일 확인 중";
    return '<span class="tag tag-plain">' + label + "</span>";
  }
  function verifyTag(p) {
    var m = { official: ["tag-official", "기관 원문 확인"], operator: ["tag-operator", "운영사 안내"], news: ["tag-news", "보도 기준 · 원문 확인 중"] }[p.verify];
    return '<span class="tag ' + m[0] + '">' + m[1] + "</span>";
  }
  function placeOf(p) { return p.province === "전국" ? "전국" : p.province + (p.area ? " " + p.area : ""); }
  function programCard(p) {
    return '<a class="program" href="#/program/' + esc(p.id) + '">' +
      '<span class="tags">' + deadlineTag(p) + verifyTag(p) + "</span>" +
      '<span class="title">' + esc(p.title) + "</span>" +
      '<span class="benefit">' + (p.benefit ? esc(p.benefit) : '<span class="muted">혜택 원문 확인 필요</span>') + "</span>" +
      '<span class="meta">' + esc(placeOf(p)) + " · " + TYPE_LABEL[p.type] + " · 확인일 " + dotDate(p.checkedAt) + "</span></a>";
  }
  function sortOpen(a, b) {
    var rank = function (p) { return p.deadlineType === "date" ? 0 : p.deadlineType === "first-come" ? 1 : p.deadlineType === "budget" ? 2 : 3; };
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (a.deadline && b.deadline) return daysLeft(a.deadline) - daysLeft(b.deadline);
    return a.title.localeCompare(b.title, "ko");
  }

  /* ---------- 홈 ---------- */
  var homeChips = { duration: [], province: [], cond: ["open"] };
  function chipBtn(group, value, label, on) {
    return '<button type="button" class="chip" data-action="chip" data-group="' + group + '" data-value="' + esc(value) + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(label) + "</button>";
  }
  function heroScene() {
    return '<svg class="scene" viewBox="0 0 1440 460" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<circle cx="1180" cy="110" r="56" fill="#EB6226"/><circle cx="1180" cy="110" r="28" fill="#F6BC43"/>' +
      '<g fill="none" stroke="#5D7A90" stroke-width="1.5"><polyline points="0,370 90,300 180,370 180,430 0,430"/><polyline points="160,350 280,260 400,350 400,430 160,430"/><polyline points="1000,360 1100,290 1200,360 1200,430 1000,430"/><polyline points="1180,340 1300,250 1420,340 1420,430 1180,430"/><line x1="0" y1="430" x2="1440" y2="430"/></g></svg>';
  }
  function viewHome() {
    var q = QUESTIONS[0];
    var opts = q.options.map(function (o) {
      return '<button type="button" class="option" data-action="home-purpose" data-value="' + o.v + '"><span><span class="t">' + o.t + '</span><span class="s">' + o.s + "</span></span>" + ICON_NEXT + "</button>";
    }).join("");
    var soon = PROGRAMS.filter(isOpen).sort(sortOpen).slice(0, 3).map(programCard).join("");
    var provTiles = PROVINCES.map(function (pv) {
      var regs = REGIONS.filter(function (r) { return r.province === pv.name; }).map(function (r) { return r.name; });
      return '<a class="prov-tile" href="#/regions/' + encodeURIComponent(pv.name) + '"><b>' + pv.name + "</b><span>" + regs.join(" · ") + "</span></a>";
    }).join("");
    var c = homeChips;
    var html =
      '<section class="hero"><div class="inner">' + heroScene() +
      '<span class="photo-note">대표 이미지 자리 · 직접 촬영한 생활 장면</span>' +
      '<p class="eyebrow">전국 지역 살아보기·워케이션 공고</p><h1>나는 어느 지역에서 살아볼 수 있을까?</h1></div></section>' +
      '<section class="diag-card" aria-labelledby="diag-q"><div class="diag-top"><span class="badge-diag">1분 진단</span><span class="small muted">질문 1 / 6</span></div>' +
      '<div class="progress" aria-hidden="true"><span style="width:16%"></span></div>' +
      '<h2 class="diag-q" id="diag-q">' + q.q + '</h2><div class="options three">' + opts + "</div>" +
      '<p class="diag-foot">결과는 로그인 없이 바로 확인할 수 있어요</p></section>' +
      '<div class="narrow" style="max-width:992px"><section class="card section" aria-labelledby="chip-h">' +
      '<div class="section-head" style="display:block"><h2 id="chip-h">조건만 골라도 찾아드려요</h2><p>어디로 갈지 몰라도 괜찮아요</p></div>' +
      '<div class="chip-group"><span class="chip-label">기간</span><div class="chips">' +
      ["1w", "2-4w", "1-3m", "3m+"].map(function (v) { return chipBtn("duration", v, DURATION_LABEL[v], c.duration.indexOf(v) >= 0); }).join("") + "</div></div>" +
      '<div class="chip-group"><span class="chip-label">지역</span><div class="chips">' + chipBtn("province", "", "어디든 좋아요", !c.province.length) +
      PROVINCES.map(function (pv) { return chipBtn("province", pv.name, pv.name, c.province.indexOf(pv.name) >= 0); }).join("") + "</div></div>" +
      '<div class="chip-group"><span class="chip-label">조건</span><div class="chips">' + chipBtn("cond", "open", "모집 중만", c.cond.indexOf("open") >= 0) +
      chipBtn("cond", "nopay", "자부담 0원", c.cond.indexOf("nopay") >= 0) + chipBtn("cond", "nosns", "SNS 과제 없음", c.cond.indexOf("nosns") >= 0) + "</div></div>" +
      '<button type="button" class="btn btn-primary btn-block" style="margin-top:18px" data-action="home-search">조건에 맞는 공고 보기</button></section></div>' +
      '<div class="wrap"><section class="section"><div class="section-head"><h2>마감 임박 공고</h2><a href="#/programs">전체 보기</a></div><div class="program-list grid">' + soon + "</div></section>" +
      '<section class="section"><div class="section-head"><div><h2>도별 지역 정보</h2><p>장보기·병원·이동까지, 직접 확인한 생활 정보</p></div></div><div class="prov-grid">' + provTiles + "</div></section>" +
      '<section class="section home-gov"><p class="eyebrow">지자체 담당자님께</p><h2>지자체는 오래 머물 사람을 찾고,<br>사람은 나에게 맞는 지역을 찾습니다</h2>' +
      '<p class="lead">공고를 올리는 데서 끝나지 않고, 지역에 오래 머물 사람을 모집합니다. 노출 수가 아니라 \'적합 수요자 수\'로 성과를 보고합니다.</p>' +
      '<div class="gov-actions"><a class="btn btn-yellow" href="#/for-gov">지자체 전용 안내 보기</a><a class="btn btn-ghost-w" href="#/report">성과 리포트 샘플 보기</a></div></section></div>';
    render(html, "home");
  }

  /* ---------- 진단 ---------- */
  function viewStep(n) {
    var d = getDiag();
    if (n > 1 && !d.purpose) return go("#/diagnose/1");
    var q = QUESTIONS[n - 1];
    var body = "";
    var canNext = false;
    if (q.key === "priorities") {
      var opts = PRIORITY_OPTIONS[d.purpose] || PRIORITY_OPTIONS.rest;
      var sel = d.priorities || [];
      body = '<div class="options">' + opts.map(function (o) {
        var on = sel.indexOf(o) >= 0;
        return '<button type="button" class="option" data-action="pick-multi" data-value="' + esc(o) + '" aria-pressed="' + on + '"><span class="t">' + esc(o) + "</span>" + (on ? ICON_CHECK : "") + "</button>";
      }).join("") + "</div><p class=\"small muted\" style=\"margin-top:10px\">" + sel.length + " / 2 선택</p>";
      canNext = sel.length === 2;
    } else if (q.key === "basic") {
      body = '<p class="sub-q">연령대</p><div class="chips">' + AGES.map(function (a) { return chipBtn("age", a.v, a.t, d.age === a.v); }).join("") + "</div>" +
        '<p class="sub-q">지금 사는 곳</p><div class="chips">' + RESIDENCES.map(function (r) { return chipBtn("residence", r, r, d.residence === r); }).join("") + "</div>" +
        '<p class="disclaimer">판정은 공고 원문을 바탕으로 한 참고 정보예요. 최종 자격은 운영 기관이 정합니다. 입력한 내용은 로그인 전까지 이 기기에만 저장돼요.</p>';
      canNext = !!(d.age && d.residence);
    } else {
      body = '<div class="options">' + q.options.map(function (o) {
        var on = d[q.key] === o.v;
        return '<button type="button" class="option" data-action="pick" data-key="' + q.key + '" data-value="' + o.v + '" aria-pressed="' + on + '"><span><span class="t">' + o.t + "</span>" + (o.s ? '<span class="s">' + o.s + "</span>" : "") + "</span>" + (on ? ICON_CHECK : "") + "</button>";
      }).join("") + "</div>";
      canNext = !!d[q.key];
    }
    var last = n === QUESTIONS.length;
    var html = '<div class="step-page"><div class="step-top"><button type="button" class="back" data-action="step-back" data-step="' + n + '" aria-label="이전">' + ICON_BACK + '</button><b style="font-size:15px">1분 진단</b><span class="small muted">' + n + " / 6</span></div>" +
      '<div class="progress" aria-hidden="true"><span style="width:' + Math.round(n / 6 * 100) + '%"></span></div>' +
      "<h1>" + q.q + "</h1>" + (q.help ? '<p class="help">' + q.help + "</p>" : '<p class="help"></p>') + body +
      '<div class="grow"></div><button type="button" class="btn btn-primary btn-block next" data-action="step-next" data-step="' + n + '"' + (canNext ? "" : " disabled") + ">" + (last ? "결과 보기" : "다음") + "</button></div>";
    render(html, "diagnose");
  }

  /* ---------- 결과 ---------- */
  var resultProvinces = [];
  function viewResult() {
    var d = getDiag();
    if (!diagComplete(d)) return go("#/diagnose/1");
    var u = getUser();
    var rec = recommend(d, resultProvinces);
    var cond = PURPOSE_LABEL[d.purpose] + " · " + DURATION_LABEL[d.duration] + " · " + COMPANION_LABEL[d.companion] + " · " + d.residence + " 거주";
    var chips = '<div class="chips scroll" style="margin-bottom:16px">' + chipBtn("rprov", "", "어디든", !resultProvinces.length) +
      PROVINCES.map(function (pv) { return chipBtn("rprov", pv.name, pv.name, resultProvinces.indexOf(pv.name) >= 0); }).join("") + "</div>";
    var top = rec.ranked[0];
    var topHtml;
    if (!top) {
      topHtml = '<div class="card empty"><p>고른 지역에는 지금 맞는 모집 공고가 없어요.</p><p style="margin-top:8px">지역을 "어디든"으로 바꾸거나, 지난 모집을 보고 재모집 알림을 받아보세요.</p><a class="btn btn-line" style="margin-top:16px" href="#/programs?tab=closed">지난 모집 보기</a></div>';
    } else {
      topHtml = rankCard(top, d, 1, true);
    }
    var rest = rec.ranked.slice(1, 3);
    var restHtml = "";
    if (u) {
      restHtml = rest.map(function (g, i) { return rankCard(g, d, i + 2, false); }).join("") +
        (rec.nationwide.length ? '<section class="card"><h3 style="font-size:17px">어디서든 신청할 수 있는 전국 공고</h3><div class="program-list" style="margin-top:12px">' + rec.nationwide.map(programCard).join("") + "</div></section>" : "") +
        compareTable(rec.ranked.slice(0, 3));
    } else if (rest.length || rec.nationwide.length) {
      restHtml = '<div class="locked"><div class="blur" aria-hidden="true"><div class="card"></div><div class="card"></div><div class="card"></div></div>' +
        '<section class="card gate">' + ICON_LOCK + "<h3>" + (rest.length ? (rest.length + 1) + "순위까지와 지역 비교는<br>" : "전국 공고와 지역 비교는<br>") + "로그인 후 볼 수 있어요</h3>" +
        '<p class="small muted" style="margin-bottom:14px">결과 저장 · 마감 임박·재모집 알림까지</p>' +
        '<button type="button" class="btn btn-primary btn-block" data-action="open-login" data-reason="result">로그인하고 전체 결과 보기</button></section></div>';
    }
    var html = '<div class="narrow"><section class="result-head"><p class="cond">' + esc(cond) + "</p><h1>조건에 맞는 모집 중 공고<br><em>" + rec.total + "건</em>을 찾았어요</h1>" +
      '<p class="small muted" style="margin-top:6px">신청 가능 ' + rec.ok + "건 · 확인 필요 " + rec.warn + "건</p></section>" + chips + topHtml + restHtml +
      '<p style="margin-top:20px"><a href="#/diagnose/1" data-action="restart">조건 바꿔서 다시 진단</a></p></div>';
    render(html, "result");
    track("diagnosis_result_view", { total: rec.total, loggedIn: !!u });
  }
  function rankCard(g, d, rank, primary) {
    var verdictPill = g.ok ? '<span class="pill pill-ok">신청 가능 ' + g.ok + "건</span>" : '<span class="pill pill-warn">확인 필요 ' + g.warn + "건</span>";
    var progs = g.programs.map(function (x) {
      return '<li><a href="#/program/' + esc(x.p.id) + '">' + esc(x.p.title) + '</a> <span class="small muted">' + VERDICT_LABEL[x.j.state] + "</span></li>";
    }).join("");
    return '<section class="card' + (primary ? " top-card" : "") + '" style="margin-top:' + (primary ? "0" : "16px") + '">' +
      '<div class="row"><span class="pill pill-rank">' + rank + "순위</span>" + verdictPill + "</div>" +
      '<p class="small muted" style="margin-top:10px">' + esc(g.province) + "</p><h2>" + esc(g.key) + "</h2>" +
      '<ul class="reasons">' + reasonsFor(g, d).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
      (g.warn ? '<p class="notice-box">확인 필요: 세부 자격 조건은 공고 원문에서 확인하세요.</p>' : "") +
      '<ul style="margin:12px 0 0;padding-left:18px;font-size:15px">' + progs + "</ul></section>";
  }
  function compareTable(groups) {
    if (!groups.length) return "";
    var head = "<tr><th>지표</th>" + groups.map(function (g) { return "<th>" + esc(g.key) + "</th>"; }).join("") + "</tr>";
    var rows = METRICS.map(function (m) {
      return "<tr><td>" + m.label + "</td>" + groups.map(function (g) {
        var r = regionRecord(g.key), v = r && r.metrics[m.key];
        return "<td>" + (v && v.value ? esc(v.value) : '<span class="muted">정리 중</span>') + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<section class="card doc" style="margin-top:16px"><h3 style="font-size:17px;margin-bottom:12px">지역 생활 정보 비교</h3><div style="overflow-x:auto"><table>' + head + rows + "</table></div></section>";
  }

  /* ---------- 공고 목록 ---------- */
  var listState = { tab: "open", province: [], duration: [], cond: [], showUnknown: false };
  function viewList(params) {
    if (params.tab) listState.tab = params.tab;
    if (params.province !== undefined) listState.province = params.province ? params.province.split(",") : [];
    if (params.duration !== undefined) listState.duration = params.duration ? params.duration.split(",") : [];
    if (params.cond !== undefined) listState.cond = params.cond ? params.cond.split(",") : [];
    var s = listState;
    var base = PROGRAMS.filter(function (p) { return s.tab === "open" ? isOpen(p) : !isOpen(p); })
      .filter(function (p) { return !s.province.length || s.province.indexOf(p.province) >= 0 || p.province === "전국"; });
    var strictConds = s.cond.filter(function (c) { return c === "nopay" || c === "nosns"; });
    var matched = base.filter(function (p) {
      return strictConds.every(function (c) { return c === "nopay" ? p.selfPay === 0 : p.snsTask === false; });
    });
    var unknownCount = base.length - matched.length;
    var shown = s.showUnknown ? base : matched;
    shown = shown.slice().sort(s.tab === "open" ? sortOpen : function (a, b) { return a.title.localeCompare(b.title, "ko"); });
    var durationNote = s.duration.length ? '<p class="small muted" style="margin:0 0 10px">체류 기간 정보가 아직 정리되지 않은 공고도 함께 보여드려요. 기간은 원문에서 확인하세요.</p>' : "";
    var unknownNote = strictConds.length && unknownCount && !s.showUnknown ?
      '<div class="card empty" style="margin-bottom:10px"><p>' + (matched.length ? "" : "아직 이 조건이 확인된 공고가 없어요. ") + "자부담·SNS 과제 정보가 정리되지 않은 공고가 " + unknownCount + "건 있어요.</p>" +
      '<button type="button" class="btn btn-line" style="margin-top:12px" data-action="show-unknown">정보 미확인 공고도 보기</button></div>' : "";
    var html = '<div class="wrap"><div class="card" style="margin-top:20px"><h1 style="font-size:24px;margin-bottom:14px">공고 전체</h1>' +
      '<div class="chip-group"><div class="chips">' + chipBtn("lprov", "", "어디든", !s.province.length) + PROVINCES.map(function (pv) { return chipBtn("lprov", pv.name, pv.name, s.province.indexOf(pv.name) >= 0); }).join("") + "</div></div>" +
      '<div class="chip-group"><div class="chips">' + ["1w", "2-4w", "1-3m", "3m+"].map(function (v) { return chipBtn("ldur", v, DURATION_LABEL[v], s.duration.indexOf(v) >= 0); }).join("") +
      chipBtn("lcond", "nopay", "자부담 0원", s.cond.indexOf("nopay") >= 0) + chipBtn("lcond", "nosns", "SNS 과제 없음", s.cond.indexOf("nosns") >= 0) + "</div></div>" +
      '<div class="tabs" role="tablist" style="margin-top:16px"><button type="button" role="tab" data-action="tab" data-value="open" aria-selected="' + (s.tab === "open") + '">모집 중</button><button type="button" role="tab" data-action="tab" data-value="closed" aria-selected="' + (s.tab === "closed") + '">지난 모집</button></div></div>' +
      '<div style="display:flex;justify-content:space-between;padding:14px 4px 8px" class="small muted"><span>' + shown.length + "건</span><span>" + (s.tab === "open" ? "마감 임박순" : "가나다순") + "</span></div>" +
      durationNote + unknownNote + '<div class="program-list grid">' + (shown.length ? shown.map(programCard).join("") : "") + "</div></div>";
    render(html, "programs");
  }

  /* ---------- 공고 상세 ---------- */
  function fact(label, v) { return "<dt>" + label + "</dt><dd>" + (v == null ? '<span class="unknown">원문 확인 필요</span>' : esc(v)) + "</dd>"; }
  function viewProgram(id) {
    var p = PROGRAMS.filter(function (x) { return x.id === id; })[0];
    if (!p) return render('<div class="narrow"><div class="card empty" style="margin-top:24px"><p>공고를 찾을 수 없어요. 마감되었거나 주소가 바뀌었을 수 있어요.</p><a class="btn btn-line" style="margin-top:12px" href="#/programs">공고 전체 보기</a></div></div>', "programs");
    var d = getDiag();
    var u = getUser();
    var favs = store.get("favs", []);
    var faved = favs.indexOf(p.id) >= 0;
    var deadlineText = p.deadlineType === "date" ? dotDate(p.deadline) : (p.deadlineNote || null);
    var verdict;
    if (diagComplete(d) || d.purpose) {
      var j = judge(p, d);
      verdict = '<div class="verdict ' + (j.state === "closed" ? "no" : j.state) + '">' + VERDICT_LABEL[j.state] + "</div>" +
        '<ul style="margin:12px 0;padding-left:18px;font-size:14px;line-height:1.7">' + j.items.map(function (i) { return "<li>" + esc(i.t) + "</li>"; }).join("") + "</ul>";
    } else {
      verdict = '<p class="small muted" style="margin-bottom:12px">1분 진단을 하면 내 조건으로 신청 가능 여부를 판정해 드려요.</p><a class="btn btn-line btn-block" href="#/diagnose/1">1분 진단하기</a>';
    }
    var reg = regionRecord(p.area);
    var regionHtml = reg ? '<section class="card section"><div class="section-head"><h2>' + esc(reg.name) + ' 생활 정보</h2><a href="#/regions/' + encodeURIComponent(reg.province) + '">자세히</a></div><div class="metric-grid">' +
      METRICS.map(function (m) { var v = reg.metrics[m.key]; return '<div class="metric-tile"><span class="k">' + m.label + "</span>" + (v && v.value ? esc(v.value) : '<span class="muted">정리 중</span>') + "</div>"; }).join("") + "</div></section>" : "";
    var html = '<div class="narrow" style="padding:0"><section class="detail-head"><a href="#/programs" style="font-size:14px;text-decoration:none">← 공고 목록</a>' +
      '<div class="tags" style="margin-top:12px">' + deadlineTag(p) + verifyTag(p) + '<span class="tag tag-plain">확인일 ' + dotDate(p.checkedAt) + "</span></div>" +
      "<h1>" + esc(p.title) + '</h1><p class="small muted">' + esc(placeOf(p)) + " · " + TYPE_LABEL[p.type] + "</p>" +
      '<dl class="facts">' + fact("마감", deadlineText) + fact("기간", p.duration) + fact("대상", p.target) + fact("혜택", p.benefit) +
      fact("자부담", p.selfPay == null ? null : (p.selfPay === 0 ? "없음" : p.selfPay)) + fact("과제", p.snsTask == null ? null : (p.snsTask ? "SNS·활동 과제 있음" : "없음")) + "</dl>" +
      (p.note ? '<p class="notice-box" style="margin-top:14px">' + esc(p.note) + "</p>" : "") + "</section>" +
      '<div style="padding:0 16px"><section class="card section"><h2 style="font-size:18px;margin-bottom:12px">내 조건으로 본 판정</h2>' + verdict +
      '<p class="small muted" style="margin-top:12px">판정은 공고 원문을 기준으로 한 참고 정보입니다. 최종 자격은 운영 기관에 확인하세요. <a href="mailto:' + esc(CFG.contactEmail || "") + "?subject=" + encodeURIComponent("[판정 오류 신고] " + p.title) + '">판정 오류 신고</a></p></section>' +
      regionHtml +
      '<p class="small muted" style="margin-top:20px">출처: ' + (p.sourceUrl ? '<a href="' + esc(p.sourceUrl) + '" target="_blank" rel="noopener">기관 원문</a>' : "원문 링크 등록 전") + "</p>" +
      '<p class="small muted">참여 후기는 다음 업데이트에서 열립니다.</p></div>' +
      '<div class="sticky-cta"><button type="button" class="icon-btn" data-action="fav" data-id="' + esc(p.id) + '" aria-pressed="' + faved + '" aria-label="관심 공고로 저장">' + ICON_SAVE + "</button>" +
      (isOpen(p) ? (p.sourceUrl ? '<a class="btn btn-primary" style="flex-grow:1" href="' + esc(p.sourceUrl) + '" target="_blank" rel="noopener" data-action="apply" data-id="' + esc(p.id) + '">기관 원문에서 신청하기</a>' : '<button type="button" class="btn btn-primary" style="flex-grow:1" disabled>원문 링크 준비 중</button>') :
        '<button type="button" class="btn btn-soft" style="flex-grow:1" data-action="watch" data-id="' + esc(p.id) + '">다시 열리면 알림 받기</button>') + "</div></div>";
    render(html, "programs");
    track("program_view", { id: p.id, loggedIn: !!u });
  }

  /* ---------- 지역 정보 ---------- */
  function viewRegions(province) {
    var pv = PROVINCES.filter(function (x) { return x.name === province; })[0] || PROVINCES[0];
    var regs = REGIONS.filter(function (r) { return r.province === pv.name; });
    var watch = store.get("watch", []);
    var cards = regs.map(function (r) {
      var progs = PROGRAMS.filter(function (p) { return p.area === r.name; });
      var open = progs.filter(isOpen), closed = progs.filter(function (p) { return !isOpen(p); });
      var statusPill = open.length ? '<span class="pill pill-ok">모집 중 ' + open.length + "건</span>" : closed.length ? '<span class="pill pill-no">지난 모집</span>' : "";
      var rows = METRICS.map(function (m) {
        var v = r.metrics[m.key];
        var src = v && v.value ? "출처: " + (m.source || "확인 중") + " · 기준일 " + dotDate(v.basedOn) : (m.source ? "출처 예정: " + m.source : "출처 확인 중");
        return '<div class="metric-row"><div class="top"><b>' + m.label + "</b><span>" + (v && v.value ? esc(v.value) : '<span class="muted">정리 중</span>') + '</span></div><p class="src">' + m.question + " · " + esc(src) + "</p></div>";
      }).join("");
      var action = open.length ? '<a class="btn btn-line btn-block" style="margin-top:12px" href="#/program/' + esc(open[0].id) + '">' + esc(r.name) + " 모집 공고 보기</a>" :
        '<button type="button" class="btn btn-soft btn-block" style="margin-top:12px" data-action="watch-region" data-id="' + esc(r.id) + '" aria-pressed="' + (watch.indexOf("region:" + r.id) >= 0) + '">' + (watch.indexOf("region:" + r.id) >= 0 ? "재모집 알림 신청됨" : esc(r.name) + "이 다시 열리면 알림 받기") + "</button>";
      return '<section class="card"><div class="row" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 style="font-size:22px">' + esc(r.name) + "</h2>" + statusPill + "</div>" +
        '<p style="margin:8px 0 6px;font-size:14px">' + (r.intro ? esc(r.intro) : '<span class="muted">지역 소개를 운영팀이 정리하고 있어요.</span>') + "</p>" + rows + action + "</section>";
    }).join("");
    var tabs = '<div class="province-tabs">' + PROVINCES.map(function (x) {
      return '<button type="button" data-action="province" data-value="' + x.name + '" aria-pressed="' + (x.name === pv.name) + '">' + x.name + "</button>";
    }).join("") + "</div>";
    var html = '<div class="wrap"><section style="padding:24px 4px 16px"><h1 style="font-size:24px">도별 지역 정보</h1><p class="muted" style="font-size:14px;margin-top:6px">관광지보다 생활을 봅니다. 모든 정보에 출처와 기준일을 붙여요.</p></section>' +
      tabs + '<p class="small muted" style="margin:12px 4px">' + pv.name + " · " + pv.includes + " · " + regs.length + "곳</p>" +
      '<div class="region-grid">' + cards + "</div></div>";
    render(html, "regions");
  }

  /* ---------- 내 결과·알림 ---------- */
  function viewMy() {
    var u = getUser();
    if (!u) {
      return render('<div class="narrow"><div class="card empty" style="margin-top:24px">' + ICON_LOCK + '<p style="margin-top:8px">로그인하면 진단 결과를 저장하고 알림을 받을 수 있어요.</p><button type="button" class="btn btn-primary" style="margin-top:14px" data-action="open-login" data-reason="my">로그인</button></div></div>', "my");
    }
    var saved = store.get("savedResult", null);
    var favs = store.get("favs", []);
    var watch = store.get("watch", []);
    var savedHtml;
    if (saved && diagComplete(saved.diag)) {
      var rec = recommend(saved.diag, []);
      savedHtml = '<p class="small muted">' + esc(PURPOSE_LABEL[saved.diag.purpose] + " · " + DURATION_LABEL[saved.diag.duration] + " · " + COMPANION_LABEL[saved.diag.companion]) + " · 저장 " + dotDate(saved.at.slice(0, 10)) + "</p>" +
        '<ol class="rank-list">' + rec.ranked.slice(0, 3).map(function (g, i) {
          return "<li><b>" + (i + 1) + " · " + esc(g.key) + '</b><span class="small" style="color:' + (g.ok ? "var(--ok)" : "var(--warn)") + '">' + (g.ok ? "신청 가능 " + g.ok + "건" : "확인 필요 " + g.warn + "건") + "</span></li>";
        }).join("") + "</ol>" + '<p style="margin-top:12px"><a href="#/result">결과 다시 보기</a> · <a href="#/diagnose/1" data-action="restart">조건 바꿔서 다시 진단</a></p>';
    } else {
      savedHtml = '<p class="muted">저장된 진단 결과가 없어요.</p><a class="btn btn-line" style="margin-top:12px" href="#/diagnose/1">1분 진단하기</a>';
    }
    var favItems = favs.map(function (id) { return PROGRAMS.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean);
    var watchItems = watch.map(function (w) {
      if (w.indexOf("region:") === 0) { var r = REGIONS.filter(function (x) { return "region:" + x.id === w; })[0]; return r ? { t: r.name + " 재모집", href: "#/regions/" + encodeURIComponent(r.province) } : null; }
      var p = PROGRAMS.filter(function (x) { return x.id === w; })[0]; return p ? { t: p.title + " 재모집", href: "#/program/" + p.id } : null;
    }).filter(Boolean);
    var favHtml = favItems.length || watchItems.length ? '<ul style="list-style:none;padding:0;margin:0">' +
      favItems.map(function (p) { return '<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 0;border-bottom:1px solid var(--sand)"><a href="#/program/' + p.id + '" style="text-decoration:none;font-weight:600">' + esc(p.title) + "</a>" + deadlineTag(p) + "</li>"; }).join("") +
      watchItems.map(function (w) { return '<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 0;border-bottom:1px solid var(--sand)"><a href="' + w.href + '" style="text-decoration:none;font-weight:600">' + esc(w.t) + '</a><span class="tag tag-plain">알림 대기</span></li>'; }).join("") + "</ul>"
      : '<p class="muted">공고 상세에서 저장 버튼을 누르면 여기에 모여요.</p>';
    function channel(key, title, sub) {
      var on = !!u.channels[key];
      return '<button type="button" class="check-option" data-action="channel" data-value="' + key + '" aria-pressed="' + on + '"><span><b style="display:block;font-size:16px">' + title + '</b><span class="small muted">' + sub + '</span></span><span class="box">' + (on ? ICON_TICK_W : "") + "</span></button>";
    }
    function sw(key, label) {
      return '<div class="switch-row"><span>' + label + '</span><button type="button" class="switch" role="switch" data-action="alert" data-value="' + key + '" aria-checked="' + !!u.alerts[key] + '" aria-label="' + label + ' 알림"></button></div>';
    }
    var demo = CFG.authMode === "demo" ? '<p class="demo-note">미리보기 모드예요. 설정은 이 기기에만 저장되고 알림은 실제로 발송되지 않아요.</p>' : "";
    var html = '<div class="narrow"><section style="padding:24px 4px 8px"><h1 style="font-size:26px">내 결과·알림</h1><p class="small muted" style="margin-top:4px">' + esc(u.name) + "으로 로그인 중</p></section>" + demo +
      '<section class="card"><h2 style="font-size:18px;margin-bottom:8px">저장된 진단 결과</h2>' + savedHtml + "</section>" +
      '<section class="card"><h2 style="font-size:18px;margin-bottom:8px">관심 공고</h2>' + favHtml + "</section>" +
      '<section class="card"><h2 style="font-size:18px;margin-bottom:12px">알림 받을 곳</h2><div style="display:grid;gap:10px">' +
      channel("kakao", "카카오톡", "커먼빌리지 채널로 받기" + (u.provider === "google" ? " (카카오 연결 필요)" : "")) + channel("email", "이메일", "로그인 계정 이메일로 받기") +
      '</div><p class="small muted" style="margin-top:10px">둘 다 고를 수 있어요.</p><hr style="border:0;border-top:1px solid var(--sand);margin:16px 0"><h3 style="font-size:16px">받을 알림</h3>' +
      sw("deadline", "관심 공고 마감 임박") + sw("reopen", "지난 모집 재모집") + sw("fresh", "내 조건에 맞는 새 공고") + "</section>" +
      '<p style="display:flex;gap:20px;margin:20px 4px"><button type="button" data-action="logout" style="border:0;background:none;padding:8px 0;color:var(--sub)">로그아웃</button><button type="button" data-action="withdraw" style="border:0;background:none;padding:8px 0;color:var(--sub)">회원 탈퇴</button></p></div>';
    render(html, "my");
  }

  /* ---------- 지자체 전용 · 성과 리포트 샘플 ---------- */
  var MAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function govHead(eyebrow, title) { return '<div class="sec-head"><p class="eyebrow">' + eyebrow + "</p><h2>" + title + "</h2></div>"; }
  function govCard(title, body) { return '<div class="card"><h3>' + title + "</h3><p>" + body + "</p></div>"; }
  function kpi(value, label, note, lead) { return '<div class="kpi' + (lead ? " lead" : "") + '"><b>' + value + "</b><span>" + label + "</span><p>" + note + "</p></div>"; }
  function viewForGov() {
    var html =
      '<section class="gov-hero"><div class="wrap"><p class="eyebrow">지자체 담당자 전용</p>' +
      "<h1>공고를 올리는 데서 끝나지 않고,<br>지역에 오래 머물 사람을 모집합니다</h1>" +
      '<p class="lead">체류형 지원사업의 공고 게시부터 자격 판정, 모집, 성과 리포트까지 한 번에 맡습니다. 노출 수가 아니라 \'적합 수요자 수\'로 보고합니다.</p>' +
      '<div class="gov-actions"><a class="btn btn-yellow" href="#/for-gov" data-action="scroll-to" data-target="gov-contact">도입 문의하기</a>' +
      '<a class="btn btn-ghost-w" href="#/report">성과 리포트 샘플 보기</a></div></div></section>' +

      '<section class="gov-sec"><div class="wrap">' + govHead("이런 상황이 반복되지 않습니까", "공고는 냈는데, 사람이 오지 않습니다") +
      '<div class="g3">' +
      govCard("① 공고를 홈페이지에만 올립니다", "시·군 홈페이지 공지사항에 올리고 나면 그다음이 없습니다. 찾아올 사람은 이미 이 사업을 알고 있는 사람뿐입니다.") +
      govCard("② 신청자가 요건에 안 맞습니다", "거주지·연령·기간 요건을 못 채운 신청서가 섞여 들어옵니다. 걸러내는 데 시간이 들고, 정작 모집 인원은 못 채웁니다.") +
      govCard("③ 성과를 숫자로 쓰기 어렵습니다", "홍보대행 보고서에는 노출 수와 도달 수가 적혀 있습니다. 정작 필요한 건 \"타 지역에서 몇 명이 왔는가\"입니다.") +
      "</div></div></section>" +

      '<section class="gov-sec alt"><div class="wrap"><div class="g2" style="align-items:center"><div>' +
      '<p class="eyebrow">왜 지금인가</p><h2>평가 언어가 \'방문객\'에서 \'머문 사람\'으로 옮겨가고 있습니다</h2>' +
      '<p class="body">지방소멸대응기금을 비롯한 인구 정책 사업의 성과평가는 얼마나 많이 왔는지보다 <strong>어디에서 온 사람이 얼마나 오래 머물렀는지</strong>를 묻는 쪽으로 바뀌고 있습니다.</p>' +
      '<p class="body">그러려면 신청 단계에서부터 "타 지역 거주자인가", "체류 기간이 얼마인가"가 데이터로 남아 있어야 합니다. 홍보 채널에는 그 데이터가 남지 않습니다.</p>' +
      '<p class="small muted" style="margin-top:14px">평가지표 명칭·배점은 연도와 사업별로 다릅니다. 제안 시 해당 사업 지침 기준으로 맞춰 드립니다.</p></div>' +
      '<div class="card"><h3>커먼빌리지가 남기는 데이터</h3><ul class="gov-list">' +
      "<li>타 지역 거주 신청자 수 — 인구유입 효과 증빙</li><li>자격 판정을 통과한 적합 수요자 수</li><li>희망 체류 기간 분포(1주 / 2~4주 / 1~3개월 / 3개월+)</li>" +
      "<li>공고 노출 → 상세 조회 → 자격 판정 → 신청까지의 전환율</li><li>탈락 사유 분포 — 다음 회차 요건 설계에 씁니다</li></ul>" +
      '<p class="small muted" style="margin-top:14px">개인을 식별할 수 있는 정보는 제공하지 않습니다. 5명 미만 세그먼트는 재식별 방지를 위해 표시하지 않습니다.</p></div></div></div></section>' +

      '<section class="gov-sec"><div class="wrap">' + govHead("하는 일", "게시 → 매칭 → 모집 → 리포트") + '<div class="g2">' +
      govCard("1. 공고 게시", "보내 주신 공고문을 구조화해 등재합니다. 혜택·기간·요건을 사용자가 알아볼 수 있는 말로 다시 쓰고, 원문 링크와 확인일을 함께 답니다. 협력 지자체 공고는 목록 상단에 \"지자체 협력\" 표시와 함께 노출합니다.") +
      govCard("2. 자격 매칭", "방문자가 6개 문항에 답하면 공고별로 신청 가능 / 확인 필요 / 대상 아님을 판정합니다. 요건에 맞지 않는 사람이 신청서를 쓰는 일이 줄어듭니다.") +
      govCard("3. 모집 대행", "조건에 맞는 알림 등록자에게 타깃 발송하고, 시즌 검색 콘텐츠로 유입을 만듭니다. 모집 현황은 주 단위로 공유합니다.") +
      '<div class="card"><h3>4. 성과 리포트</h3><p>사업 종료 후 전환 깔때기와 지원자 분포를 담은 리포트를 드립니다. PDF로 내려받아 기금 성과 보고에 그대로 첨부하실 수 있습니다.</p>' +
      '<p style="margin-top:12px"><a class="btn btn-line btn-sm" href="#/report">리포트 샘플 보기</a></p></div>' +
      "</div></div></section>" +

      '<section class="gov-sec alt"><div class="wrap">' + govHead("무엇이 다른가", "홍보대행과 다른 점") +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:8em"></th><th>기존 홍보대행</th><th>커먼빌리지</th></tr></thead><tbody>' +
      "<tr><th>파는 것</th><td>노출·도달</td><td>자격 판정을 통과한 적합 수요자</td></tr>" +
      "<tr><th>첫 보고 지표</th><td>노출 수, 도달 수</td><td>적합 수요자 수, 타 지역 거주 신청자 수</td></tr>" +
      "<tr><th>사람이 만나는 곳</th><td>SNS 피드·배너</td><td>지원사업을 찾으러 온 사람이 모인 목록</td></tr>" +
      "<tr><th>요건 불일치</th><td>거르지 않음 — 담당자가 처리</td><td>신청 전 판정으로 사전에 걸러짐</td></tr>" +
      "<tr><th>남는 데이터</th><td>캠페인 종료와 함께 소멸</td><td>체류 기간·거주지 분포로 다음 회차 설계에 재사용</td></tr>" +
      "<tr><th>성과 보고</th><td>홍보 실적 보고서</td><td>기금 성과평가 언어에 맞춘 리포트(PDF)</td></tr>" +
      "</tbody></table></div></div></section>" +

      '<section class="gov-sec"><div class="wrap">' + govHead("받으시는 것", "성과 리포트는 이렇게 생겼습니다") +
      '<div class="card"><p class="demo-note">아래 숫자는 화면 구성을 보여드리기 위한 예시입니다.</p><div class="g3">' +
      kpi("184", "적합 수요자 수", "자격 판정 통과", true) + kpi("151", "타 지역 거주 신청자 수", "인구유입 효과 증빙") + kpi("62", "원문 신청 전환", "공고 사이트로 이동") +
      '</div><p style="margin-top:18px"><a class="btn btn-line btn-sm" href="#/report">전체 리포트 샘플 열기 →</a></p></div>' +
      '<p class="small muted" style="margin-top:14px">리포트에는 노출 수를 첫 지표로 올리지 않습니다. 노출은 수단이지 성과가 아니기 때문입니다.</p></div></section>' +

      '<section class="gov-sec alt"><div class="wrap">' + govHead("누가 합니까", "(주)이음전략소") + '<div class="g2">' +
      '<div class="card"><h3>수행 역량</h3><p class="notice-box" style="margin-top:12px"><strong>[작성 필요]</strong> 이 블록에는 실제 수행 실적만 적습니다. 사업명·발주기관·기간·역할·검증 가능한 결과 순으로, 확인되지 않은 수치는 넣지 않습니다.</p>' +
      '<ul class="gov-list muted"><li>사업명 · 발주기관 · 수행 기간 · 역할</li><li>검증 가능한 결과(계약서·정산서로 확인되는 수치)</li><li>기관 로고는 사용 동의를 받은 것만 게시</li></ul></div>' +
      '<div class="card"><h3>계약 방식</h3><ul class="gov-list">' +
      "<li><strong>무료</strong> — 모집 공고 등록과 공식 계정 표시, 공고 원문 링크와 확인일 표시</li>" +
      "<li><strong>공고 등재·상단 노출</strong> — 모집 기간 동안 목록 상단 고정, \"지자체 협력\" 표시</li>" +
      "<li><strong>타깃 알림 발송</strong> — 조건에 맞는 알림 등록자에게 발송</li>" +
      "<li><strong>모집 대행</strong> — 시즌 콘텐츠·유입 관리 포함</li>" +
      "<li><strong>성과 리포트</strong> — 사업 종료 후 2주 내 발행, PDF 제공</li></ul>" +
      '<p class="disclaimer" style="background:var(--white)">단가와 판매 정책은 확정 전입니다. 사업 규모와 모집 목표에 따라 협의합니다.</p>' +
      '<p class="small muted" style="margin-top:12px">제안은 예산 확정기(1~2월)와 추경기(6~7월)에 맞춰 드립니다. 공고 시즌 직전에 계약하시면 모집 기간을 온전히 씁니다.</p></div>' +
      "</div></div></section>" +

      '<section class="gov-sec" id="gov-contact"><div class="narrow">' + govHead("도입 문의", "담당자님 사업에 맞춰 검토해 드립니다") +
      '<div class="card"><form id="gov-contact-form" novalidate><div class="g2">' +
      '<div class="field"><label for="c-org">기관명</label><input type="text" id="c-org" name="org" placeholder="○○군 인구정책과" autocomplete="organization"></div>' +
      '<div class="field"><label for="c-name">담당자 성함</label><input type="text" id="c-name" name="name" autocomplete="name"></div></div>' +
      '<div class="field"><label for="c-email">회신받으실 메일</label><input type="email" id="c-email" name="email" placeholder="name@korea.kr" autocomplete="email"></div>' +
      '<div class="field"><label for="c-msg">검토 중인 사업 내용 <span class="muted" style="font-weight:400">(선택)</span></label><textarea id="c-msg" name="msg" rows="3" placeholder="예: 2027년 상반기 한달살기 사업, 모집 30명 목표"></textarea></div>' +
      '<label class="agree" for="c-agree"><input type="checkbox" id="c-agree" name="agree"><span>문의 회신 목적으로 입력하신 정보를 이용하는 데 동의합니다. (필수)</span></label>' +
      '<p class="form-err" id="gov-contact-err" role="alert" hidden></p>' +
      '<p style="margin-top:18px"><button class="btn btn-primary" type="submit">문의 보내기</button></p></form>' +
      '<div id="gov-contact-done" role="status" hidden></div></div></div></section>' +

      '<section class="gov-sec navy" id="gov-subscribe"><div class="narrow"><p class="eyebrow">월 1회 발송</p><h2>「전국 체류형 지원사업 모집 현황 리포트」</h2>' +
      '<p class="lead">전국 지자체가 그달에 연 체류지원사업 공고를 모아, 어떤 조건으로 몇 명을 모집했는지 정리해 보내드립니다. 다른 지역이 무엇을 얼마에 하고 있는지 한 장으로 보실 수 있습니다.</p>' +
      '<form id="gov-sub-form" class="inline-form" novalidate><input type="email" name="email" placeholder="업무용 메일 주소" aria-label="구독 이메일" autocomplete="email">' +
      '<button class="btn btn-yellow" type="submit">구독 신청</button></form>' +
      '<p class="form-err on-navy" id="gov-sub-err" role="alert" hidden>메일 주소를 확인해 주세요.</p>' +
      '<p class="sub-done" id="gov-sub-done" role="status" hidden></p>' +
      '<p class="fine">월 1회만 발송합니다. 영업 목적의 개별 연락은 동의하신 경우에만 드립니다. 모든 메일 하단에 수신거부 링크가 있으며, 한 번 누르면 즉시 해지됩니다.</p></div></section>';
    render(html, "gov");
    track("gov_view", {});
  }

  var REPORT_FUNNEL = [["공고 노출", 2940], ["상세 조회", 806], ["자격 판정 실행", 241], ["적합 판정", 184], ["관심·알림 등록", 97], ["참여의향 응답", 74], ["원문 신청", 62]];
  var REPORT_BY_REGION = [["서울특별시", 61], ["경기도", 54], ["부산광역시", 14], ["인천광역시", 12], ["대전광역시", 10], ["강원특별자치도", 33], ["그 밖의 지역", 3]];
  var REPORT_BY_DURATION = [["1주", 22], ["2~4주", 118], ["1~3개월", 41], ["3개월 이상", 3]];
  /* 분포표: 5명 미만은 재식별 방지를 위해 숫자를 감춘다 */
  function distRows(rows, total) {
    return rows.map(function (r) {
      return '<tr><th style="width:9em">' + r[0] + "</th><td>" + (r[1] < 5 ? '<span class="muted">5명 미만</span>' : r[1] + "명 · " + Math.round(r[1] / total * 100) + "%") + "</td></tr>";
    }).join("");
  }
  function viewReport() {
    var max = REPORT_FUNNEL[0][1];
    var funnel = REPORT_FUNNEL.map(function (s, i) {
      var prev = i ? REPORT_FUNNEL[i - 1][1] : null;
      return '<div class="f"><span>' + s[0] + '</span><span class="fb"><i style="width:' + Math.max(2, s[1] / max * 100) + '%"></i></span><span class="n">' + s[1].toLocaleString() + "</span>" +
        (prev ? '<span class="rate">직전 단계 대비 ' + Math.round(s[1] / prev * 100) + "%</span>" : "") + "</div>";
    }).join("");
    var pdfBtn = function (cls) { return '<button type="button" class="btn ' + cls + ' noprint" data-action="print-report">보고서 내려받기 (PDF)</button>'; };
    var html =
      '<p class="sample-bar">샘플 리포트입니다. 아래 수치는 화면 구성을 보여드리기 위한 예시이며 실제 사업 결과가 아닙니다.</p>' +
      '<section class="report-head"><div class="wrap"><p class="small muted">비공개 링크 · 로그인 없이 열람 · 링크를 아는 분만 보실 수 있습니다</p>' +
      "<h1>강릉 워케이션 체류지원 2기 — 성과 리포트</h1>" +
      '<p class="small muted" style="margin-top:10px">발주기관 강릉시 · 모집 기간 2026.08.18 ~ 2026.09.08 · 리포트 발행일 2026.09.22 · 작성 (주)이음전략소</p>' +
      '<p style="margin-top:14px">' + pdfBtn("btn-primary btn-sm") + "</p></div></section>" +

      '<section class="gov-sec"><div class="wrap">' + govHead("한 줄 요약", "자격 요건을 통과한 적합 수요자 184명을 모았고, 그중 62명이 신청까지 진행했습니다") +
      '<div class="g3 on-cream">' + kpi("184", "적합 수요자 수", "공고 요건을 모두 충족한다고 판정된 방문자 수", true) +
      kpi("151", "타 지역 거주 신청자 수", "강원 외 지역 거주자 — 인구유입 효과 증빙 지표") + kpi("62", "원문 신청 전환 수", "공고 사이트 신청 페이지로 이동한 건수") +
      kpi("38", "마감 알림 등록 수", "다음 회차 모집에 바로 쓸 수 있는 대기 수요") + kpi("21일", "모집 노출 기간", "목록 상단 고정 노출 유지 기간") +
      kpi("2,940", "공고 노출 수", "참고 지표 — 성과 판단의 기준으로 쓰지 않습니다") + "</div></div></section>" +

      '<section class="gov-sec alt"><div class="wrap">' + govHead("전환 깔때기", "노출에서 신청까지 어디서 줄었는가") +
      '<div class="card"><div class="funnel">' + funnel + "</div>" +
      '<p class="small muted" style="margin-top:18px">상세 조회에서 자격 판정으로 넘어가는 구간의 이탈이 가장 큽니다. 다음 회차에서는 공고 카드에 대상 요건을 한 줄 더 노출해 판정 진입률을 높일 것을 제안드립니다.</p></div>' +
      '<p class="small muted" style="margin-top:14px">체류 확인(실제 방문·숙박 여부)은 지자체가 보유한 정산 자료와 대조해야 확정됩니다. 원하시면 다음 리포트에 합산해 드립니다.</p></div></section>' +

      '<section class="gov-sec"><div class="wrap">' + govHead("지원자 분포", "어떤 사람이 왔는가") + '<div class="g2">' +
      '<div class="card"><h3>거주 지역 (판정 통과자 184명 기준)</h3><div class="tbl-wrap" style="margin-top:12px"><table class="tbl"><tbody>' + distRows(REPORT_BY_REGION, 184) + "</tbody></table></div></div>" +
      '<div class="card"><h3>희망 체류 기간</h3><div class="tbl-wrap" style="margin-top:12px"><table class="tbl"><tbody>' + distRows(REPORT_BY_DURATION, 184) + "</tbody></table></div></div></div>" +
      '<p class="disclaimer"><strong>재식별 방지 원칙</strong> — 인원이 5명 미만인 항목은 숫자를 표시하지 않고 \'5명 미만\'으로 묶습니다. 개인을 식별할 수 있는 정보는 어떤 형태로도 제공하지 않습니다.</p></div></section>' +

      '<section class="gov-sec alt"><div class="wrap">' + govHead("다음 회차 설계에 쓰실 것", "대상이 아니라고 판정된 이유") +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>사유</th><th style="width:6em">인원</th><th>검토 제안</th></tr></thead><tbody>' +
      "<tr><td>희망 기간이 2~4주와 맞지 않음</td><td>73</td><td>1주 단위 회차를 병행하면 수요를 더 받습니다</td></tr>" +
      "<tr><td>강원 거주자</td><td>41</td><td>요건상 불가피 — 도내 대상 별도 사업 검토</td></tr>" +
      "<tr><td>재직·프리랜서 증빙 어려움</td><td>18</td><td>증빙 범위를 공고문에 예시로 명시하면 이탈이 줄어듭니다</td></tr>" +
      "<tr><td>기타</td><td>5명 미만</td><td>—</td></tr></tbody></table></div></div></section>" +

      '<section class="gov-sec"><div class="wrap">' + govHead("성과 보고용", "기금 성과평가에 그대로 쓰실 수 있는 문장") +
      '<div class="card"><p style="font-size:15.5px;line-height:1.8">「강릉 워케이션 체류지원 2기」 모집 결과, 자격 요건을 충족한 <strong>적합 수요자 184명</strong>을 확보하였으며, 이 가운데 <strong>타 지역(강원 외) 거주자는 151명</strong>으로 전체의 82.1%를 차지함. 최종 신청 전환은 62건이며, 차기 회차 모집을 위한 <strong>사전 수요자 38명</strong>이 알림 등록 상태로 확보됨.</p>' +
      '<p class="small muted" style="margin-top:14px">지표 명칭은 해당 사업의 성과평가 지침 용어에 맞춰 조정해 드립니다. 위 수치는 커먼빌리지 로그 기준이며, 최종 선정·체류 실적은 발주기관 정산 자료를 따릅니다.</p></div>' +
      '<div class="gov-actions noprint">' + pdfBtn("btn-primary") + '<a class="btn btn-line" href="#/for-gov">지자체 전용 안내로 돌아가기</a></div>' +
      '<p class="small muted" style="margin-top:20px">커먼빌리지 성과 리포트 · (주)이음전략소 · 이 링크는 검색에 노출되지 않습니다. 재배포 시 담당자께 알려 주세요.</p></div></section>';
    render(html, "gov");
    track("report_view", {});
  }

  /* ---------- 개인정보 ---------- */
  function viewPrivacy() {
    render('<div class="narrow"><article class="doc"><h1>개인정보 처리방침</h1><p class="demo-note">초안입니다. 법무 검토 후 확정하며, 확정 전까지 실제 개인정보를 수집하지 않습니다.</p>' +
      "<h2>1. 수집하는 항목과 목적</h2><table><tr><th>구분</th><th>항목</th><th>목적</th></tr>" +
      "<tr><td>로그인(카카오·구글)</td><td>계정 식별값, 이메일</td><td>회원 식별, 진단 결과 저장</td></tr>" +
      "<tr><td>진단</td><td>머무는 방식, 기간, 동행, 이동 수단, 우선순위, 연령대, 거주 시·도</td><td>공고 판정과 지역 추천</td></tr>" +
      "<tr><td>알림</td><td>알림 수단(카카오톡·이메일), 알림 종류, 관심 공고</td><td>마감 임박·재모집·신규 공고 알림</td></tr></table>" +
      "<p>로그인하지 않으면 진단 응답은 이용자 기기에만 저장되며 운영자에게 전송되지 않습니다.</p>" +
      "<h2>2. 보유 기간</h2><p>[회원 탈퇴 시 즉시 삭제 / 관련 법령에 따른 보존 항목 — 확정 필요]</p>" +
      "<h2>3. 처리 위탁과 국외 이전</h2><p>[인증·저장 서비스, 이메일 발송 서비스, 카카오 메시지 발송 대행사 — 업체 확정 후 기재. 해외 서버 사용 시 국외 이전 항목 기재]</p>" +
      "<h2>4. 제3자 제공</h2><p>이용자 동의 없이 제공하지 않습니다. 지자체 모집 접수 기능을 열 경우, 접수한 기관에만 제공하며 별도 동의를 받습니다.</p>" +
      "<h2>5. 이용자의 권리</h2><p>내 결과·알림 화면에서 알림을 끄거나 회원 탈퇴할 수 있으며, 열람·정정·삭제를 요청할 수 있습니다.</p>" +
      "<h2>6. 개인정보 보호책임자</h2><p>[성명·연락처 — 확정 필요]</p><p class=\"small muted\">시행일: [확정 필요]</p></article></div>", "privacy");
  }

  /* ---------- 로그인 시트 ---------- */
  var pendingAfterLogin = null;
  function openLogin(reason, after) {
    pendingAfterLogin = after || null;
    track("login_sheet_open", { reason: reason });
    var demo = CFG.authMode === "demo" ? '<p class="demo-note">미리보기 모드: 버튼을 누르면 이 기기에만 임시 로그인돼요. 실제 계정은 연결되지 않아요.</p>' : "";
    var wrap = document.createElement("div");
    wrap.className = "sheet-backdrop"; wrap.setAttribute("data-action", "close-login-bg");
    wrap.innerHTML = '<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="login-h"><div class="handle"></div><button type="button" class="close" data-action="close-login" aria-label="닫기">' + ICON_X + "</button>" +
      '<h2 id="login-h">결과를 저장하고<br>알림을 받아보세요</h2>' +
      '<ul class="benefits"><li>' + ICON_CHECK + "2·3순위 지역과 생활 정보 비교</li><li>" + ICON_CHECK + "진단 결과 저장, 다시 보기</li><li>" + ICON_CHECK + "마감 임박·재모집 알림 (카카오톡 또는 이메일)</li></ul>" + demo +
      '<div class="btns"><button type="button" class="btn btn-kakao" data-action="login" data-provider="kakao">' + ICON_KAKAO + '카카오 로그인</button><button type="button" class="btn btn-google" data-action="login" data-provider="google">' + ICON_GOOGLE + "Google 계정으로 로그인</button></div>" +
      '<p class="fine">로그인 시 계정 식별값·이메일과 진단 응답을 결과 저장과 알림에 사용합니다. 알림 수단은 로그인 후 직접 고를 수 있어요. <a href="#/privacy" data-action="close-login">개인정보 처리방침</a></p>' +
      '<p style="text-align:center;margin-top:8px"><button type="button" data-action="close-login" style="border:0;background:none;padding:10px 12px;color:var(--sub);font-size:14px">나중에 할게요</button></p></section>';
    document.body.appendChild(wrap);
    var first = wrap.querySelector("[data-provider=kakao]"); if (first) first.focus();
  }
  function closeLogin() { var s = document.querySelector(".sheet-backdrop"); if (s) s.remove(); }

  /* ---------- 이벤트 ---------- */
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); return arr; }
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el) return;
    var a = el.getAttribute("data-action"), v = el.getAttribute("data-value");
    if (a === "close-login-bg") { if (e.target === el) closeLogin(); return; }
    if (a !== "apply" && el.tagName === "A" && a !== "restart" && a !== "close-login") e.preventDefault();
    var d = getDiag();
    switch (a) {
      case "home-purpose":
        setDiag({ purpose: v }); track("diagnosis_start", { purpose: v }); go("#/diagnose/2"); break;
      case "pick":
        d[el.getAttribute("data-key")] = v;
        if (el.getAttribute("data-key") === "purpose") d.priorities = [];
        setDiag(d);
        var step = QUESTIONS.findIndex(function (q) { return q.key === el.getAttribute("data-key"); }) + 1;
        go("#/diagnose/" + (step + 1)); break;
      case "pick-multi":
        var pr = d.priorities || [];
        if (pr.indexOf(v) >= 0) pr.splice(pr.indexOf(v), 1); else if (pr.length < 2) pr.push(v);
        d.priorities = pr; setDiag(d); refresh(route); break;
      case "step-next":
        var n = +el.getAttribute("data-step");
        if (n >= QUESTIONS.length) { track("diagnosis_complete", { purpose: d.purpose }); resultProvinces = []; go("#/result"); }
        else go("#/diagnose/" + (n + 1));
        break;
      case "step-back":
        var b = +el.getAttribute("data-step"); go(b <= 1 ? "#/" : "#/diagnose/" + (b - 1)); break;
      case "restart":
        setDiag({}); break;
      case "chip":
        var g = el.getAttribute("data-group");
        if (g === "age" || g === "residence") { d[g] = v; setDiag(d); refresh(route); break; }
        if (g === "rprov") { if (!v) resultProvinces = []; else toggleIn(resultProvinces, v); refresh(viewResult); break; }
        if (g === "lprov") { if (!v) listState.province = []; else toggleIn(listState.province, v); listState.showUnknown = false; refresh(function () { viewList({}); }); break; }
        if (g === "ldur") { toggleIn(listState.duration, v); refresh(function () { viewList({}); }); break; }
        if (g === "lcond") { toggleIn(listState.cond, v); listState.showUnknown = false; refresh(function () { viewList({}); }); break; }
        if (g === "duration" || g === "cond") toggleIn(homeChips[g], v);
        if (g === "province") { if (!v) homeChips.province = []; else toggleIn(homeChips.province, v); }
        Array.prototype.forEach.call(document.querySelectorAll('[data-action="chip"][data-group="' + g + '"]'), function (c) {
          var cv = c.getAttribute("data-value");
          var on = g === "province" ? (cv ? homeChips.province.indexOf(cv) >= 0 : !homeChips.province.length) : homeChips[g].indexOf(cv) >= 0;
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        break;
      case "home-search":
        listState.tab = homeChips.cond.indexOf("open") >= 0 ? "open" : "closed";
        listState.showUnknown = false;
        track("chip_search", { province: homeChips.province.join(","), duration: homeChips.duration.join(","), cond: homeChips.cond.join(",") });
        go("#/programs?province=" + encodeURIComponent(homeChips.province.join(",")) + "&duration=" + encodeURIComponent(homeChips.duration.join(",")) + "&cond=" + encodeURIComponent(homeChips.cond.filter(function (c) { return c !== "open"; }).join(",")) + "&tab=" + listState.tab);
        break;
      case "tab": listState.tab = v; listState.showUnknown = false; refresh(function () { viewList({}); }); break;
      case "show-unknown": listState.showUnknown = true; refresh(function () { viewList({}); }); break;
      case "province": go("#/regions/" + encodeURIComponent(v)); break;
      case "open-login": openLogin(el.getAttribute("data-reason")); break;
      case "close-login": closeLogin(); break;
      case "login":
        login(el.getAttribute("data-provider")); closeLogin(); toast("로그인했어요.");
        if (pendingAfterLogin) { var f2 = pendingAfterLogin; pendingAfterLogin = null; f2(); } else refresh(route);
        break;
      case "fav":
        var id = el.getAttribute("data-id");
        var doFav = function () { var f = store.get("favs", []); toggleIn(f, id); store.set("favs", f); toast(f.indexOf(id) >= 0 ? "관심 공고에 저장했어요." : "관심 공고에서 뺐어요."); refresh(route); };
        if (!getUser()) openLogin("favorite", doFav); else doFav();
        break;
      case "watch":
      case "watch-region":
        var key = a === "watch" ? el.getAttribute("data-id") : "region:" + el.getAttribute("data-id");
        var doWatch = function () { var w = store.get("watch", []); toggleIn(w, key); store.set("watch", w); toast(w.indexOf(key) >= 0 ? "다시 열리면 알려드릴게요." : "재모집 알림을 껐어요."); refresh(route); };
        if (!getUser()) openLogin("reopen", doWatch); else doWatch();
        break;
      case "apply":
        track("apply_click", { id: el.getAttribute("data-id") }); break;
      case "channel":
        var u = getUser(); u.channels[v] = !u.channels[v];
        if (!u.channels.kakao && !u.channels.email) { u.channels[v] = true; toast("알림 받을 곳을 하나 이상 골라주세요."); }
        store.set("user", u); refresh(viewMy); break;
      case "alert":
        var u2 = getUser(); u2.alerts[v] = !u2.alerts[v]; store.set("user", u2); refresh(viewMy); break;
      case "logout": logout(); break;
      case "scroll-to":
        var target = document.getElementById(el.getAttribute("data-target"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      case "print-report":
        track("report_download", {}); window.print(); break;
      case "withdraw":
        if (el.getAttribute("data-confirm") !== "1") {
          el.setAttribute("data-confirm", "1"); el.textContent = "한 번 더 누르면 탈퇴돼요 (저장된 결과·알림 설정 삭제)"; el.style.color = "var(--urgent)";
          break;
        }
        ["user", "savedResult", "favs", "watch"].forEach(store.del); toast("탈퇴 처리했어요."); go("#/");
        break;
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLogin(); });

  /* 지자체 전용 화면의 문의·구독 양식. 발송 연결 전에는 전송되지 않았음을 그대로 알린다. */
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (f.id !== "gov-contact-form" && f.id !== "gov-sub-form") return;
    e.preventDefault();
    var email = f.elements.email.value.trim();
    if (f.id === "gov-sub-form") {
      var subErr = document.getElementById("gov-sub-err");
      if (!MAIL_OK.test(email)) { subErr.hidden = false; return; }
      subErr.hidden = true;
      track("subscribe_report", { mode: "demo" });
      var subDone = document.getElementById("gov-sub-done");
      subDone.textContent = "미리보기 화면이라 구독 신청이 저장되지 않았습니다. 이메일 발송 서비스를 연결한 뒤에 열립니다.";
      f.hidden = true; subDone.hidden = false;
      return;
    }
    var org = f.elements.org.value.trim(), err = document.getElementById("gov-contact-err");
    if (!org || !MAIL_OK.test(email)) { err.textContent = "기관명과 메일 주소를 확인해 주세요."; err.hidden = false; return; }
    if (!f.elements.agree.checked) { err.textContent = "문의 회신을 위한 정보 이용에 동의해 주세요."; err.hidden = false; return; }
    var done = document.getElementById("gov-contact-done");
    if (CFG.contactEmail) {
      var body = "기관명: " + org + "\n담당자: " + f.elements.name.value.trim() + "\n회신 메일: " + email + "\n\n" + f.elements.msg.value.trim();
      location.href = "mailto:" + CFG.contactEmail + "?subject=" + encodeURIComponent("[도입 문의] " + org) + "&body=" + encodeURIComponent(body);
      done.innerHTML = "<h3>메일 프로그램에서 보내기를 눌러 주세요</h3><p class=\"small muted\" style=\"margin-top:8px\">작성하신 내용을 메일로 옮겼습니다. 메일 프로그램이 열리지 않으면 " + esc(CFG.contactEmail) + " 로 보내 주세요.</p>";
      track("b2g_contact", { mode: "mailto" });
    } else {
      done.innerHTML = "<h3>미리보기 화면이라 문의가 전송되지 않았습니다</h3><p class=\"small muted\" style=\"margin-top:8px\">운영 문의 메일이 확정되면 이 양식이 연결됩니다. 입력하신 내용은 어디에도 저장되지 않았습니다.</p>";
      track("b2g_contact", { mode: "demo" });
    }
    f.hidden = true; done.hidden = false;
  });

  /* ---------- 라우터 ---------- */
  function route() {
    closeLogin();
    var h = location.hash.replace(/^#/, "") || "/";
    var qi = h.indexOf("?"), path = qi >= 0 ? h.slice(0, qi) : h, params = {};
    if (qi >= 0) h.slice(qi + 1).split("&").forEach(function (kv) { var p = kv.split("="); if (p[0]) params[p[0]] = decodeURIComponent(p[1] || ""); });
    var seg = path.split("/").filter(Boolean);
    if (!seg.length) return viewHome();
    if (seg[0] === "diagnose") return viewStep(Math.min(Math.max(+seg[1] || 1, 1), 6));
    if (seg[0] === "result") return viewResult();
    if (seg[0] === "programs") return viewList(params);
    if (seg[0] === "program") return viewProgram(decodeURIComponent(seg[1] || ""));
    if (seg[0] === "regions") return viewRegions(decodeURIComponent(seg[1] || ""));
    if (seg[0] === "my") return viewMy();
    if (seg[0] === "for-gov") return viewForGov();
    if (seg[0] === "report") return viewReport();
    if (seg[0] === "privacy") return viewPrivacy();
    viewHome();
  }
  window.addEventListener("hashchange", route);
  route();
})();
