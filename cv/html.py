"""아주 작은 템플릿 엔진과 HTML 조각 생성기.

템플릿 문법
  {{ name }}    값을 HTML 이스케이프해서 넣음
  {{{ name }}}  HTML을 그대로 넣음
  {% if name %} ... {% endif %}   값이 비어 있지 않으면 표시
"""
import html as _html
import json
import os
import re

_VAR = re.compile(r"\{\{\{\s*([\w.]+)\s*\}\}\}|\{\{\s*([\w.]+)\s*\}\}")
_IF = re.compile(r"\{%\s*if\s+([\w.]+)\s*%\}(.*?)\{%\s*endif\s*%\}", re.S)


def esc(value):
    return _html.escape("" if value is None else str(value), quote=True)


def nl2p(text):
    """줄바꿈 기준으로 <p> 문단 생성(이스케이프 포함)."""
    parts = [p.strip() for p in re.split(r"\n\s*\n|\n", text or "") if p.strip()]
    return "".join("<p>%s</p>" % esc(p) for p in parts)


class Templates:
    def __init__(self, directory):
        self.dir = directory
        self._cache = {}

    def source(self, name):
        if name not in self._cache:
            with open(os.path.join(self.dir, name), encoding="utf-8") as f:
                self._cache[name] = f.read()
        return self._cache[name]

    def render(self, name, ctx):
        return render_string(self.source(name), ctx)


def _lookup(ctx, key):
    cur = ctx
    for part in key.split("."):
        if isinstance(cur, dict):
            cur = cur.get(part)
        else:
            cur = getattr(cur, part, None)
        if cur is None:
            return None
    return cur


def render_string(src, ctx):
    def do_if(m):
        val = _lookup(ctx, m.group(1))
        return render_string(m.group(2), ctx) if val else ""
    out = _IF.sub(do_if, src)

    def do_var(m):
        raw_key, esc_key = m.group(1), m.group(2)
        if raw_key:
            val = _lookup(ctx, raw_key)
            return "" if val is None else str(val)
        val = _lookup(ctx, esc_key)
        return esc("" if val is None else val)
    return _VAR.sub(do_var, out)


def jsonld(obj):
    return '<script type="application/ld+json">%s</script>' % json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")


def breadcrumb_jsonld(items, site_url):
    """items: [(이름, 경로)], 경로는 '/housing/' 형태(또는 None=현재 페이지)."""
    return jsonld({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            dict({"@type": "ListItem", "position": i + 1, "name": name},
                 **({"item": site_url + path} if path else {}))
            for i, (name, path) in enumerate(items)
        ],
    })


def breadcrumb_html(items, url):
    """items: [(이름, 경로|None)]. 마지막 항목은 현재 페이지."""
    parts = []
    for name, path in items:
        if path:
            parts.append('<a href="%s">%s</a>' % (url(path), esc(name)))
        else:
            parts.append('<span aria-current="page">%s</span>' % esc(name))
    return '<nav class="crumbs" aria-label="현재 위치">%s</nav>' % ' <span aria-hidden="true">›</span> '.join(parts)


BOOKMARK_SVG = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                'stroke-width="1.6"><path d="M6 4h12v17l-6-4-6 4z"/></svg>')


def poster(n, cat_conf, extra=""):
    text = n["poster_text"] or n["title"]
    klass = "" if n["poster_text"] else " auto"
    lines = "<br>".join(esc(line) for line in text.split("\n"))
    bottom = n["place"] + (" · " + n["host"] if n["host"] else "")
    return ('<div class="poster %s %s"><span class="poster-top">%s</span><h3 class="poster-text%s">%s</h3>'
            '<span class="poster-bottom">%s</span><span class="poster-art" aria-hidden="true">%s</span></div>'
            % (n["cat"], extra, esc(cat_conf["en"]), klass, lines, esc(bottom), esc(n["icon"])))


def card(n, cat_conf, url):
    """목록·홈 카드. 본문 텍스트가 HTML에 그대로 들어가 JS 없이도 읽힌다."""
    href = url(n["url"])
    facts = [("지역", n["place"]), ("대상", n["target"]), ("혜택", n["benefit"])]
    facts_html = "".join("<dt>%s</dt><dd>%s</dd>" % (esc(k), esc(v)) for k, v in facts)
    badge_class = {"urgent": "urgent", "closed": "closed"}.get(n["status"], "")
    checked = n["checked_at"].isoformat() if n["checked_at"] else "확인일 미기재"
    return (
        '<article class="card status-%s" data-slug="%s" data-cat="%s" data-free="%s" data-soon="%s" '
        'data-days="%s" data-title="%s">'
        '<a class="poster-link" href="%s" aria-label="%s 상세 보기">%s</a>'
        '<button class="save-btn" type="button" data-save="%s" data-title="%s" data-cat="%s" data-url="%s" data-icon="%s" '
        'aria-label="%s 보관함에 저장" aria-pressed="false">%s</button>'
        '<div class="card-content"><div class="card-meta"><span class="category-tag">%s</span>'
        '<span class="deadline %s">%s</span></div>'
        '<a class="card-title" href="%s">%s</a>'
        '<dl class="facts">%s</dl>'
        '<div class="card-bottom"><span>%s · %s 확인</span><span>자세히 ↗</span></div></div></article>'
        % (n["status"], esc(n["slug"]), n["cat"], "1" if n["free"] else "0",
           "1" if n["status"] == "urgent" else "0",
           n["d_day"] if n["d_day"] is not None else 9999, esc(n["title"]),
           href, esc(n["title"]), poster(n, cat_conf),
           esc(n["slug"]), esc(n["title"]), esc(n["cat_name"]), href, esc(n["icon"]),
           esc(n["title"]), BOOKMARK_SVG,
           esc(n["cat_name"]), badge_class, esc(n["status_label"]),
           href, esc(n["title"]), facts_html,
           esc(n["source"]), esc(checked))
    )


def pagination(base_path, page, total_pages, url):
    if total_pages <= 1:
        return ""
    def page_path(p):
        return base_path if p == 1 else "%spage/%d/" % (base_path, p)
    items = []
    if page > 1:
        items.append('<a class="page-link" rel="prev" href="%s">‹ 이전</a>' % url(page_path(page - 1)))
    for p in range(1, total_pages + 1):
        if p == page:
            items.append('<span class="page-link current" aria-current="page">%d</span>' % p)
        else:
            items.append('<a class="page-link" href="%s">%d</a>' % (url(page_path(p)), p))
    if page < total_pages:
        items.append('<a class="page-link" rel="next" href="%s">다음 ›</a>' % url(page_path(page + 1)))
    return '<nav class="pagination" aria-label="페이지 이동">%s</nav>' % "".join(items)


def ad_slot(adsense, slot_key, label="광고"):
    """승인 후 enabled=true 이고 단위 ID가 있을 때만 광고 단위를 넣는다. 자동 광고는 쓰지 않는다."""
    if not adsense.get("enabled") or not adsense.get("client"):
        return ""
    slot = (adsense.get("slots") or {}).get(slot_key)
    if not slot:
        return ""
    return ('<aside class="ad-slot" aria-label="%s"><span class="ad-label">%s</span>'
            '<ins class="adsbygoogle" style="display:block" data-ad-client="%s" data-ad-slot="%s" '
            'data-ad-format="auto" data-full-width-responsive="true"></ins>'
            '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></aside>'
            % (esc(label), esc(label), esc(adsense["client"]), esc(slot)))


def truncate(text, limit):
    text = re.sub(r"\s+", " ", text or "").strip()
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"
