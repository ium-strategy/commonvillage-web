/*
 * 커먼빌리지 사이트 설정
 * authMode
 *   "demo"     : 미리보기. 카카오·구글 버튼을 누르면 이 브라우저에만 임시 로그인 상태를 저장한다. 실제 계정 연결·알림 발송 없음.
 *   "supabase" : 실제 로그인. supabaseUrl, supabaseAnonKey를 채우고 Supabase에서 Kakao·Google 공급자를 켠 뒤 사용한다.
 */
window.CV_CONFIG = {
  authMode: "demo",
  supabaseUrl: "",
  supabaseAnonKey: "",
  dataCheckedAt: "2026-10-02",
  contactEmail: "", // 기관·기업 문의 이메일 (확정 후 입력)
  newsletterUrl: "", // 구독 서비스의 HTTPS 신청 페이지 (동의·수신거부 설정 후 연결)
  newsletterArchiveUrl: "", // 실제 발행된 뉴스레터 모아보기 HTTPS 주소
  openChatUrl: "" // 운영 중인 카카오 오픈채팅 HTTPS 초대 주소
};

