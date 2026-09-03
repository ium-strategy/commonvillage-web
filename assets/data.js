/* 커먼빌리지 시드 데이터 — 기획서 §7 데이터 모델 8종 중 Region / RegionMetric / Program / EligibilityRule
 *
 * ⚠ 이 파일의 값은 전부 화면 검증용 예시입니다. 실제 공고·지표가 아닙니다.
 *   운영 투입 시 §8.1 Phase 0 원칙에 따라 3~5지역 × 6지표 = 30셀을 수동 입력하되,
 *   저장 스키마(source·asOf·cycle·version)는 API 전환을 전제로 지금 형태를 유지합니다.
 */

const SEED_IS_SAMPLE = true;

/* 사이트 설정 — 채널이 개설되면 URL만 채우면 구독 블록의 카카오 버튼이 바로 연결됩니다.
   비어 있는 동안에는 버튼이 "준비 중" 안내로 바뀌고 이메일 구독을 대신 권합니다. */
const SITE = {
  kakaoChannelUrl: ''   // 예: 'https://pf.kakao.com/_xxxxx'
};

/* 6지표 정의 (§5.5) — 관광 명소가 아니라 생활의 언어로 */
const METRIC_DEFS = [
  { key: 'life',    label: '생활편의', hint: '장보기·은행·카페까지의 거리' },
  { key: 'medical', label: '의료접근', hint: '병·의원과 응급 대응' },
  { key: 'transit', label: '교통',     hint: '차 없이 움직일 수 있는 정도' },
  { key: 'work',    label: '업무환경', hint: '일할 자리와 네트워크' },
  { key: 'nature',  label: '자연관광', hint: '쉴 곳이 가까운 정도' },
  { key: 'cost',    label: '체류비용', hint: '한 달 지내는 비용 부담(높을수록 저렴)' }
];

/* RegionMetric: score(0~100) + value(사람 말) + source/asOf/cycle/version 필수 (§7) */
function m(score, value, source, asOf, cycle) {
  return { score, value, source, asOf, cycle, version: 'seed-1' };
}

