#!/usr/bin/env python3
"""커먼빌리지 정적 사이트 빌드.

    python build.py                 # dist/ 에 생성
    python build.py --out 폴더      # 다른 폴더에 생성
    python build.py --site-url https://도메인 --base-path ""   # 설정 덮어쓰기
    python build.py --today 2026-03-01                          # 상태 계산 기준일 지정(테스트용)

입력: config.json, config/youthcenter.json, data/sheet/*.csv, data/raw/youthcenter/latest.json,
      src/templates, src/css, src/js, src/content, src/static, brand/, legacy.html(+assets, data → /check/)
출력: 홈, 카테고리·지역 목록(30건씩 나눔), 공고 상세(/p/<slug>/), 가이드, 안내 페이지,
      sitemap.xml, robots.txt, notices.json, 404.html, (설정 시) ads.txt, CNAME
표준 라이브러리만 사용합니다.
"""
import argparse
import datetime as dt
import hashlib
import json
import logging
import os
import re
import shutil
import sys
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

from cv import data as cvdata  # noqa: E402
from cv.html import (Templates, esc, nl2p, card, poster, pagination, ad_slot, truncate,  # noqa: E402
                     breadcrumb_html, breadcrumb_jsonld, jsonld)

log = logging.getLogger("cv.build")
SRC = os.path.join(ROOT, "src")


# --------------------------------------------------------------------------
# 유틸
# --------------------------------------------------------------------------

def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def parse_content(path):
    """'키: 값' 머리말 + '---' + HTML 본문 형식의 수기 페이지."""
    src = read(path)
    head, sep, body = src.partition("\n---\n")
    if not sep:
        return {}, src
    meta = {}
    for line in head.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, body.strip()


