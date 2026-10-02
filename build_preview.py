"""index.html과 CSS·JS·데이터·로고를 한 파일로 묶어 미리보기용 HTML을 만든다."""
import base64, re, sys, pathlib

root = pathlib.Path(__file__).parent
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else root / "dist" / "preview.html")
html = (root / "index.html").read_text(encoding="utf-8")

def data_uri(path, mime):
    return f"data:{mime};base64," + base64.b64encode((root / path).read_bytes()).decode()

# 아이콘·매니페스트 링크는 미리보기에서 SVG 파비콘 하나로 대체
html = re.sub(r'<link rel="icon"[^>]*>\n', "", html)
html = re.sub(r'<link rel="apple-touch-icon"[^>]*>\n', "", html)
html = re.sub(r'<link rel="manifest"[^>]*>\n', "", html)
html = html.replace("<link rel=\"preconnect\"", f'<link rel="icon" href="{data_uri("brand/icons/favicon.svg", "image/svg+xml")}">\n<link rel="preconnect"', 1)

css = (root / "assets/css/app.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="assets/css/app.css">', f"<style>\n{css}\n</style>")

for src in ["assets/js/config.js", "data/programs.js", "data/regions.js", "assets/js/app.js"]:
    js = (root / src).read_text(encoding="utf-8")
    if src.endswith("app.js"):
        js = js.replace('src="brand/logo-ko-mobile.svg"', f'src="{data_uri("brand/logo-ko-mobile.svg", "image/svg+xml")}"')
        js = js.replace('src="brand/logo-ko-header.svg"', f'src="{data_uri("brand/logo-ko-header.svg", "image/svg+xml")}"')
    html = html.replace(f'<script src="{src}"></script>', f"<script>\n{js}\n</script>")

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding="utf-8")
print(out, round(out.stat().st_size / 1024), "KB")