const REGIONS = [
  {
    id: 'gangneung', name: '강릉시', sido: '강원특별자치도',
    tagline: '기차로 닿는 바다, 일할 자리도 있는 중소도시',
    intro: '서울에서 KTX로 2시간이 채 안 걸립니다. 시내에 대형마트와 종합병원이 있어 한 달을 지내도 크게 아쉬운 것이 없고, 바다 쪽 카페·코워킹 자리가 늘어 노트북을 들고 오는 사람이 많은 편입니다. 다만 여름 성수기에는 숙소값이 오릅니다.',
    caution: '7~8월 성수기에는 숙박비가 평소의 1.5배 이상으로 오릅니다.',
    metrics: {
      life:    m(78, '시내권 도보 생활 가능', '소상공인시장진흥공단 상가정보(예정)', '2026-08-20', '월'),
      medical: m(72, '종합병원 2곳 · 야간 진료 가능', '건강보험심사평가원 병원정보서비스(예정)', '2026-08-20', '분기'),
      transit: m(70, 'KTX 정차 · 시내버스 배차 15~20분', '수동 입력', '2026-08-18', '반기'),
      work:    m(66, '공유오피스 3곳 · 워케이션 시설 운영', '수동 입력', '2026-08-18', '반기'),
      nature:  m(88, '해변까지 시내에서 15분', '한국관광공사 TourAPI(예정)', '2026-08-20', '월'),
      cost:    m(52, '원룸 월세 45~60만 원대', '국토교통부 전월세 실거래가(예정)', '2026-07-31', '월')
    }
  },
  {
    id: 'mokpo', name: '목포시', sido: '전라남도',
    tagline: '생활비가 낮고, 섬으로 나가기 좋은 항구도시',
    intro: '구도심에 상권이 촘촘해 차 없이도 생활이 됩니다. 월세와 물가가 낮은 편이라 3개월 이상 머무는 사람에게 부담이 적습니다. 병원·행정 시설이 시내에 모여 있고, 배편으로 섬에 나가는 일정을 짜기 좋습니다.',
    caution: '겨울 바닷바람이 셉니다. 원도심 숙소는 방음·난방을 확인하세요.',
    metrics: {
      life:    m(74, '원도심 도보권에 시장·마트', '소상공인시장진흥공단 상가정보(예정)', '2026-08-20', '월'),
      medical: m(76, '종합병원 3곳 · 응급의료 상시', '건강보험심사평가원 병원정보서비스(예정)', '2026-08-20', '분기'),
      transit: m(64, 'KTX 종착 · 시내 이동은 버스로 충분', '수동 입력', '2026-08-18', '반기'),
      work:    m(48, '공유오피스 1곳 · 카페 작업 위주', '수동 입력', '2026-08-18', '반기'),
      nature:  m(72, '유달산·섬 여객선 30분 내', '한국관광공사 TourAPI(예정)', '2026-08-20', '월'),
      cost:    m(84, '원룸 월세 30~40만 원대', '국토교통부 전월세 실거래가(예정)', '2026-07-31', '월')
    }
  },
  {
    id: 'yeongdeok', name: '영덕군', sido: '경상북도',
    tagline: '조용한 어촌, 정착을 미리 살아보기 좋은 곳',
    intro: '읍내를 벗어나면 상점이 드물어 차가 있는 편이 편합니다. 대신 빈집·유휴 시설을 활용한 체류 프로그램이 꾸준히 열리고, 마을 단위로 사람을 맞는 경험이 쌓여 있습니다. 정착을 염두에 두고 계절을 겪어 보려는 사람에게 맞습니다.',
    caution: '차량 없이는 장보기·병원 이동이 어렵습니다. 읍내 외 지역은 특히 그렇습니다.',
    metrics: {
      life:    m(42, '읍내에 마트 1곳, 그 밖은 차량 필요', '소상공인시장진흥공단 상가정보(예정)', '2026-08-20', '월'),
      medical: m(38, '보건의료원 중심 · 응급은 포항까지 40분', '건강보험심사평가원 병원정보서비스(예정)', '2026-08-20', '분기'),
      transit: m(30, '시외버스 위주 · 군내 배차 간격 큼', '수동 입력', '2026-08-18', '반기'),
      work:    m(null, '데이터 없음', null, null, '반기'),
      nature:  m(90, '해안 트레일과 산이 모두 가까움', '한국관광공사 TourAPI(예정)', '2026-08-20', '월'),
      cost:    m(88, '빈집 활용 체류비 월 20만 원대 사례', '수동 입력', '2026-07-31', '월')
    }
  },
  {
    id: 'seogwipo', name: '서귀포시', sido: '제주특별자치도',
    tagline: '체류 인프라가 가장 두꺼운 곳, 대신 비용이 든다',
    intro: '장기 체류자를 받아 본 경험이 많은 지역입니다. 코워킹·숙소·커뮤니티가 이미 갖춰져 있어 처음 한 달 살기를 시도하는 사람이 헤맬 일이 적습니다. 대신 항공료와 월세를 합치면 총비용이 가장 높은 축에 듭니다.',
    caution: '항공권과 렌터카를 포함하면 예상보다 총비용이 큽니다.',
    metrics: {
      life:    m(76, '시내권 생활 인프라 충분', '소상공인시장진흥공단 상가정보(예정)', '2026-08-20', '월'),
      medical: m(64, '종합병원 1곳 · 큰 진료는 제주시로', '건강보험심사평가원 병원정보서비스(예정)', '2026-08-20', '분기'),
      transit: m(46, '버스망은 있으나 렌터카 사용이 일반적', '수동 입력', '2026-08-18', '반기'),
      work:    m(82, '워케이션 거점·공유오피스 다수', '수동 입력', '2026-08-18', '반기'),
      nature:  m(94, '바다·오름·숲길 전부 30분 내', '한국관광공사 TourAPI(예정)', '2026-08-20', '월'),
      cost:    m(34, '월세 60~80만 원대 + 항공료', '국토교통부 전월세 실거래가(예정)', '2026-07-31', '월')
    }
  },
  {
    id: 'jecheon', name: '제천시', sido: '충청북도',
    tagline: '수도권에서 가장 가까운 산촌 체류지',
    intro: '청량리에서 기차로 1시간 40분. 주말마다 돌아가야 하는 사정이 있는 사람이 고르기 좋습니다. 시내에 생활 시설이 모여 있고, 조금만 나가면 산과 호수가 있습니다.',
    caution: '겨울 산간 지역은 눈이 많고 도로 사정이 나빠질 수 있습니다.',
    metrics: {
      life:    m(68, '시내권 마트·병원 도보 이용 가능', '소상공인시장진흥공단 상가정보(예정)', '2026-08-20', '월'),
      medical: m(58, '종합병원 1곳 · 야간 진료 제한', '건강보험심사평가원 병원정보서비스(예정)', '2026-08-20', '분기'),
      transit: m(62, '중앙선 KTX-이음 · 청량리 1시간 40분', '수동 입력', '2026-08-18', '반기'),
      work:    m(44, '공유오피스 1곳 · 자리 제한적', '수동 입력', '2026-08-18', '반기'),
      nature:  m(80, '청풍호·산행 코스 다수', '한국관광공사 TourAPI(예정)', '2026-08-20', '월'),
      cost:    m(78, '원룸 월세 30~45만 원대', '국토교통부 전월세 실거래가(예정)', '2026-07-31', '월')
    }
  }
];

