/*
 * 커먼빌리지 도별 지역 정보
 * 6개 도 권역 · 1차 후보 10곳 (웹기획안 v3.0, 2026-10-02)
 * 지표 값(value)은 운영팀이 정리하기 전까지 null → 화면에 "정리 중"으로 표시한다.
 * 각 지표에는 반드시 source(출처)와 basedOn(기준일)을 함께 넣는다.
 */
window.CV_PROVINCES = [
  { name: "경기도", includes: "경기·인천" },
  { name: "강원도", includes: "강원" },
  { name: "충청도", includes: "충북·충남·대전·세종" },
  { name: "전라도", includes: "전북·전남·광주" },
  { name: "경상도", includes: "경북·경남·대구·부산·울산" },
  { name: "제주도", includes: "제주" }
];

window.CV_METRICS = [
  { key: "life",    label: "생활편의", question: "걸어서 장 볼 곳이 있나?", source: "상가(상권)정보, 소상공인시장진흥공단" },
  { key: "medical", label: "의료접근", question: "가까운 병원·약국은?",     source: "병원정보서비스, 건강보험심사평가원" },
  { key: "transit", label: "교통",     question: "차 없이 다닐 수 있나?",   source: null },
  { key: "work",    label: "업무환경", question: "일할 공간과 와이파이는?", source: "운영팀 직접 확인" },
  { key: "nature",  label: "자연·관광", question: "쉬는 날 갈 곳은?",       source: "국문 관광정보 서비스, 한국관광공사" },
  { key: "cost",    label: "체류비용", question: "한 달 머물면 얼마 드나?", source: "전월세 실거래가, 국토교통부" }
];

function cvRegion(id, name, province) {
  return { id: id, name: name, province: province, intro: null, metrics: {} };
}

window.CV_REGIONS = [
  cvRegion("gapyeong", "가평", "경기도"),
  cvRegion("chuncheon", "춘천", "강원도"),
  cvRegion("dangjin", "당진", "충청도"),
  cvRegion("namwon", "남원", "전라도"),
  cvRegion("gangjin", "강진", "전라도"),
  cvRegion("muan", "무안", "전라도"),
  cvRegion("gimhae", "김해", "경상도"),
  cvRegion("hadong", "하동", "경상도"),
  cvRegion("ulsan", "울산", "경상도"),
  cvRegion("jeju", "제주", "제주도")
];
/* 지표 입력 예시:
   CV_REGIONS[6].intro = "…";
   CV_REGIONS[6].metrics.life = { value: "…", basedOn: "2026-10-15" };
*/
