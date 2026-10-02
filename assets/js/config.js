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
  contactEmail: "" // 운영 문의 이메일 (확정 후 입력)
};
