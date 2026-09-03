# 판정 규칙과 데이터 모델

판정과 매칭은 전부 [`assets/match.js`](../assets/match.js)에, 데이터는 [`assets/data.js`](../assets/data.js)에 있습니다.
규칙을 고칠 일이 생기면 이 두 파일만 보면 됩니다.

---

## 판정 3상태

공고 하나에 붙은 `rules` 배열을 하나씩 평가해 `pass` / `unknown` / `fail` 을 매기고, 이렇게 합칩니다.

| 조건 | 결과 |
|---|---|
| `fail` 이 하나라도 있으면 | **대상 아님** (중립 회색) |
| `fail` 은 없고 `unknown` 이 있으면 | **확인 필요** (앰버) |
| 전부 `pass` 면 | **신청 가능** (초록) |

애매할 때 '가능'으로 올리지 않는 것이 이 설계의 전부입니다.
색만으로 상태를 전달하지 않도록 배지는 항상 색 + 텍스트 + 아이콘을 함께 씁니다.

### 규칙 타입

| type | 하는 일 | 값이 없을 때 |
|---|---|---|
| `residence` | 거주 시·도 포함/제외 | `unknown` — "거주 시·도를 입력하면 확인할 수 있습니다" |
| `age` | 연령대 범위. 밴드가 범위에 걸치면 `unknown` | `unknown` |
| `duration` | 희망 체류 기간이 허용 목록에 있는지 | `unknown` |
| `vehicle` | 자가용 필요 여부 | `unknown` |
| `companion` | 동행 조건 | `unknown` |
| `doc` | 해석이 갈리는 조건 | 항상 `unknown` |

**연령은 밴드로 받습니다.** 20대·30대처럼 구간으로 받기 때문에, 규칙이 "만 19~39세"이고 사용자가 30대면 `pass`,
40대면 `fail`, 경계에 걸치면 `unknown`으로 내리고 "생년월일 기준으로 원문을 확인하세요"라고 안내합니다.

### 서류 요건을 규칙에서 분리한 이유

기획서에는 없던 판단을 하나 했습니다. **재직 증명 같은 서류 요건은 판정 규칙이 아니라 `documents` 필드**로 옮겼습니다.

서류를 '확인 필요' 사유로 두면 워케이션 계열 공고가 전부 앰버로 떨어집니다.
그러면 North Star인 "신청 가능 판정 n건" 배지가 구조적으로 0이 되어, 제품의 핵심 지표가 작동하지 않습니다.
서류는 자격 미달 사유가 아니라 준비물이므로 상세 화면에 별도 블록으로 안내합니다.

해석이 실제로 갈리는 조건(예: 제천 "수도권 거주 우대")만 `doc` 규칙으로 남겨 '확인 필요'를 만듭니다.

---

## 매칭 점수

기획서 §5.4 확정안 그대로 **지역 적합도 60 + 사업 매칭도 40 = 100점**입니다.

### 지역 적합도 (60점)

목적별 가중치로 6지표를 가중평균한 뒤 60점으로 환산합니다.

| 목적 | 가중치가 큰 순서 |
|---|---|
| 일하며 지내기 | 업무환경 .28 · 생활편의 .18 · 자연관광 .17 · 교통 .15 · 체류비용 .12 · 의료접근 .10 |
| 쉬면서 지내기 | 자연관광 .30 · 체류비용 .20 · 생활편의 .16 · 의료접근 .14 · 교통 .10 · 업무환경 .10 |
| 정착 전에 살아보기 | 의료접근 .24 · 생활편의 .24 · 체류비용 .20 · 교통 .16 · 자연관광 .10 · 업무환경 .06 |

진단에서 고른 우선조건 2개는 대응 지표에 `+.12`를 더합니다.
'사람과의 연결', '아이 돌봄·학교'처럼 대응 지표가 없는 항목은 점수에 반영하지 않습니다 — 없는 데이터로 점수를 만들지 않기 위해서입니다.

**지표가 없으면 가중치에서 빼고 재정규화합니다.** 그리고 화면에 "데이터 없음: 업무환경 — 점수 계산에서 제외했습니다"라고 적습니다.
결측을 0점으로 처리하면 데이터가 없는 지역이 부당하게 불리해집니다.

