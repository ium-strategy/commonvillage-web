/* 커먼빌리지 공통 스크립트
 * - 회원 시스템 없음. 익명 ID(쿠키) 하나로 StayProfile → MatchResult → Interest 를 잇는다. (§7)
 * - 이메일은 알림 등록 목적으로만 받는다. 회원가입·비밀번호는 없다.
 * - 이벤트 택소노미: diagnosis_*, program_view, eligibility_check, interest_submit,
 *   outbound_apply_click, subscribe_report (§9)
 *   + 리텐션 훅 v1.0: alert_opt_in(type: matched|reopen), alert_click_through
 *     (alert_email_sent 는 발송 서버 쪽 이벤트라 여기서 남기지 않는다)
 */
(function (global) {
  'use strict';

  var KEY = {
    uid: 'cv_uid', profile: 'cv_profile', match: 'cv_match',
    interest: 'cv_interest', alert: 'cv_alert', log: 'cv_log'
  };

  /* ── 저장소 ── */
  function read(k, fallback) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 무시 */ }
  }

  /* 익명 ID — 쿠키 만료를 길게(2년). 이메일 입력 시 서버에서 병합하는 것을 전제로 한다. */
  function uid() {
    var m = document.cookie.match(/(?:^|;\s*)cv_uid=([^;]+)/);
    var id = m ? decodeURIComponent(m[1]) : read(KEY.uid, null);
    if (!id) {
      id = 'a-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }
    document.cookie = 'cv_uid=' + encodeURIComponent(id) + ';path=/;max-age=' + (60 * 60 * 24 * 730) + ';SameSite=Lax';
    write(KEY.uid, id);
    return id;
  }

  /* ── 이벤트 로그 (EventLog) ── */
  function log(name, props) {
    var rows = read(KEY.log, []);
    rows.push({ id: uid(), event: name, props: props || {}, at: new Date().toISOString() });
    if (rows.length > 400) rows = rows.slice(-400);
    write(KEY.log, rows);
  }

  /* ── 날짜 ── */
  function today() { return new Date(); }
  function parse(d) { var p = String(d).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dday(closeDate) {
    var t = today(); t.setHours(0, 0, 0, 0);
    return Math.round((parse(closeDate) - t) / 86400000);
  }
  function fmtDate(d) {
    if (!d) return '—';
    var p = String(d).split('-');
    return p[0] + '.' + p[1] + '.' + p[2];
  }
  function daysSince(d) {
    var t = today(); t.setHours(0, 0, 0, 0);
    return Math.round((t - parse(d)) / 86400000);
  }
  function isOpen(p) { return dday(p.closeDate) >= 0; }

  /* ── 문자열 ── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function qs(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  /* ── 프로필 (StayProfile) ── */
  function getProfile() { return read(KEY.profile, null); }
  function setProfile(p) {
    p.id = uid(); p.updatedAt = new Date().toISOString();
    write(KEY.profile, p); return p;
  }
  function clearProfile() {
    try { localStorage.removeItem(KEY.profile); localStorage.removeItem(KEY.match); } catch (e) {}
  }

  /* ── 관심 표시 (Interest) ── */
  function interests() { return read(KEY.interest, []); }
  function addInterest(programId, extra) {
    var rows = interests();
    if (!rows.some(function (r) { return r.programId === programId; })) {
      rows.push(Object.assign({ id: uid(), programId: programId, at: new Date().toISOString() }, extra || {}));
      write(KEY.interest, rows);
    }
    return rows;
  }
  function hasInterest(id) { return interests().some(function (r) { return r.programId === id; }); }

  /* ── 마감 알림 ── */
  function alerts() { return read(KEY.alert, []); }
  function addAlert(row) {
    var rows = alerts();
    rows.push(Object.assign({ id: uid(), at: new Date().toISOString() }, row));
    write(KEY.alert, rows); return rows;
  }

  /* ── 조회 ── */
  function region(id) { return REGIONS.filter(function (r) { return r.id === id; })[0]; }
  function program(id) { return PROGRAMS.filter(function (p) { return p.id === id; })[0]; }
  function openPrograms() { return PROGRAMS.filter(isOpen); }
  function closedPrograms() { return PROGRAMS.filter(function (p) { return !isOpen(p); }); }

  /* ── 배지 ── */
  var STATE = {
    ok:    { cls: 'ok',    ic: '✓', text: '신청 가능' },
    check: { cls: 'check', ic: '!', text: '확인 필요' },
    no:    { cls: 'no',    ic: '—', text: '대상 아님' }
  };
  function stateBadge(state, textOverride) {
    var s = STATE[state] || STATE.check;
    return '<span class="badge ' + s.cls + '"><span class="ic" aria-hidden="true">' + s.ic + '</span>' +
      esc(textOverride || s.text) + '</span>';
  }
  function ddayBadge(p) {
    if (!isOpen(p)) return '<span class="badge closed">모집 종료</span>';
    var d = dday(p.closeDate);
    var txt = d === 0 ? '오늘 마감' : 'D-' + d;
    return '<span class="badge dday' + (d <= 7 ? ' soon' : '') + '">' + txt + '</span>';
  }

  /* ── 공고 카드 (§5.6 규격) ────────────────────────────────
   * [상태 배지 D-n] 사업명 / 혜택 요약 한 줄 / 지역·대상 요건 / 발주기관·확인일 / "내 조건으로 확인 →"
   */
  function programCard(p, opts) {
    opts = opts || {};
    var r = region(p.regionId);
    var profile = opts.profile || getProfile();
    var verdict = profile ? CV.judge(p, profile) : null;
    var stale = daysSince(p.checkedAt) > 14;

    var card;
    var badges = [ddayBadge(p)];
    if (p.partner) badges.push('<span class="badge partner">지자체 협력</span>');
    if (verdict) badges.push(stateBadge(verdict.state));

    card = '<a class="pcard' + (p.partner ? ' partnered' : '') + (isOpen(p) ? '' : ' closed') +
      '" href="program.html?id=' + encodeURIComponent(p.id) + '">' +
      '<div class="row1">' + badges.join('') + '</div>' +
      '<h3>' + esc(p.title) + '</h3>' +
      '<p class="benefit">' + esc(p.benefit) + '</p>' +
      '<p class="meta">' + esc(r ? r.sido + ' ' + r.name : '') + ' · ' + esc(p.targetSummary) + '</p>' +
      '<p class="meta">' + esc(p.org) + ' · 확인일 ' + fmtDate(p.checkedAt) +
        (stale ? ' <span class="badge check"><span class="ic" aria-hidden="true">!</span>확인일 경과</span>' : '') + '</p>' +
      '<p class="cta">' + (isOpen(p) ? '내 조건으로 확인 →' : '지난 공고 내용 보기 →') + '</p>' +
      '</a>';

    /* 종료 공고에는 카드 아래에 '다시 열리면 알림 받기' 버튼을 붙인다 (리텐션 훅 §3.2).
       버튼은 <a> 바깥에 두어야 카드 링크와 충돌하지 않는다. */
    if (isOpen(p) || opts.reopen === false) return card;
    return '<div class="pcard-wrap">' + card +
      '<div class="pcard-actions">' +
        '<button type="button" class="btn ghost sm" data-reopen="' + esc(p.id) + '">다시 열리면 알림 받기</button>' +
        '<span class="tiny muted">' + esc(p.org) + '는 해마다 다시 공고하는 편입니다</span>' +
      '</div>' +
      '<div class="reopen-slot"></div>' +
    '</div>';
  }

  /* ── 지표 막대 ── */
  function metricBar(def, mm) {
    var has = mm && typeof mm.score === 'number';
    return '<div class="metric">' +
      '<span>' + esc(def.label) + '</span>' +
      '<span class="bar">' + (has ? '<i style="width:' + mm.score + '%"></i>' : '<i class="na"></i>') + '</span>' +
      '<span class="val">' + (has ? mm.score : '없음') + '</span>' +
      '</div>';
  }

  /* ── 재방문 장치: 구독 블록 ────────────────────────────────────
   * 저빈도 제품에서 한 번 들어온 방문자를 다시 만날 수 있는 유일한 통로.
   * 화면마다 <div data-subscribe></div> 한 줄만 두면 여기서 그리고 묶습니다.
   *
   * 옵션(모두 선택):
   *   data-subscribe="mid|foot"   배치에 따라 카피를 바꿉니다
   *   data-region="<regionId>"    그 지역 공고로 한정해 등록
   *   data-program="<programId>"  그 공고의 마감 알림까지 함께 등록
   *   data-title / data-lead      카피 직접 지정
   *
   * 이미 구독한 방문자에게는 폼 대신 확인 상태를 보여 줍니다. 같은 요청을
   * 반복해 조르지 않는 편이 해지율(가드레일) 관리에도 낫습니다.
   */
  var SUB_COPY = {
    mid: {
      title: '새 공고, 놓치지 말고 받아보세요',
      lead: '전체 공지가 아니라, 당신이 신청할 수 있는 공고만 보냅니다.'
    },
    foot: {
      title: '지금 맞는 공고가 없어도 괜찮아요',
      lead: '다음 모집 시즌은 보통 1~3월·7~9월이에요. 조건을 남겨두시면 가장 먼저 알려드릴게요.'
    },
    reopen: {
      title: '다시 열리면 알려드릴까요?',
      lead: '이 사업이 다시 공고되면 바로 메일로 알려드려요. 체류지원사업은 해마다 다시 열리는 경우가 많습니다.'
    }
  };

  var CONSENT_COPY = '신청 가능 공고 알림 메일 수신에 동의합니다. 언제든 한 번의 클릭으로 해지할 수 있어요.';

  /* 진단 조건 한 줄 요약 — 무엇을 기준으로 골라 보내는지 눈에 보이게 한다 */
  function profileSummary() {
    var p = getProfile();
    if (!p) return null;
    return [LABELS.purpose[p.purpose], LABELS.duration[p.duration], p.residenceSido + ' 거주']
      .filter(Boolean).join(' · ');
  }

  function subscribeHTML(o) {
    var copy = SUB_COPY[o.variant] || SUB_COPY.mid;
    var title = o.title || copy.title;
    var lead = o.lead || copy.lead;
    var already = alerts().length > 0;
    var isReopen = o.variant === 'reopen';
    var summary = profileSummary();

    var right;
    if (already) {
      right = '<div class="state"><span aria-hidden="true" style="color:var(--green);font-weight:700">✓</span>' +
        '<span>이미 맞춤 공고 알림을 받고 계세요. 새 공고가 열리면 바로 보내드립니다.' +
        ' <a href="alert.html">받는 조건 바꾸기</a></span></div>';
    } else {
      right =
        '<button type="button" class="btn kakao" data-kakao>' +
          '<span aria-hidden="true">💬</span> 카카오톡 채널로 받기</button>' +
        '<form class="inline-form" novalidate>' +
          '<input type="email" placeholder="이메일로 받기 — 주소 입력" aria-label="알림 받을 이메일 주소" autocomplete="email">' +
          '<button class="btn" type="submit">알림 받기</button>' +
        '</form>' +
        '<label class="checkline" style="margin-top:12px">' +
          '<input type="checkbox" data-consent>' +
          '<span>' + esc(CONSENT_COPY) + '</span>' +
        '</label>' +
        '<p class="err" data-err hidden></p>' +
        '<p class="fine">' +
          (isReopen
            ? '재공고가 등재되는 시점에만 보냅니다. 그 밖의 메일은 보내지 않아요.'
            : '시즌에는 조건에 맞는 공고를 주 1회 묶어서, 마감 3일 전에는 따로 보냅니다. 공고가 없는 기간에는 메일이 가지 않아요.') +
        '</p>';
    }

    var context = '';
    if (!already && !isReopen) {
      context = summary
        ? '<p class="tiny" style="margin-top:12px;color:var(--teal-dark)">' +
            '내 조건 <strong>' + esc(summary) + '</strong> 에 맞는 공고만 골라 보내드립니다.</p>'
        : '<p class="tiny muted" style="margin-top:12px">' +
            '<a href="purpose.html">1분 진단</a>을 해두시면 조건에 맞는 공고만 골라 보내드려요.</p>';
    }

    return '<div class="subcta' + (already ? ' done' : '') + '"><div class="subcta-grid">' +
      '<div>' +
        '<p class="eyebrow" style="color:var(--teal-dark);font-weight:700;font-size:.78rem">맞춤 공고 알림</p>' +
        '<h3 style="margin-top:6px">' + esc(title) + '</h3>' +
        '<p class="lead">' + esc(lead) + '</p>' + context +
      '</div>' +
      '<div>' + right + '</div>' +
    '</div></div>';
  }

  function bindSubscribe(box, o) {
    var isReopen = o.variant === 'reopen';
    var optInType = isReopen ? 'reopen' : 'matched';

    var kakao = box.querySelector('[data-kakao]');
    if (kakao) {
      kakao.addEventListener('click', function () {
        log('subscribe_kakao_click', { placement: o.variant, regionId: o.regionId || null });
        if (SITE.kakaoChannelUrl) { window.open(SITE.kakaoChannelUrl, '_blank', 'noopener'); return; }
        kakao.outerHTML = '<div class="note amber">카카오톡 채널은 준비 중입니다. ' +
          '지금은 아래에 메일 주소를 남겨 주시면 같은 내용을 보내드릴게요.</div>';
      });
    }

    var form = box.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var consent = box.querySelector('[data-consent]');
      var errEl = box.querySelector('[data-err]');
      var email = input.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errEl.textContent = '메일 주소를 확인해 주세요.'; errEl.hidden = false; input.focus(); return;
      }
      if (!consent.checked) {
        errEl.textContent = '수신 동의를 체크해 주셔야 메일을 보낼 수 있어요.'; errEl.hidden = false; consent.focus(); return;
      }
      errEl.hidden = true;

      /* StayProfile(익명 ID) + email 을 잇는 지점. 신규 테이블 없이 기존 스키마 그대로. */
      var profile = getProfile();
      addAlert({
        email: email, type: optInType,
        regionId: o.regionId || null, programId: o.programId || null,
        profile: profile || null, consent: true, via: o.variant
      });
      log('alert_opt_in', {
        type: optInType, placement: o.variant,
        regionId: o.regionId || 'all', programId: o.programId || null,
        hasProfile: !!profile
      });

      var pr = o.programId ? program(o.programId) : null;
      var where = o.regionId && region(o.regionId) ? region(o.regionId).name + ' ' : '';
      box.querySelector('.subcta').classList.add('done');
      form.parentNode.innerHTML =
        '<div class="state"><span aria-hidden="true" style="color:var(--green);font-weight:700">✓</span>' +
        '<span><strong>' + esc(email) + '</strong> 로 보내드릴게요. ' +
        (isReopen && pr
          ? esc(pr.title) + ' 모집이 다시 시작되면 가장 먼저 알려드립니다.'
          : esc(where) + (profile ? '조건에 맞는 새 공고가 열리면' : '새 공고가 열리면') + ' 가장 먼저 알려드립니다.') +
        '</span></div>';
    });
  }

  function mountSubscribes() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-subscribe]'), function (el) {
      if (el.querySelector('.subcta')) return;   /* 동적 렌더 화면에서 중복 마운트 방지 */
      var o = {
        variant: el.getAttribute('data-subscribe') || 'mid',
        regionId: el.getAttribute('data-region') || null,
        programId: el.getAttribute('data-program') || null,
        title: el.getAttribute('data-title') || null,
        lead: el.getAttribute('data-lead') || null
      };
      el.innerHTML = subscribeHTML(o);
      bindSubscribe(el, o);
      log('subscribe_block_view', { placement: o.variant });
    });
  }

  /* '다시 열리면 알림 받기' — 페이지 이동 없이 그 자리에서 이메일 한 줄을 받는다 */
  function bindReopenButtons() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-reopen]') : null;
      if (!btn) return;
      var pid = btn.getAttribute('data-reopen');
      var pr = program(pid);
      if (!pr) return;
      var wrap = btn.closest('.pcard-wrap');
      var slot = wrap.querySelector('.reopen-slot');
      btn.closest('.pcard-actions').hidden = true;
      slot.innerHTML = '<div data-subscribe="reopen" data-program="' + esc(pid) +
        '" data-region="' + esc(pr.regionId) + '"></div>';
      mountSubscribes();
      var input = slot.querySelector('input[type=email]');
      if (input) input.focus();
    });
  }

  /* ── 전역 내비 현재 위치 표시 ── */
  function markNav() {
    var here = location.pathname.split('/').pop() || 'index.html';
    Array.prototype.forEach.call(document.querySelectorAll('.gnb nav a'), function (a) {
      var target = a.getAttribute('data-match') || a.getAttribute('href');
      if (target && target.split(',').indexOf(here) > -1) a.setAttribute('aria-current', 'page');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    uid(); markNav(); mountSubscribes(); bindReopenButtons();
    /* 알림 메일을 타고 들어온 재방문을 귀속시킨다 (링크에 ?src=alert 를 달아 발송) */
    if (qs('src') === 'alert') {
      log('alert_click_through', { to: location.pathname, campaign: qs('c') || null });
    }
    var el = document.getElementById('year'); if (el) el.textContent = new Date().getFullYear();
  });

  var CV = {
    KEY: KEY, uid: uid, log: log, esc: esc, qs: qs,
    today: today, dday: dday, fmtDate: fmtDate, daysSince: daysSince, isOpen: isOpen,
    getProfile: getProfile, setProfile: setProfile, clearProfile: clearProfile,
    interests: interests, addInterest: addInterest, hasInterest: hasInterest,
    alerts: alerts, addAlert: addAlert,
    region: region, program: program, openPrograms: openPrograms, closedPrograms: closedPrograms,
    stateBadge: stateBadge, ddayBadge: ddayBadge, programCard: programCard, metricBar: metricBar,
    mountSubscribes: mountSubscribes,
    read: read, write: write
  };
  global.CV = CV;
})(window);
