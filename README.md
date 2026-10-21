# 커먼빌리지 웹사이트 — 청년 기회 홈 (2026-10-21)

기존 v3.0 지역살이 진단·공고·지자체 안내를 유지하면서 청년 기회, 뉴스레터, 참여 안내, 기관 협업 중심으로 홈을 확장한 정적 사이트입니다. GitHub Pages에 그대로 올릴 수 있습니다.

## 이번 변경
- 홈: 살 곳 / 지원받을 곳 / 즐길 곳 / 도전할 곳, 주간 기회, 뉴스레터, 함께하기, 기관 협업 소개.
- 추가 경로: #/living (기존 홈), #/newsletter, #/community, #/partners.
- 분야별 목록: #/programs?category=living|support|enjoy|challenge|all. 기존 16개 공고는 살 곳으로 분류하며 다른 분야에 임의 공고를 만들지 않습니다.
- 공고에 category를 추가하면 분야별로 분류됩니다. 기존 지역살이 진단은 기존 유형을 대상으로 유지합니다.
- 홈 추천은 모집 중이며 HTTPS 원문이 등록된 기관 확인 공고만 표시합니다. 기존 공고의 원문 링크는 아직 비어 있어 검증 전 상태를 안내합니다.
- 참여 화면은 작성 양식과 복사 기능입니다. 공개 게시판이나 서버 저장 기능이 아닙니다. 이동·새로고침 시 작성 내용은 사라집니다.
- 기존 지역 정보, 1분 진단, 공고 상세, 지자체 안내, 리포트 샘플은 유지합니다.

## 운영 채널 연결
assets/js/config.js에서 아래 값을 채우면 연결 버튼이 활성화됩니다. 빈 값이나 유효하지 않은 주소는 준비 중으로 표시합니다.
- newsletterUrl: 구독 서비스의 HTTPS 신청 페이지. 서비스에서 개인정보 동의·수신거부·발행 설정을 완료한 뒤 연결합니다.
- newsletterArchiveUrl: 실제 발행한 뉴스레터 모아보기 HTTPS 주소.
- openChatUrl: 운영 중인 카카오 오픈채팅 초대 HTTPS 주소.
- contactEmail: 기관·기업 홍보 문의 이메일. 메일 작성창을 열며 자동 전송하지 않습니다.

신규 측정 이벤트는 channel_outbound, partner_contact_click, community_template_copy입니다. 이메일·작성한 글 내용은 이벤트에 넣지 않습니다. 링크 클릭은 구독 완료나 신청 완료 실적으로 계산하지 않습니다.

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