/* ── EligibilityRule (§7) ───────────────────────────────────────────────
 * type: residence(거주지) | age(연령) | duration(체류기간) | vehicle(차량) | companion(동행)
 * 판정 3상태는 match.js에서 산출: 규칙 하나라도 fail → 대상 아님 /
 * fail 없고 unknown 있음 → 확인 필요 / 전부 pass → 신청 가능
 * 원문에 근거가 없는 조건은 절대 만들지 않는다. 모르면 needsDoc:true로 '확인 필요'를 유도한다.
 */
const PROGRAMS = [
  {
    id: 'gn-work-2026h2', regionId: 'gangneung',
    title: '강릉 워케이션 체류지원 2기',
    org: '강릉시 · 강릉관광개발공사',
    benefit: '숙박비 70% 지원 + 공유오피스 무료, 2주~4주',
    durationTypes: ['2-4w'],
    targetSummary: '강원 외 지역 거주, 재직·프리랜서 증빙 가능한 성인',
    openDate: '2026-08-18', closeDate: '2026-09-08',
    sourceUrl: 'https://example.go.kr/notice/gn-work-2026h2',
    checkedAt: '2026-08-29',
    partner: true,
    purposes: ['work'],
    /* 발주기관이 공개한 지난 회차 실적. 확인된 수치만 넣는다(추정 금지). */
    pastResult: { year: 2026, round: '상반기 1기', quota: 20, applicants: 96, source: '강릉시 결과 공고' },
    summary: [
      '2주 또는 4주 중 하나를 골라 신청합니다. 숙소는 시가 계약한 곳 중에서 배정되고, 본인 부담은 30%입니다.',
      '평일에는 지정 공유오피스를 무료로 씁니다. 별도의 근무 실적 제출은 없고, 체류 종료 후 설문 한 번을 냅니다.'
    ],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['강원특별자치도'], label: '강원특별자치도 외 지역 거주자' },
      { type: 'age', min: 19, max: null, label: '만 19세 이상' },
      { type: 'duration', allow: ['2-4w'], label: '2~4주 체류 가능' }
    ],
    documents: ['재직증명서 또는 프리랜서 활동 증빙(계약서·사업자등록증 등)']
  },
  {
    id: 'gn-rest-autumn', regionId: 'gangneung',
    title: '강릉 가을 한 달 살기',
    org: '강릉시 인구정책과',
    benefit: '숙박 50% + 체험 프로그램 4회, 1~3개월',
    durationTypes: ['1-3m'],
    targetSummary: '강원 외 지역 거주 성인, 연령 제한 없음',
    openDate: '2026-08-25', closeDate: '2026-09-22',
    sourceUrl: 'https://example.go.kr/notice/gn-rest-autumn',
    checkedAt: '2026-08-30',
    partner: false,
    purposes: ['rest', 'settle'],
    summary: [
      '한 달을 기준으로 하되 최대 3개월까지 연장 신청을 받습니다. 숙박비의 절반을 시가 부담합니다.',
      '지역 체험 프로그램(공방·바다 활동 등) 4회 참여가 조건에 포함됩니다.'
    ],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['강원특별자치도'], label: '강원특별자치도 외 지역 거주자' },
      { type: 'duration', allow: ['1-3m', '3m+'], label: '1개월 이상 체류' }
    ]
  },
  {
    id: 'mp-youth-live', regionId: 'mokpo',
    title: '목포 청년 살아보기',
    org: '목포시 청년정책관',
    benefit: '숙소 제공 + 활동비 월 30만 원, 1~3개월',
    durationTypes: ['1-3m'],
    targetSummary: '만 19~39세, 전남 외 지역 거주자',
    openDate: '2026-08-20', closeDate: '2026-09-15',
    sourceUrl: 'https://example.go.kr/notice/mp-youth-live',
    checkedAt: '2026-08-28',
    partner: false,
    purposes: ['settle', 'rest'],
    summary: [
      '원도심 게스트하우스를 숙소로 제공하고, 활동비를 월 30만 원 지급합니다.',
      '지역 사업체·단체와 연결되는 활동 과제가 있습니다. 정착 상담을 함께 받습니다.'
    ],
    rules: [
      { type: 'age', min: 19, max: 39, label: '만 19~39세' },
      { type: 'residence', mode: 'exclude', sido: ['전라남도'], label: '전라남도 외 지역 거주자' },
      { type: 'duration', allow: ['1-3m', '3m+'], label: '1개월 이상 체류' }
    ]
  },
  {
    id: 'mp-work-island', regionId: 'mokpo',
    title: '목포 원도심 워케이션 위크',
    org: '목포시 · 지역 상생협의회',
    benefit: '숙박 4박 지원 + 작업 공간, 1주',
    durationTypes: ['1w'],
    targetSummary: '전남 외 지역 거주 재직자·프리랜서',
    openDate: '2026-09-01', closeDate: '2026-09-30',
    sourceUrl: 'https://example.go.kr/notice/mp-work-island',
    checkedAt: '2026-09-01',
    partner: false,
    purposes: ['work'],
    summary: [
      '월요일 입주, 금요일 퇴실 기준 4박 일정입니다. 원도심 공유공간을 작업 자리로 씁니다.',
      '회차별 정원이 작습니다. 조기 마감될 수 있습니다.'
    ],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['전라남도'], label: '전라남도 외 지역 거주자' },
      { type: 'duration', allow: ['1w'], label: '1주 체류' }
    ],
    documents: ['재직증명서 또는 프리랜서 활동 증빙(계약서·사업자등록증 등)']
  },
  {
    id: 'yd-empty-house', regionId: 'yeongdeok',
    title: '영덕 빈집 살아보기',
    org: '영덕군 인구활력과',
    benefit: '빈집 무상 제공(관리비 본인 부담), 1~3개월',
    durationTypes: ['1-3m'],
    targetSummary: '경북 외 지역 거주자, 차량 보유 권장(원문상 필수)',
    openDate: '2026-08-10', closeDate: '2026-09-05',
    sourceUrl: 'https://example.go.kr/notice/yd-empty-house',
    checkedAt: '2026-08-27',
    partner: true,
    purposes: ['settle'],
    pastResult: { year: 2026, round: '상반기', quota: 6, applicants: 41, source: '영덕군 파일럿 제공' },
    summary: [
      '군이 정비한 빈집을 무상으로 씁니다. 전기·수도 등 관리비는 본인이 냅니다.',
      '원문에 "자가용 이용 가능자"가 신청 요건으로 적혀 있습니다. 읍내를 벗어나면 대중교통이 드뭅니다.'
    ],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['경상북도'], label: '경상북도 외 지역 거주자' },
      { type: 'duration', allow: ['1-3m', '3m+'], label: '1개월 이상 체류' },
      { type: 'vehicle', required: true, label: '자가용 이용 가능' }
    ]
  },
  {
    id: 'yd-family-stay', regionId: 'yeongdeok',
    title: '영덕 가족 체류 프로그램',
    org: '영덕군 · 마을공동체 협의회',
    benefit: '마을 숙소 + 체험 프로그램, 2~4주',
    durationTypes: ['2-4w'],
    targetSummary: '2인 이상 동행(가족·커플) 기준, 지역 제한 없음',
    openDate: '2026-08-30', closeDate: '2026-10-10',
    sourceUrl: 'https://example.go.kr/notice/yd-family-stay',
    checkedAt: '2026-08-31',
    partner: false,
    purposes: ['rest', 'settle'],
    summary: [
      '마을이 운영하는 숙소에 2인 이상이 함께 머무는 프로그램입니다.',
      '주말 체험 프로그램이 포함되어 있고, 참여는 선택입니다.'
    ],
    rules: [
      { type: 'companion', allow: ['couple', 'family', 'friend'], label: '2인 이상 동행' },
      { type: 'duration', allow: ['2-4w', '1-3m'], label: '2주 이상 체류' }
    ]
  },
  {
    id: 'sg-workation', regionId: 'seogwipo',
    title: '서귀포 워케이션 지원 3차',
    org: '서귀포시 · 제주관광공사',
    benefit: '숙박 60% + 거점 오피스 이용권, 2~4주',
    durationTypes: ['2-4w'],
    targetSummary: '제주 외 지역 거주 재직자·프리랜서, 만 19세 이상',
    openDate: '2026-08-22', closeDate: '2026-09-19',
    sourceUrl: 'https://example.go.kr/notice/sg-workation',
    checkedAt: '2026-08-30',
    partner: false,
    purposes: ['work'],
    summary: [
      '거점 오피스 이용권이 함께 나옵니다. 숙박비는 60%까지 지원되고 상한이 있습니다.',
      '항공료는 지원 대상이 아닙니다.'
    ],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['제주특별자치도'], label: '제주 외 지역 거주자' },
      { type: 'age', min: 19, max: null, label: '만 19세 이상' },
      { type: 'duration', allow: ['2-4w'], label: '2~4주 체류' }
    ],
    documents: ['재직증명서 또는 프리랜서 활동 증빙(계약서·사업자등록증 등)']
  },
  {
    id: 'sg-rest-month', regionId: 'seogwipo',
    title: '서귀포 한 달 살아보기(가을)',
    org: '서귀포시 도시재생지원센터',
    benefit: '숙박 40% + 로컬 클래스 3회, 1~3개월',
    durationTypes: ['1-3m'],
    targetSummary: '제주 외 지역 거주 성인',
    openDate: '2026-09-01', closeDate: '2026-10-20',
    sourceUrl: 'https://example.go.kr/notice/sg-rest-month',
    checkedAt: '2026-09-01',
    partner: false,
    purposes: ['rest'],
    summary: [
      '한 달 단위로 신청합니다. 숙소는 직접 계약하고 영수증으로 정산하는 방식입니다.',
      '로컬 클래스 3회가 포함됩니다.'
    ],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['제주특별자치도'], label: '제주 외 지역 거주자' },
      { type: 'duration', allow: ['1-3m', '3m+'], label: '1개월 이상 체류' }
    ]
  },
  {
    id: 'jc-weekend', regionId: 'jecheon',
    title: '제천 5도2촌 체류지원',
    org: '제천시 농촌활력과',
    benefit: '주말 숙소 제공 + 이동비 일부, 1주 단위 반복',
    durationTypes: ['1w', '2-4w'],
    targetSummary: '수도권 거주자 우대, 만 19세 이상',
    openDate: '2026-08-28', closeDate: '2026-09-26',
    sourceUrl: 'https://example.go.kr/notice/jc-weekend',
    checkedAt: '2026-08-31',
    partner: false,
    purposes: ['settle', 'rest'],
    summary: [
      '평일은 원래 살던 곳에서, 주말은 제천에서 지내는 방식을 전제로 한 프로그램입니다.',
      '이동비 일부가 지원됩니다. 지원 상한은 원문을 확인해야 합니다.'
    ],
    rules: [
      { type: 'age', min: 19, max: null, label: '만 19세 이상' },
      { type: 'duration', allow: ['1w', '2-4w'], label: '1주~4주 체류' },
      { type: 'doc', label: '수도권 거주 우대 조건 해석', needsDoc: true }
    ]
  },
  {
    id: 'jc-work-forest', regionId: 'jecheon',
    title: '제천 산촌 워케이션',
    org: '제천시 · 산림조합',
    benefit: '숙박 전액 + 작업 공간, 1주',
    durationTypes: ['1w'],
    targetSummary: '충북 외 지역 거주 재직자, 차량 보유자',
    openDate: '2026-09-02', closeDate: '2026-09-12',
    sourceUrl: 'https://example.go.kr/notice/jc-work-forest',
    checkedAt: '2026-09-02',
    partner: false,
    purposes: ['work'],
    summary: [
      '산촌 거점 숙소를 무료로 제공합니다. 정원이 적고 회차가 짧습니다.',
      '숙소가 시내에서 떨어져 있어 원문에 차량 보유가 요건으로 적혀 있습니다.'
    ],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['충청북도'], label: '충청북도 외 지역 거주자' },
      { type: 'duration', allow: ['1w'], label: '1주 체류' },
      { type: 'vehicle', required: true, label: '자가용 이용 가능' }
    ],
    documents: ['재직증명서']
  },

  /* ── 지난 모집 (§5.7 아카이브 · SEO 자산) ── */
  {
    id: 'gn-work-2026h1', regionId: 'gangneung',
    title: '강릉 워케이션 체류지원 1기',
    org: '강릉시 · 강릉관광개발공사',
    benefit: '숙박비 70% 지원 + 공유오피스 무료, 2주~4주',
    durationTypes: ['2-4w'], targetSummary: '강원 외 지역 거주 재직자',
    openDate: '2026-02-10', closeDate: '2026-03-14',
    sourceUrl: 'https://example.go.kr/notice/gn-work-2026h1', checkedAt: '2026-03-16',
    partner: false, purposes: ['work'],
    summary: ['상반기에 열렸던 회차입니다. 하반기 2기 공고가 현재 모집 중입니다.'],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['강원특별자치도'], label: '강원특별자치도 외 지역 거주자' },
      { type: 'duration', allow: ['2-4w'], label: '2~4주 체류' }
    ]
  },
  {
    id: 'mp-spring-live', regionId: 'mokpo',
    title: '목포 봄 한 달 살기',
    org: '목포시 관광과',
    benefit: '숙박 50% + 원도심 투어, 1~3개월',
    durationTypes: ['1-3m'], targetSummary: '전남 외 지역 거주 성인',
    openDate: '2026-01-20', closeDate: '2026-02-28',
    sourceUrl: 'https://example.go.kr/notice/mp-spring-live', checkedAt: '2026-03-02',
    partner: false, purposes: ['rest'],
    summary: ['상반기 회차입니다. 매년 1~2월에 공고가 나왔습니다.'],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['전라남도'], label: '전라남도 외 지역 거주자' },
      { type: 'duration', allow: ['1-3m', '3m+'], label: '1개월 이상 체류' }
    ]
  },
  {
    id: 'yd-spring-house', regionId: 'yeongdeok',
    title: '영덕 빈집 살아보기(상반기)',
    org: '영덕군 인구활력과',
    benefit: '빈집 무상 제공, 1~3개월',
    durationTypes: ['1-3m'], targetSummary: '경북 외 지역 거주자',
    openDate: '2026-02-01', closeDate: '2026-03-20',
    sourceUrl: 'https://example.go.kr/notice/yd-spring-house', checkedAt: '2026-03-23',
    partner: false, purposes: ['settle'],
    summary: ['상반기 회차입니다. 하반기 공고가 현재 모집 중입니다.'],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['경상북도'], label: '경상북도 외 지역 거주자' },
      { type: 'vehicle', required: true, label: '자가용 이용 가능' }
    ]
  },
  {
    id: 'sg-spring-workation', regionId: 'seogwipo',
    title: '서귀포 워케이션 지원 2차',
    org: '서귀포시 · 제주관광공사',
    benefit: '숙박 60% + 거점 오피스, 2~4주',
    durationTypes: ['2-4w'], targetSummary: '제주 외 지역 거주 재직자',
    openDate: '2026-04-01', closeDate: '2026-05-15',
    sourceUrl: 'https://example.go.kr/notice/sg-spring-workation', checkedAt: '2026-05-18',
    partner: false, purposes: ['work'],
    summary: ['2차 회차입니다. 3차 공고가 현재 모집 중입니다.'],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['제주특별자치도'], label: '제주 외 지역 거주자' },
      { type: 'duration', allow: ['2-4w'], label: '2~4주 체류' }
    ]
  },
  {
    id: 'jc-spring-farm', regionId: 'jecheon',
    title: '제천 귀농·귀촌 살아보기',
    org: '제천시 농촌활력과',
    benefit: '숙소 제공 + 영농 교육, 1~3개월',
    durationTypes: ['1-3m'], targetSummary: '충북 외 지역 거주자, 만 19세 이상',
    openDate: '2026-03-02', closeDate: '2026-04-10',
    sourceUrl: 'https://example.go.kr/notice/jc-spring-farm', checkedAt: '2026-04-13',
    partner: false, purposes: ['settle'],
    summary: ['상반기 회차입니다. 매년 3월경 공고가 나왔습니다.'],
    rules: [
      { type: 'residence', mode: 'exclude', sido: ['충청북도'], label: '충청북도 외 지역 거주자' },
      { type: 'age', min: 19, max: null, label: '만 19세 이상' },
      { type: 'duration', allow: ['1-3m', '3m+'], label: '1개월 이상 체류' }
    ]
  }
];

/* 진단 선택지 라벨 사전 (§5.3 M0 6단계 확정안) */
const LABELS = {
  purpose:   { work: '일하며 지내기', rest: '쉬면서 지내기', settle: '정착 전에 살아보기' },
  duration:  { '1w': '1주', '2-4w': '2~4주', '1-3m': '1~3개월', '3m+': '3개월 이상' },
  companion: { solo: '혼자', couple: '둘이', family: '아이와 함께', friend: '친구·동료와' },
  mobility:  { car: '자가용 있음', nocar: '자가용 없음' },
  age:       { '20s': '20대', '30s': '30대', '40s': '40대', '50s': '50대', '60s+': '60대 이상' },
  priority:  {
    quiet: '조용한 환경', community: '사람과의 연결', cost: '낮은 체류비용',
    work: '일할 자리', medical: '의료 접근성', transit: '차 없이 이동',
    nature: '자연·바다·산', school: '아이 돌봄·학교'
  }
};

const SIDO_LIST = [
  '서울특별시','부산광역시','대구광역시','인천광역시','광주광역시','대전광역시','울산광역시','세종특별자치시',
  '경기도','강원특별자치도','충청북도','충청남도','전북특별자치도','전라남도','경상북도','경상남도','제주특별자치도'
];
