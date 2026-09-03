/* 규칙 기반 판정·매칭 (§5.4 확정: 지역 적합도 60 + 사업 매칭도 40)
 *
 * 원칙
 *  - 판정 3상태: 신청 가능 / 확인 필요 / 대상 아님. 애매하면 '가능'이 아니라 '확인 필요'로 내린다.
 *  - 근거 없는 조건은 만들지 않는다. 데이터가 없으면 점수에서 빼고 "데이터 없음"이라고 쓴다.
 *  - 최종 자격 확정은 하지 않는다. 화면에는 항상 원문 링크와 확인일을 함께 둔다. (§8.5)
 */
(function (CV) {
  'use strict';

  var AGE_BAND = { '20s': [20, 29], '30s': [30, 39], '40s': [40, 49], '50s': [50, 59], '60s+': [60, 99] };

  /* ── 규칙 1건 평가 → pass | unknown | fail ── */
  function evalRule(rule, p) {
    switch (rule.type) {
      case 'residence': {
        if (!p.residenceSido) return { r: 'unknown', text: '거주 시·도를 입력하면 확인할 수 있습니다 — ' + rule.label };
        var inList = rule.sido.indexOf(p.residenceSido) > -1;
        var ok = rule.mode === 'exclude' ? !inList : inList;
        return ok
          ? { r: 'pass', text: rule.label + ' — ' + p.residenceSido + ' 거주로 요건을 충족합니다' }
          : { r: 'fail', text: rule.label + ' — ' + p.residenceSido + ' 거주는 신청 대상이 아닙니다' };
      }
      case 'age': {
        var band = AGE_BAND[p.ageBand];
        if (!band) return { r: 'unknown', text: '연령대를 입력하면 확인할 수 있습니다 — ' + rule.label };
        var min = rule.min == null ? 0 : rule.min, max = rule.max == null ? 999 : rule.max;
        if (band[0] >= min && band[1] <= max) return { r: 'pass', text: rule.label + ' — 입력하신 연령대가 범위 안입니다' };
        if (band[1] < min || band[0] > max) return { r: 'fail', text: rule.label + ' — 입력하신 연령대는 범위를 벗어납니다' };
        return { r: 'unknown', text: rule.label + ' — 연령대가 경계에 걸칩니다. 생년월일 기준으로 원문을 확인하세요' };
      }
      case 'duration': {
        if (!p.duration) return { r: 'unknown', text: '희망 기간을 입력하면 확인할 수 있습니다 — ' + rule.label };
        return rule.allow.indexOf(p.duration) > -1
          ? { r: 'pass', text: rule.label + ' — 희망하신 기간과 맞습니다' }
          : { r: 'fail', text: rule.label + ' — 희망하신 기간(' + (LABELS.duration[p.duration] || p.duration) + ')과 맞지 않습니다' };
      }
      case 'vehicle': {
        if (!p.mobility) return { r: 'unknown', text: '차량 여부를 입력하면 확인할 수 있습니다 — ' + rule.label };
        if (!rule.required) return { r: 'pass', text: rule.label };
        return p.mobility === 'car'
          ? { r: 'pass', text: rule.label + ' — 자가용 이용이 가능하다고 하셨습니다' }
          : { r: 'fail', text: rule.label + ' — 원문에 자가용 이용이 요건으로 적혀 있습니다' };
      }
      case 'companion': {
        if (!p.companion) return { r: 'unknown', text: '동행 여부를 입력하면 확인할 수 있습니다 — ' + rule.label };
        return rule.allow.indexOf(p.companion) > -1
          ? { r: 'pass', text: rule.label + ' — 동행 조건과 맞습니다' }
          : { r: 'fail', text: rule.label + ' — ' + (LABELS.companion[p.companion] || '선택하신 동행 조건') + ' 신청은 대상이 아닙니다' };
      }
      case 'doc':
      default:
        return { r: 'unknown', text: rule.label + ' — 서류로 확인해야 하는 조건입니다. 원문을 보고 준비하세요' };
    }
  }

  /* ── 공고 1건 판정 ── */
  CV.judge = function (program, profile) {
    if (!profile) return { state: 'check', reasons: [], noProfile: true };
    var reasons = (program.rules || []).map(function (rule) {
      var res = evalRule(rule, profile);
      return { state: res.r === 'pass' ? 'ok' : (res.r === 'fail' ? 'no' : 'check'), text: res.text };
    });
    var hasFail = reasons.some(function (x) { return x.state === 'no'; });
    var hasUnknown = reasons.some(function (x) { return x.state === 'check'; });
    var state = hasFail ? 'no' : (hasUnknown ? 'check' : 'ok');
    CV.log('eligibility_check', { programId: program.id, state: state });
    return { state: state, reasons: reasons };
  };

  /* 프로필 없이도 쓰는 카운트: 지역별 '신청 가능' 공고 수 */
  CV.countByState = function (regionId, profile) {
    var out = { ok: 0, check: 0, no: 0, total: 0 };
    CV.openPrograms().forEach(function (p) {
      if (p.regionId !== regionId) return;
      out.total++;
      if (!profile) { out.check++; return; }
      out[CV.judge(p, profile).state]++;
    });
    return out;
  };

  /* ── 목적별 지표 가중치 ── */
  var WEIGHTS = {
    work:   { work: .28, life: .18, transit: .15, medical: .10, nature: .17, cost: .12 },
    rest:   { nature: .30, cost: .20, life: .16, medical: .14, transit: .10, work: .10 },
    settle: { medical: .24, life: .24, cost: .20, transit: .16, work: .06, nature: .10 }
  };
  /* 우선조건 → 지표 매핑. 대응 지표가 없는 항목은 점수에 넣지 않고 사유에만 적는다. */
  var PRIORITY_METRIC = {
    quiet: 'nature', cost: 'cost', work: 'work', medical: 'medical',
    transit: 'transit', nature: 'nature', community: null, school: null
  };

  /* ── 지역 1곳 점수 ── */
  CV.scoreRegion = function (region, profile) {
    var w = Object.assign({}, WEIGHTS[profile.purpose] || WEIGHTS.rest);

    (profile.priorities || []).forEach(function (key) {
      var mk = PRIORITY_METRIC[key];
      if (mk && w[mk] != null) w[mk] += .12;
    });

    var sum = 0, wsum = 0, missing = [], parts = [];
    Object.keys(w).forEach(function (k) {
      var mm = region.metrics[k];
      var def = METRIC_DEFS.filter(function (d) { return d.key === k; })[0];
      if (!mm || typeof mm.score !== 'number') { missing.push(def ? def.label : k); return; }
      sum += mm.score * w[k]; wsum += w[k];
      parts.push({ key: k, label: def.label, score: mm.score, weight: w[k], value: mm.value });
    });

    var fit = wsum > 0 ? (sum / wsum) / 100 * 60 : 0;

    var counts = CV.countByState(region.id, profile);
    var progScore = Math.min(1, counts.ok * 0.45 + counts.check * 0.15) * 40;

    /* 추천 이유 2줄: 가중치×점수가 큰 지표 순 */
    parts.sort(function (a, b) { return (b.score * b.weight) - (a.score * a.weight); });
    var reasons = parts.slice(0, 2).map(function (x) { return x.label + ' — ' + x.value; });

    /* 주의점 1줄: 지역 고정 주의 + 가장 낮은 지표 */
    parts.sort(function (a, b) { return a.score - b.score; });
    var weakest = parts[0];
    var caution = region.caution;
    if (weakest && weakest.score < 50) caution = weakest.label + '이(가) 약한 편입니다 — ' + weakest.value + '. ' + region.caution;

    return {
      regionId: region.id,
      total: Math.round(fit + progScore),
      fit: Math.round(fit), programScore: Math.round(progScore),
      counts: counts, reasons: reasons, caution: caution, missing: missing
    };
  };

  /* ── Top3 (MatchResult) ── */
  CV.rankRegions = function (profile) {
    var rows = REGIONS.map(function (r) { return CV.scoreRegion(r, profile); })
      .sort(function (a, b) { return b.total - a.total || b.counts.ok - a.counts.ok; });
    var result = { id: CV.uid(), profileAt: profile.updatedAt, at: new Date().toISOString(), rows: rows };
    CV.write(CV.KEY.match, result);
    return rows;
  };
})(window.CV);
