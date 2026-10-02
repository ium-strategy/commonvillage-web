# 커먼빌리지 웹사이트 v3.0 (2026-10-02)

웹기획안 v3.0과 확정 시안을 구현한 정적 사이트입니다. GitHub Pages에 그대로 올릴 수 있습니다.

## 구성
- index.html — 진입 파일 (화면은 주소의 # 경로로 바뀜: #/ 홈, #/diagnose/1~6 진단, #/result 결과, #/programs 공고, #/program/<id> 상세, #/regions/<도> 지역 정보, #/my 내 결과·알림, #/privacy 처리방침, #/for-gov 지자체 안내)
- assets/css/app.css — 스타일
- assets/js/config.js — 로그인 방식 설정 (지금은 demo: 이 기기에만 임시 로그인)
- assets/js/app.js — 진단·판정·추천·필터·로그인·알림 설정 동작
- data/programs.js — 공고 데이터 (확인 안 된 값은 null → 화면에 "원문 확인 필요")
- data/regions.js — 도별 10곳 지역 정보 (지표 값 정리 전)
- brand/ — 로고 Navy v2, 파비콘, 웹 매니페스트
- build_preview.py — 한 파일 미리보기 빌드용 (배포에는 필요 없음)

## 배포 전에 남은 일
1. data/programs.js: 기존 저장소의 공고 16건 상세(원문 링크, 기간, 대상, 혜택, 자부담, 과제)로 채우기
2. data/regions.js: 10곳 지역 소개와 6개 지표 값·기준일 채우기
3. 로그인: Supabase 프로젝트 생성 → Kakao·Google 공급자 설정 → config.js authMode "supabase"와 키 입력 → supabase-js 스크립트 추가
4. 알림 발송: 카카오 발송 방식(알림톡/채널 메시지)과 이메일 발송 서비스 선정 후 연결
5. 개인정보 처리방침 초안의 [확정 필요] 항목 채우고 법무 검토
6. 측정: window.dataLayer 이벤트(diagnosis_start, diagnosis_complete, login_click, apply_click 등)를 분석 도구에 연결
7. 검색 노출: 공고별 정적 페이지와 sitemap.xml 생성, robots 해제
