# 커먼빌리지 — 반응형 카페 시안 (2026-10-21)

승인된 `CommonVillage_Responsive_Preview.html`을 내용 변경 없이 `index.html`에 반영했습니다. 앞으로 이 메인 화면을 기준으로 기능과 디자인을 순차 개선합니다.

## 현재 수정 기준
- `index.html`: HTML·CSS·JavaScript가 포함된 단일 파일. PC 전체 폭 히어로, 모바일 공고 두 열과 하단 메뉴.
- 네 가지 카테고리: 살 곳 / 지원받을 곳 / 즐길 곳 / 도전할 곳.
- 기회 검색·필터·정렬·상세, 브라우저 보관함, 질문·후기 초안, 뉴스레터 구성 미리보기.
- 파일을 브라우저로 직접 열거나 정적 서버로 실행할 수 있습니다. 빌드가 필요하지 않습니다.
- Google Fonts가 연결되지 않으면 시스템 글꼴로 표시됩니다.

## 시안의 범위
공고·마감·라운지 글은 모두 예시입니다. 보관함과 초안은 현재 브라우저에만 저장됩니다. 실제 회원가입, 공고 신청, 질문 게시·기관 답변, 뉴스레터 구독·메일 발송은 아직 연결하지 않았습니다.
JavaScript 구문 검사를 완료했습니다. 브라우저 연결 제약으로 PC·모바일 화면 및 터치 동작의 실기 검증은 미완료입니다.

## 기존 구현 보관
- `legacy.html`: 변경 전 메인 진입 파일. 같은 위치의 `assets/`, `data/`, `brand/`를 사용하는 기존 지역살이 사이트입니다.
- 기존 데이터·로고·코드와 문서는 유지합니다. 아래 설명은 기존 구현용이며, 새 메인 화면의 동작 설명과 구분해서 참고하세요.
- `build_preview.py`는 기존 자산 구조를 위한 도구입니다. 새 단일 파일 시안은 이 빌드가 필요하지 않습니다.

---

## 커먼빌리지 웹사이트 v3.0 (2026-10-02)

웹기획안 v3.0과 확정 시안을 구현한 정적 사이트입니다. GitHub Pages에 그대로 올릴 수 있습니다.

## 구성
- index.html — 진입 파일 (화면은 주소의 # 경로로 바뀜: #/ 홈, #/diagnose/1~6 진단, #/result 결과, #/programs 공고, #/program/<id> 상세, #/regions/<도> 지역 정보, #/my 내 결과·알림, #/privacy 처리방침, #/for-gov 지자체 전용 안내, #/report 성과 리포트 샘플)
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
