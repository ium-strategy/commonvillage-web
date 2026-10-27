"""로컬 미리보기용 정적 서버. 먼저 `python build.py --site-url http://127.0.0.1:4399 --base-path ""` 로 dist/ 를 만든 뒤
`python serve.py` 를 실행하면 http://127.0.0.1:4399/ 에서 볼 수 있습니다. 없는 주소는 404.html 을 보여줍니다."""
import http.server
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, "404.html")
        if code == 404 and os.path.exists(page):
            body = open(page, "rb").read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)


if __name__ == "__main__":
    if not os.path.isdir(ROOT):
        sys.exit("dist/ 가 없습니다. 먼저 python build.py 를 실행하세요.")
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4399
    http.server.test(HandlerClass=Handler, port=port, bind="127.0.0.1")
