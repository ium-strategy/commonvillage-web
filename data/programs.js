/*
 * 커먼빌리지 공고 데이터
 * 기준: 2026-10-02 작업현황 문서의 입력 공고 16건
 * 원칙: 확인되지 않은 값은 null로 두고 화면에서 "원문 확인 필요"로 표시한다. 추정값을 넣지 않는다.
 *
 * verify: official(기관 원문) | operator(운영사 안내) | news(보도 기준, 원문 대조 필요)
 * type:   workation(워케이션) | month(한달살기·여행) | trial(살아보기·정착 준비)
 * deadlineType: date | first-come(선착순) | budget(예산 소진 시) | year-round(연중) | unknown
 * rules:  자격 규칙. 값이 없으면 판정에서 "확인 필요"로 처리한다.
 *         ageMin/ageMax(만 나이), youth(청년 대상, 연령 기준 미확인), residence(거주지 조건 문구)
 */
window.CV_PROGRAMS = [
  {
    id: "gimhae-smimae-3",
    title: "김해 스밈애 3차",
    province: "경상도", area: "김해",
    status: "open", deadline: "2026-10-06", deadlineType: "date",
    verify: "official", checkedAt: "2026-10-02",
    type: "month",
    benefit: "팀당 최대 237만원 지원",
    duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "namwon-nubi",
    title: "남원누비 청년 한달살이",
    province: "전라도", area: "남원",
    status: "open", deadline: "2026-10-11", deadlineType: "date",
    verify: "news", checkedAt: "2026-10-02",
    type: "month",
    benefit: null, duration: null, target: "청년", selfPay: null, snsTask: null,
    rules: { youth: true }, sourceUrl: null
  },
  {
    id: "gyeongbuk-workation",
    title: "경북형 워케이션",
    province: "경상도", area: "경북",
    status: "open", deadline: null, deadlineType: "unknown", deadlineNote: "11월 중 (원문 확인 필요)",
    verify: "official", checkedAt: "2026-10-02",
    type: "workation",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "ulsan-ucation",
    title: "울산 유케이션",
    province: "경상도", area: "울산",
    status: "open", deadline: null, deadlineType: "unknown",
    verify: "official", checkedAt: "2026-10-02",
    type: "workation",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "gapyeong-jaraseom",
    title: "가평 자라섬 워케이션",
    province: "경기도", area: "가평",
    status: "open", deadline: null, deadlineType: "unknown",
    verify: "operator", checkedAt: "2026-10-02",
    type: "workation",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "gyeonggi-healing",
    title: "경기 힐링 워케이션",
    province: "경기도", area: "경기",
    status: "open", deadline: null, deadlineType: "year-round", deadlineNote: "연중 운영 추정 (원문 확인 필요)",
    verify: "news", checkedAt: "2026-10-02",
    type: "workation",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "chuncheon-workation",
    title: "춘천 워케이션",
    province: "강원도", area: "춘천",
    status: "open", deadline: null, deadlineType: "unknown",
    verify: "news", checkedAt: "2026-10-02",
    type: "workation",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "jeonbuk-workation",
    title: "전북 워케이션",
    province: "전라도", area: "전북",
    status: "open", deadline: null, deadlineType: "unknown",
    verify: "official", checkedAt: "2026-10-02",
    type: "workation",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null,
    note: "지원금 안내가 이미지로만 제공되어 금액 미확인"
  },
  {
    id: "jeonnam-blue",
    title: "전남 블루 워케이션",
    province: "전라도", area: "전남",
    status: "open", deadline: null, deadlineType: "unknown",
    verify: "news", checkedAt: "2026-10-02",
    type: "workation",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "jeju-voucher-h2",
    title: "제주 워케이션 바우처 하반기",
    province: "제주도", area: "제주",
    status: "open", deadline: null, deadlineType: "first-come", deadlineNote: "선착순, 조기 마감 가능",
    verify: "news", checkedAt: "2026-10-02",
    type: "workation",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "fishing-village-workation",
    title: "어촌마을 워케이션",
    province: "전국", area: null,
    status: "open", deadline: null, deadlineType: "budget", deadlineNote: "예산 소진 시 마감",
    verify: "official", checkedAt: "2026-10-02",
    type: "workation",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "rural-workation",
    title: "농촌형 워케이션",
    province: "전국", area: null,
    status: "open", deadline: null, deadlineType: "unknown",
    verify: "official", checkedAt: "2026-10-02",
    type: "workation",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "dangjin-living-3",
    title: "당진 지역살이 3기",
    province: "충청도", area: "당진",
    status: "closed", deadline: "2026-09-16", deadlineType: "date",
    verify: "news", checkedAt: "2026-10-02",
    type: "trial",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "hadong-month-fall",
    title: "하동 한 달 여행 (가을)",
    province: "경상도", area: "하동",
    status: "closed", deadline: null, deadlineType: "unknown",
    verify: "news", checkedAt: "2026-10-02",
    type: "month",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "gangjin-pusso-summer",
    title: "강진 푸소 (여름)",
    province: "전라도", area: "강진",
    status: "closed", deadline: null, deadlineType: "unknown",
    verify: "news", checkedAt: "2026-10-02",
    type: "month",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  },
  {
    id: "muan-jeonnam-living-h2",
    title: "무안 전남에서 살아보기 (하반기)",
    province: "전라도", area: "무안",
    status: "closed", deadline: null, deadlineType: "unknown",
    verify: "news", checkedAt: "2026-10-02",
    type: "trial",
    benefit: null, duration: null, target: null, selfPay: null, snsTask: null,
    rules: {}, sourceUrl: null
  }
];