### 사업 매칭도 (40점)

그 지역에서 지금 모집 중인 공고를 사용자 조건으로 판정한 결과입니다.

```
min(1, 신청가능 × 0.45 + 확인필요 × 0.15) × 40
```

'신청 가능' 3건이면 만점에 가깝습니다. 지역이 아무리 좋아도 신청할 수 있는 공고가 없으면 위로 올라오지 않습니다.

### 추천 이유와 주의점

- **추천 이유 2줄** — `점수 × 가중치`가 큰 지표 둘을 골라 지표의 `value` 문장을 그대로 씁니다
- **주의점 1줄** — 가장 낮은 지표가 50점 미만이면 그것을, 아니면 지역 고정 주의 문구를 씁니다

---

## 데이터 모델

기획서 §7의 8종 중 프런트에서 쓰는 것들입니다.

### Region / RegionMetric

```js
{
  id, name, sido, tagline, intro, caution,
  metrics: {
    life: { score, value, source, asOf, cycle, version },
    // medical, transit, work, nature, cost
  }
}
```

**`source` · `asOf` · `cycle` · `version` 은 필수입니다.** 지금은 수동 입력이지만 §8.1 Phase 0 원칙대로
API 전환을 전제로 스키마를 지킵니다. 수동 30셀을 이 형태로 채워 두면 Phase 1에서 값만 API로 갈아끼울 수 있습니다.

`score`가 `null`이면 화면에 "데이터 없음"으로 표시되고 점수 계산에서 빠집니다.

### Program / EligibilityRule

```js
{
  id, regionId, title, org, benefit,
  durationTypes: ['2-4w'], targetSummary,
  openDate, closeDate, sourceUrl, checkedAt,
  partner: true,          // 유료 노출 대상 — 화면에 '지자체 협력' 라벨이 붙는다
  purposes: ['work'],
  pastResult: { year, round, quota, applicants, source },  // 확보된 경우에만
  summary: ['사용자 언어로 다시 쓴 요약'],
  rules: [ /* EligibilityRule */ ],
  documents: ['재직증명서']   // 자격 요건이 아니라 준비물
}
```

- `checkedAt`이 14일을 넘기면 카드와 상세에 경고 배지가 자동으로 붙습니다
- `pastResult`가 없으면 경쟁률 행 자체를 그리지 않습니다. 추정치를 만들지 않습니다
- `partner: true`가 아니면 유료 노출 슬롯에 올라갈 수 없고, 올라가면 라벨이 반드시 붙습니다

### 익명 ID 데이터 사슬

회원 시스템이 없습니다. 쿠키에 담긴 익명 ID 하나로 이어집니다.

```
StayProfile ──▶ MatchResult ──▶ Interest
     └──────────────────────────▶ Alert (이메일 입력 시 병합)
```

| 저장소 키 | 내용 |
|---|---|
| `cv_uid` (쿠키 2년 + localStorage) | 익명 ID |
| `cv_profile` | StayProfile — 진단 6단계 답 |
| `cv_match` | MatchResult — 지역 랭킹 |
| `cv_interest` | Interest — 관심 표시·원문 신청 클릭 |
| `cv_alert` | 알림 등록(이메일·조건·동의) |
| `cv_log` | EventLog — 최근 400건 |

프로토타입이라 전부 브라우저에만 남습니다. 실제로는 이메일 입력 시점에 서버에서 익명 ID와 병합해야 합니다.

### 이벤트

`diagnosis_start_view` · `diagnosis_step` · `diagnosis_complete` · `result_view` · `region_view` ·
`program_list_view` · `program_view` · `eligibility_check` · `eligibility_error_report` ·
`interest_submit` · `outbound_apply_click` · `participation_intent` ·
`alert_opt_in`(type: matched\|reopen) · `alert_click_through` · `subscribe_kakao_click` · `subscribe_report` · `b2g_contact`

`alert_email_sent`는 발송 서버 쪽 이벤트라 프런트에서 남기지 않습니다.
