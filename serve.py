"""로컬 미리보기용 정적 서버. 이 파일이 있는 폴더를 4399 포트로 서비스합니다."""
import http.server, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 4399
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=port, bind="127.0.0.1")