def split_for_mid_ad(body):
    """가이드 본문을 중간 h2 앞에서 둘로 나눈다(광고 1개를 본문 중간에)."""
    positions = [m.start() for m in re.finditer(r"<h2[\s>]", body)]
    if len(positions) < 2:
        return body, ""
    cut = positions[len(positions) // 2]
    return body[:cut], body[cut:]


# --------------------------------------------------------------------------
# 빌드
# --------------------------------------------------------------------------

class Site:
    def __init__(self, args):
        self.config = json.load(open(os.path.join(ROOT, "config.json"), encoding="utf-8"))
        self.yc = json.load(open(os.path.join(ROOT, "config", "youthcenter.json"), encoding="utf-8"))
        self.out = os.path.abspath(args.out)
        self.today = cvdata.parse_date(args.today) if args.today else cvdata.today_kst()
        site_url = (args.site_url or self.config["site_url"]).rstrip("/")
        parts = urlsplit(site_url)
        self.origin = "%s://%s" % (parts.scheme, parts.netloc)
        self.base = args.base_path if args.base_path is not None else parts.path.rstrip("/")
        self.tpl = Templates(os.path.join(SRC, "templates"))
        self.cats = self.config["categories"]
        self.adsense = self.config.get("adsense") or {}
        css, js = read(os.path.join(SRC, "css", "site.css")), read(os.path.join(SRC, "js", "site.js"))
        self.asset_version = hashlib.sha1((css + js).encode("utf-8")).hexdigest()[:8]
        self.sitemap = []  # (경로, lastmod)
        self.notices = cvdata.load_all(ROOT, self.config, self.yc, self.today)
        self.guides = self.load_guides()

    # ----- 주소 -----
    def url(self, path):
        return self.base + path

    def abs(self, path):
        return self.origin + self.base + path

    # ----- 공통 머리말 -----
    def head_snippets(self):
        ads = ""
        if self.adsense.get("client"):
            ads = ('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=%s" '
                   'crossorigin="anonymous"></script>' % esc(self.adsense["client"]))
        ga = ""
        gid = (self.config.get("analytics") or {}).get("ga4_id")
        if gid:
            ga = ('<script async src="https://www.googletagmanager.com/gtag/js?id=%s"></script>'
                  '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}'
                  'gtag("js",new Date());gtag("config","%s");</script>' % (esc(gid), esc(gid)))
        return ads, ga

    def page(self, path, content, title, description, kind, noindex=False, og_image=None,
             og_type="website", jsonld_html="", lastmod=None, og_title=None):
        """base.html 로 감싸서 파일로 저장. 색인 대상이면 사이트맵에 추가."""
        ads, ga = self.head_snippets()
        op = self.config["operator"]
        html = self.tpl.render("base.html", {
            "title": title, "description": truncate(description, 160), "canonical": self.abs(path),
            "noindex": noindex, "og_type": og_type, "og_title": og_title or title,
            "og_image": og_image or self.abs("/assets/og/default.png"),
            "site_name": self.config["site_name"], "base": self.base, "asset_version": self.asset_version,
            "head_extra": "", "jsonld": jsonld_html, "adsense_head": ads, "analytics_head": ga,
            "page_kind": kind, "content": content,
            "operator_name": op["name"], "operator_name_en": op.get("name_en", ""),
            "operator_email": op.get("email", ""), "business_info": op.get("business_info", ""),
            "year": self.today.year, "build_date": self.today.isoformat(),
        })
        target = os.path.join(self.out, path.strip("/"), "index.html") if path.endswith("/") else os.path.join(self.out, path.strip("/"))
        write(target, html)
        if not noindex:
            self.sitemap.append((path, (lastmod or self.today).isoformat()))

    # ----- 조각 -----
    def crumbs(self, items):
        return breadcrumb_html(items, self.url), breadcrumb_jsonld([(n, p) for n, p in items], self.origin + self.base)

    def filters(self, with_open=True):
        chips = [("all", "전체"), ("free", "참가비 없음"), ("soon", "마감 임박")]
        if with_open:
            chips.insert(1, ("open", "모집 중"))
        html = "".join('<button class="chip%s" type="button" data-filter="%s" aria-pressed="%s">%s</button>'
                       % (" active" if k == "all" else "", k, "true" if k == "all" else "false", esc(v)) for k, v in chips)
        return ('<div class="filters" aria-label="공고 필터">%s<select class="filter-select" id="sortSelect" aria-label="공고 정렬">'
                '<option value="default">기본순</option><option value="deadline">마감 빠른순</option>'
                '<option value="title">이름순</option></select></div>' % html)

    def cards(self, notices):
        return "".join(card(n, self.cats[n["cat"]], self.url) for n in notices)

    def og_for(self, cat):
        return self.abs("/assets/og/%s.png" % cat)

    # ----- 페이지들 -----
    def build_home(self):
        open_n = [n for n in self.notices if n["status"] != "closed"]
        picks = open_n[: self.config.get("home_card_count", 8)]
        if not picks:
            summary = "지금 모집 중인 공고를 확인하고 있어요. 최근 공고는 전체 공고에서 볼 수 있어요."
            picks = self.notices[: self.config.get("home_card_count", 8)]
        else:
            summary = "모집 중인 공고 %d건 중 마감이 가까운 순으로 보여드려요." % len(open_n)
        cat_links = "".join(
            '<a class="category" href="%s"><span class="cat-icon" aria-hidden="true">%s</span><span><strong>%s</strong><small>%s</small></span></a>'
            % (self.url("/%s/" % k), esc(c["icon"]), esc(c["name"]), esc(c["sub"])) for k, c in self.cats.items())
        content = self.tpl.render("home.html", {
            "base": self.base, "category_links": cat_links, "summary_text": summary,
            "filters": self.filters(with_open=False), "cards": self.cards(picks),
            "operator_name": self.config["operator"]["name"],
        })
        self.page("/", content, "%s — %s" % (self.config["site_name"], self.config["site_tagline"]),
                  self.config["default_description"], "home",
                  jsonld_html=jsonld({"@context": "https://schema.org", "@type": "WebSite", "name": self.config["site_name"],
                                      "url": self.abs("/"), "potentialAction": {"@type": "SearchAction",
                                      "target": self.abs("/search/?q={search_term_string}"), "query-input": "required name=search_term_string"}}))

    def build_list(self, base_path, notices, heading, overline, description, crumb_items, title, og_image=None,
                   sub_links="", sub_links_label="", empty_text=""):
        per = int(self.config.get("per_page", 30))
        total_pages = max(1, (len(notices) + per - 1) // per)
        for p in range(1, total_pages + 1):
            path = base_path if p == 1 else "%spage/%d/" % (base_path, p)
            chunk = notices[(p - 1) * per: p * per]
            crumbs_html, crumbs_ld = self.crumbs(crumb_items + ([("%d페이지" % p, None)] if p > 1 else []))
            open_count = sum(1 for n in notices if n["status"] != "closed")
            count_text = "전체 %d건 · 모집 중 %d건" % (len(notices), open_count) + (" · %d/%d페이지" % (p, total_pages) if total_pages > 1 else "")
            content = self.tpl.render("list.html", {
                "crumbs": crumbs_html, "overline": overline, "heading": heading if p == 1 else "%s (%d페이지)" % (heading, p),
                "description": description, "count_text": count_text,
                "sub_links": sub_links, "sub_links_label": sub_links_label,
                "filters": self.filters() if chunk else "", "cards": self.cards(chunk),
                "empty_text": empty_text if not chunk else "",
                "pagination": pagination(base_path, p, total_pages, self.url),
                "ad": ad_slot(self.adsense, "list"),
            })
            page_title = title if p == 1 else "%s %d페이지 | %s" % (heading, p, self.config["site_name"])
            self.page(path, content, page_title, description, "list", og_image=og_image, jsonld_html=crumbs_ld)

    def region_links(self, notices, current=None):
        counts = {}
        for n in notices:
            counts[n["region"]] = counts.get(n["region"], 0) + 1
        links = []
        for slug, name, _ in cvdata.REGIONS:
            if slug in counts:
                links.append('<a href="%s"%s>%s %d</a>' % (self.url("/region/%s/" % slug),
                             ' aria-current="page"' if slug == current else "", esc(name), counts[slug]))
        return "".join(links)

    def build_lists(self):
        site = self.config["site_name"]
        self.build_list("/notices/", self.notices, "전체 공고", "ALL NOTICES",
                        "살 곳·지원받을 곳·즐길 곳·도전할 곳 네 카테고리의 청년 공고를 모두 모았습니다. 모집 중인 공고를 마감이 가까운 순으로 먼저 보여드립니다.",
                        [("홈", "/"), ("전체 공고", None)], "전체 청년 공고 목록 | %s" % site,
                        sub_links=self.region_links(self.notices), sub_links_label="지역별 보기",
                        empty_text="아직 등록된 공고가 없어요.")
        for key, c in self.cats.items():
            items = [n for n in self.notices if n["cat"] == key]
            self.build_list("/%s/" % key, items, c["name"], c["en"], c["description"],
                            [("홈", "/"), (c["name"], None)], "%s 청년 공고 — %s | %s" % (c["name"], c["sub"], site),
                            og_image=self.og_for(key), sub_links=self.region_links(items), sub_links_label="지역별 보기",
                            empty_text="%s 공고를 준비하고 있어요." % c["name"])
        # 지역
        by_region = {}
        for n in self.notices:
            by_region.setdefault(n["region"], []).append(n)
        for slug, name, _ in cvdata.REGIONS:
            items = by_region.get(slug)
            if not items:
                continue
            label = "전국·온라인" if slug == "nationwide" else name
            desc = ("지역 제한 없이 신청할 수 있거나 온라인으로 진행되는 청년 공고입니다." if slug == "nationwide"
                    else "%s 지역에서 모집하거나 %s 거주 청년이 신청할 수 있는 공고입니다." % (name, name)) + \
                   " 주거, 지원금·교육, 문화·체험, 공모전을 한 곳에서 확인하고, 자격과 일정은 주관기관 원문에서 다시 확인해 주세요."
            self.build_list("/region/%s/" % slug, items, "%s 청년 공고" % label, "REGION", desc,
                            [("홈", "/"), ("지역별 공고", "/region/"), (label, None)],
                            "%s 청년 공고 — 주거·지원·문화·공모전 | %s" % (label, site),
                            sub_links=self.region_links(self.notices, current=slug), sub_links_label="다른 지역")
        crumbs_html, crumbs_ld = self.crumbs([("홈", "/"), ("지역별 공고", None)])
        items_html = "".join('<li><a href="%s"><strong>%s</strong><span>공고 %d건</span></a></li>'
                             % (self.url("/region/%s/" % slug), esc("전국·온라인" if slug == "nationwide" else name), len(by_region[slug]))
                             for slug, name, _ in cvdata.REGIONS if slug in by_region)
        content = ('<div class="wrap content-page">%s<div class="list-head"><div class="overline">REGION</div><h1>지역별 청년 공고</h1>'
                   '<p class="list-desc">시·도별로 모집하는 공고와 전국 어디서나 신청할 수 있는 공고를 나눠 보여드립니다.</p></div>'
                   '<ul class="guide-list region-list">%s</ul></div>' % (crumbs_html, items_html or '<li><span>등록된 공고가 없어요.</span></li>'))
        self.page("/region/", content, "지역별 청년 공고 | %s" % site, "시·도별 청년 주거·지원·문화·공모전 공고 목록.", "list", jsonld_html=crumbs_ld)

    def related(self, n):
        same_cat = [x for x in self.notices if x["cat"] == n["cat"] and x["slug"] != n["slug"]]
        ranked = sorted(same_cat, key=lambda x: (x["status"] == "closed", x["region"] != n["region"], cvdata.sort_key(x)))
        picks = ranked[:3]
        if len(picks) < 3:
            others = [x for x in self.notices if x["slug"] != n["slug"] and x not in picks and x["status"] != "closed"]
            picks += others[: 3 - len(picks)]
        return picks

    def build_notices(self):
        site = self.config["site_name"]
        attribution = (self.config.get("youthcenter") or {}).get("attribution", "")
        for n in self.notices:
            c = self.cats[n["cat"]]
            region_label = "전국·온라인" if n["region"] == "nationwide" else n["region_name"]
            crumb_items = [("홈", "/"), (c["name"], "/%s/" % n["cat"]), (region_label, "/region/%s/" % n["region"]), (n["title"], None)]
            crumbs_html, crumbs_ld = self.crumbs(crumb_items)
            related = self.related(n)
            commentary_html = nl2p(n["commentary"]) if n["commentary"] else ""
            cm_meta = ""
            if n["commentary"]:
                cm_meta = "운영자가 원문을 읽고 정리한 해설입니다." + (" 작성 %s" % n["commentary_date"].isoformat() if n["commentary_date"] else "")
            content = self.tpl.render("notice.html", {
                "base": self.base, "slug": n["slug"], "crumbs": crumbs_html, "cat": n["cat"], "cat_name": n["cat_name"],
                "badge_class": {"urgent": "urgent", "closed": "closed"}.get(n["status"], ""),
                "status_label": n["status_label"], "free": n["free"], "title": n["title"], "summary": n["summary"],
                "target": n["target"], "place": n["place"], "period": n["period"], "benefit": n["benefit"],
                "self_pay": n["self_pay"], "how": n["how"] or cvdata.UNVERIFIED, "host": n["host"], "note": n["note"],
                "commentary_html": commentary_html, "commentary_meta": cm_meta, "no_commentary": not n["commentary"],
                "source_url": n["source_url"], "no_source": not n["source_url"],
                "checked_at": n["checked_at"].isoformat() if n["checked_at"] else "미기재", "source": n["source"],
                "attribution": attribution if n["source"] == "온통청년" else "",
                "closed": n["status"] == "closed", "url": self.url(n["url"]), "icon": n["icon"],
                "related_heading": "함께 볼 만한 %s 공고" % c["name"], "related_cards": self.cards(related),
                "ad": ad_slot(self.adsense, "notice"),
            })
            deadline_txt = n["deadline"].isoformat() if n["deadline"] else n["period"]
            desc = "%s 대상. 혜택: %s. 신청 기간: %s. 지역: %s. 자격과 일정은 주관기관 공고 기준." % (
                n["target"], n["benefit"], deadline_txt, n["place"])
            title = "%s 신청 자격·기간·혜택 | %s" % (truncate(n["title"], 38), site)
            self.page(n["url"], content, title, truncate(desc, 125), "notice", noindex=not n["indexed"],
                      og_image=self.og_for(n["cat"]), og_type="article", jsonld_html=crumbs_ld,
                      lastmod=n["commentary_date"] or n["checked_at"], og_title=n["title"])

    # ----- 가이드·안내 -----
    def load_guides(self):
        gdir = os.path.join(SRC, "content", "guides")
        guides = []
        if os.path.isdir(gdir):
            for fn in sorted(os.listdir(gdir)):
                if not fn.endswith(".html"):
                    continue
                meta, body = parse_content(os.path.join(gdir, fn))
                slug = meta.get("slug") or fn[:-5]
                if not cvdata.SLUG_RE.match(slug):
                    log.warning("가이드 slug 형식 오류, 건너뜀: %s", fn)
                    continue
                guides.append({"slug": slug, "meta": meta, "body": body, "path": "/guide/%s/" % slug})
        return guides

    def guide_items(self, exclude=None):
        return "".join('<li><a href="%s"><strong>%s</strong><span>%s</span></a></li>'
                       % (self.url(g["path"]), esc(g["meta"].get("heading") or g["meta"].get("title", g["slug"])),
                          esc(g["meta"].get("description", "")))
                       for g in self.guides if g["slug"] != exclude)

    def build_guides(self):
        site = self.config["site_name"]
        for g in self.guides:
            m = g["meta"]
            heading = m.get("heading") or m.get("title", g["slug"])
            crumbs_html, crumbs_ld = self.crumbs([("홈", "/"), ("가이드", "/guide/"), (heading, None)])
            top, bottom = split_for_mid_ad(g["body"])
            content = self.tpl.render("guide.html", {
                "crumbs": crumbs_html, "heading": heading, "lead": m.get("lead", ""), "body_top": top, "body_bottom": bottom,
                "ad_mid": ad_slot(self.adsense, "guide_mid") if bottom else "", "ad_end": ad_slot(self.adsense, "guide_end"),
                "updated": m.get("updated", ""), "more_guides": self.guide_items(exclude=g["slug"]),
            })
            self.page(g["path"], content, "%s | %s" % (m.get("title", heading), site), m.get("description", ""), "guide",
                      og_type="article", jsonld_html=crumbs_ld, lastmod=cvdata.parse_date(m.get("updated")))
        crumbs_html, crumbs_ld = self.crumbs([("홈", "/"), ("가이드", None)])
        content = self.tpl.render("guide_index.html", {"crumbs": crumbs_html, "items": self.guide_items() or '<li><span>가이드를 준비하고 있어요.</span></li>'})
        self.page("/guide/", content, "공고 읽는 법과 준비 가이드 | %s" % site,
                  "청년 지원 공고의 조건을 읽는 법, 서류 준비, 신청 전 확인할 점을 정리한 안내 글.", "guide", jsonld_html=crumbs_ld)

    def build_pages(self):
        pdir = os.path.join(SRC, "content", "pages")
        site = self.config["site_name"]
        for fn in sorted(os.listdir(pdir)):
            if not fn.endswith(".html"):
                continue
            meta, body = parse_content(os.path.join(pdir, fn))
            slug = fn[:-5]
            heading = meta.get("heading") or meta.get("title", slug)
            crumbs_html, crumbs_ld = self.crumbs([("홈", "/"), (heading, None)])
            body = body.replace("{{ operator_email }}", esc(self.config["operator"].get("email", "")))
            body = body.replace("{{ base }}", self.base)
            content = self.tpl.render("page.html", {
                "crumbs": crumbs_html, "overline": meta.get("overline", ""), "heading": heading,
                "lead": meta.get("lead", ""), "body": body, "updated": meta.get("updated", ""),
            })
            self.page("/%s/" % slug, content, "%s | %s" % (meta.get("title", heading), site), meta.get("description", ""), "page",
                      jsonld_html=crumbs_ld, lastmod=cvdata.parse_date(meta.get("updated")))

    def build_misc(self):
        site = self.config["site_name"]
        crumbs_html, _ = self.crumbs([("홈", "/"), ("검색", None)])
        self.page("/search/", self.tpl.render("search.html", {"base": self.base, "crumbs": crumbs_html}),
                  "공고 검색 | %s" % site, "키워드·지역·대상으로 청년 공고 찾기.", "search", noindex=True)
        self.page("/404.html", self.tpl.render("404.html", {"base": self.base}), "페이지를 찾을 수 없어요 | %s" % site,
                  "요청한 주소에 페이지가 없습니다.", "notfound", noindex=True)

        # 검색용 색인
        index = [{
            "slug": n["slug"], "title": n["title"], "cat": n["cat_name"], "cat_key": n["cat"], "en": self.cats[n["cat"]]["en"],
            "region": n["region_name"], "area": n["area"], "place": n["place"], "target": n["target"], "benefit": n["benefit"],
            "host": n["host"], "summary": n["summary"], "status": n["status"], "status_label": n["status_label"],
            "icon": n["icon"], "url": self.url(n["url"]),
        } for n in self.notices]
        write(os.path.join(self.out, "notices.json"), json.dumps(index, ensure_ascii=False))

        # robots.txt / sitemap.xml / ads.txt / CNAME / .nojekyll
        robots = ["User-agent: *", "Disallow: %s/check/" % self.base, "Disallow: %s/search/" % self.base, "Allow: /", "",
                  "Sitemap: %s" % self.abs("/sitemap.xml"), ""]
        write(os.path.join(self.out, "robots.txt"), "\n".join(robots))
        urls = "".join("<url><loc>%s</loc><lastmod>%s</lastmod></url>\n" % (esc(self.abs(p)), lm) for p, lm in self.sitemap)
        write(os.path.join(self.out, "sitemap.xml"),
              '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % urls)
        if self.adsense.get("ads_txt"):
            write(os.path.join(self.out, "ads.txt"), self.adsense["ads_txt"].strip() + "\n")
        if self.config.get("cname"):
            write(os.path.join(self.out, "CNAME"), self.config["cname"].strip() + "\n")
        write(os.path.join(self.out, ".nojekyll"), "")

    def copy_assets(self):
        os.makedirs(os.path.join(self.out, "assets"), exist_ok=True)
        shutil.copyfile(os.path.join(SRC, "css", "site.css"), os.path.join(self.out, "assets", "site.css"))
        shutil.copyfile(os.path.join(SRC, "js", "site.js"), os.path.join(self.out, "assets", "site.js"))
        static = os.path.join(SRC, "static")
        if os.path.isdir(static):
            shutil.copytree(static, os.path.join(self.out, "assets"), dirs_exist_ok=True)
        for cat in list(self.cats) + ["default"]:
            if not os.path.exists(os.path.join(self.out, "assets", "og", "%s.png" % cat)):
                log.warning("공유 미리보기 이미지 없음: src/static/og/%s.png", cat)
        shutil.copytree(os.path.join(ROOT, "brand"), os.path.join(self.out, "brand"), dirs_exist_ok=True)

    def copy_check(self):
        """기존 1분 진단 앱(legacy.html)을 /check/ 에 그대로 둔다. 검색 노출 제외, 광고 없음."""
        legacy = os.path.join(ROOT, "legacy.html")
        if not os.path.exists(legacy):
            return
        html = read(legacy)
        html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">', 1)
        html = html.replace('<div id="app"></div>',
                            '<p style="margin:0;padding:10px 16px;background:#fff36b;font-size:12px;text-align:center">'
                            '1분 진단 체험판입니다. 공고 목록은 <a href="%s/" style="font-weight:700">커먼빌리지 홈</a>에서 확인하세요.</p>'
                            '<div id="app"></div>' % self.base, 1)
        write(os.path.join(self.out, "check", "index.html"), html)
        for d in ("assets", "data", "brand"):
            src = os.path.join(ROOT, d)
            if os.path.isdir(src):
                shutil.copytree(src, os.path.join(self.out, "check", d), dirs_exist_ok=True)

    def run(self):
        if os.path.isdir(self.out):
            shutil.rmtree(self.out)
        os.makedirs(self.out)
        self.copy_assets()
        self.build_home()
        self.build_lists()
        self.build_notices()
        self.build_guides()
        self.build_pages()
        self.build_misc()
        self.copy_check()
        pages = sum(1 for _, _, files in os.walk(self.out) for x in files if x.endswith(".html"))
        log.info("완료: %s (HTML %d개, 사이트맵 %d개, 기준일 %s, 주소 %s)", self.out, pages,
                 len(self.sitemap), self.today.isoformat(), self.origin + self.base)


def main():
    ap = argparse.ArgumentParser(description="커먼빌리지 정적 사이트 빌드")
    ap.add_argument("--out", default=os.path.join(ROOT, "dist"))
    ap.add_argument("--site-url", default=None)
    ap.add_argument("--base-path", default=None, help='예: "" 또는 "/commonvillage-web"')
    ap.add_argument("--today", default=None, help="YYYY-MM-DD")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO, format="%(levelname)s %(message)s")
    Site(args).run()


if __name__ == "__main__":
    main()
