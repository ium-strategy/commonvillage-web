"""공고 데이터 읽기·정규화·상태 계산.

데이터 출처
- data/sheet/notices.csv      운영자 직접 입력(구글 시트 CSV)
- data/sheet/commentary.csv   커먼빌리지 해설(승인된 것만 게시)
- data/raw/youthcenter/latest.json  온통청년 API 원본(필드 매핑이 설정된 경우에만 사용)
"""
import csv
import datetime as dt
import json
import logging
import os
import re

log = logging.getLogger("cv.data")

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE_RE = re.compile(r"^(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})\.?$")

CATEGORY_ORDER = ["housing", "support", "play", "challenge"]
CATEGORY_ALIASES = {
    "housing": "housing", "살 곳": "housing", "살곳": "housing", "주거": "housing",
    "support": "support", "지원받을 곳": "support", "지원받을곳": "support", "지원": "support",
    "play": "play", "즐길 곳": "play", "즐길곳": "play", "문화": "play",
    "challenge": "challenge", "도전할 곳": "challenge", "도전할곳": "challenge", "도전": "challenge",
}

# (slug, 표시 이름, 별칭들)
REGIONS = [
    ("nationwide", "전국", ["전국", "온라인", "전국 · 온라인", "해당없음", "전체"]),
    ("seoul", "서울", ["서울특별시", "서울시"]),
    ("busan", "부산", ["부산광역시", "부산시"]),
    ("daegu", "대구", ["대구광역시", "대구시"]),
    ("incheon", "인천", ["인천광역시", "인천시"]),
    ("gwangju", "광주", ["광주광역시", "광주시"]),
    ("daejeon", "대전", ["대전광역시", "대전시"]),
    ("ulsan", "울산", ["울산광역시", "울산시"]),
    ("sejong", "세종", ["세종특별자치시", "세종시"]),
    ("gyeonggi", "경기", ["경기도"]),
    ("gangwon", "강원", ["강원도", "강원특별자치도"]),
    ("chungbuk", "충북", ["충청북도"]),
    ("chungnam", "충남", ["충청남도"]),
    ("jeonbuk", "전북", ["전라북도", "전북특별자치도"]),
    ("jeonnam", "전남", ["전라남도"]),
    ("gyeongbuk", "경북", ["경상북도"]),
    ("gyeongnam", "경남", ["경상남도"]),
    ("jeju", "제주", ["제주도", "제주특별자치도"]),
]
REGION_BY_SLUG = {slug: name for slug, name, _ in REGIONS}
_REGION_LOOKUP = {}
for _slug, _name, _aliases in REGIONS:
    _REGION_LOOKUP[_name] = _slug
    _REGION_LOOKUP[_slug] = _slug
    for _a in _aliases:
        _REGION_LOOKUP[_a] = _slug

DEADLINE_TYPES = {
    "상시": "year-round", "연중": "year-round", "year-round": "year-round",
    "선착순": "first-come", "first-come": "first-come",
    "예산소진": "budget", "예산 소진": "budget", "budget": "budget",
    "미확인": "unknown", "unknown": "unknown", "": "unknown",
}

UNVERIFIED = "원문 확인 필요"


def today_kst():
    return (dt.datetime.utcnow() + dt.timedelta(hours=9)).date()


def parse_date(value):
    """'2026-03-01', '2026.3.1', '2026/03/01' 을 date로. 실패하면 None."""
    if not value:
        return None
    m = DATE_RE.match(str(value).strip())
    if not m:
        return None
    try:
        return dt.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    except ValueError:
        return None


def region_slug(value):
    v = (value or "").strip()
    if not v:
        return None
    if v in _REGION_LOOKUP:
        return _REGION_LOOKUP[v]
    # "서울 성수", "경기 수원"처럼 시·도 뒤에 세부 지역이 붙은 경우
    head = re.split(r"[\s·,/]+", v)[0]
    return _REGION_LOOKUP.get(head)


def category_key(value):
    return CATEGORY_ALIASES.get((value or "").strip())


def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def yes(value):
    return clean(value).lower() in ("y", "yes", "true", "1", "o", "예", "무료", "네")


# --------------------------------------------------------------------------
# CSV 읽기
# --------------------------------------------------------------------------

def read_csv(path):
    if not os.path.exists(path):
        log.warning("파일 없음: %s", path)
        return []
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    return [{clean(k): (v if v is not None else "") for k, v in r.items()} for r in rows]


def load_sheet_notices(path):
    """운영자 시트(notices.csv) → 정규화 전 공통 dict 목록."""
    out = []
    for i, r in enumerate(read_csv(path), start=2):
        if not any(clean(v) for v in r.values()):
            continue
        deadline_type_raw = clean(r.get("마감유형"))
        status_raw = clean(r.get("상태"))
        out.append({
            "slug": clean(r.get("slug")).lower(),
            "title": clean(r.get("제목")),
            "category": r.get("카테고리"),
            "region": r.get("지역"),
            "area": clean(r.get("세부지역")),
            "target": clean(r.get("대상")),
            "start": r.get("시작일"),
            "deadline": r.get("마감일"),
            "deadline_type": DEADLINE_TYPES.get(deadline_type_raw, "unknown"),
            "closed_flag": status_raw in ("마감", "closed", "종료"),
            "benefit": clean(r.get("혜택")),
            "self_pay": clean(r.get("본인부담")),
            "how": clean(r.get("신청방법")),
            "source_url": clean(r.get("원문링크")),
            "host": clean(r.get("주관기관")),
            "source": clean(r.get("출처")) or "직접 입력",
            "checked_at": r.get("마지막확인일"),
            "summary": clean(r.get("요약")),
            "poster_text": (r.get("포스터문구") or "").strip(),
            "icon": clean(r.get("아이콘")),
            "free": yes(r.get("무료")),
            "note": clean(r.get("비고")),
            "_where": "notices.csv %d행" % i,
        })
    return out


def load_commentary(path):
    """commentary.csv → {slug: {"text","date","reviewer"}} (승인된 것만)."""
    approved = {}
    for i, r in enumerate(read_csv(path), start=2):
        slug = clean(r.get("slug")).lower()
        text = (r.get("해설") or "").strip()
        status = clean(r.get("상태"))
        if not slug or not text:
            continue
        if status not in ("승인", "approved"):
            log.info("해설 미게시(상태=%s): %s", status or "없음", slug)
            continue
        approved[slug] = {
            "text": text,
            "date": parse_date(r.get("작성일")),
            "reviewer": clean(r.get("검수자")),
        }
    return approved


# --------------------------------------------------------------------------
# 온통청년 API 원본 → 공통 dict
# --------------------------------------------------------------------------

def _dig(obj, path):
    cur = obj
    for key in [p for p in path.split(".") if p]:
        if isinstance(cur, dict):
            cur = cur.get(key)
        elif isinstance(cur, list) and key.isdigit():
            cur = cur[int(key)] if int(key) < len(cur) else None
        else:
            return None
    return cur


def slugify_id(prefix, raw_id):
    s = re.sub(r"[^a-z0-9]+", "-", str(raw_id).lower()).strip("-")
    return "%s-%s" % (prefix, s) if s else None


def load_youthcenter(yc_config, raw_dir):
    """data/raw/youthcenter/latest.json 을 field_map 으로 읽는다. 설정이 비어 있으면 빈 목록."""
    if not yc_config.get("enabled"):
        log.info("온통청년 연동 비활성(config/youthcenter.json enabled=false). 건너뜀.")
        return []
    fmap = yc_config.get("field_map") or {}
    if not fmap.get("id") or not fmap.get("title"):
        log.warning("온통청년 field_map 이 비어 있어 건너뜀. 제공목록 확인 후 config/youthcenter.json 을 채우세요.")
        return []
    latest = os.path.join(raw_dir, "latest.json")
    if not os.path.exists(latest):
        log.warning("온통청년 원본 없음: %s (scripts/fetch_youthcenter.py 를 먼저 실행)", latest)
        return []
    with open(latest, encoding="utf-8") as f:
        raw = json.load(f)
    items = _dig(raw, yc_config.get("items_path", "")) if yc_config.get("items_path") else raw
    if isinstance(items, dict):
        items = list(items.values())
    if not isinstance(items, list):
        log.warning("온통청년 items_path 로 목록을 찾지 못함: %s", yc_config.get("items_path"))
        return []
    cmap = yc_config.get("category_map") or {}
    fetched_at = parse_date(raw.get("_fetched_at")) if isinstance(raw, dict) else None
    out, skipped = [], 0
    for it in items:
        if not isinstance(it, dict):
            continue
        g = lambda key: clean(it.get(fmap.get(key, ""), "")) if fmap.get(key) else ""
        field = g("field")
        cat = cmap.get(field)
        if not cat:
            skipped += 1
            continue
        slug = slugify_id("yc", g("id"))
        if not slug:
            continue
        out.append({
            "slug": slug, "title": g("title"), "category": cat,
            "region": g("region") or "전국", "area": "",
            "target": g("target"), "start": g("start"), "deadline": g("deadline"),
            "deadline_type": "unknown", "closed_flag": False,
            "benefit": g("benefit"), "self_pay": g("self_pay"), "how": g("how"),
            "source_url": g("source_url"), "host": g("host"),
            "source": "온통청년", "checked_at": fetched_at,
            "summary": "", "poster_text": "", "icon": "", "free": False, "note": "",
            "_where": "youthcenter %s" % g("id"),
        })
    if skipped:
        log.warning("온통청년 정책 %d건은 category_map 에 분야가 없어 제외됨", skipped)
    return out


# --------------------------------------------------------------------------
# 정규화 + 상태
# --------------------------------------------------------------------------

def normalize(raw, config, commentary, today):
    """공통 dict → 화면용 공고. 필수값이 없으면 None(건너뜀)."""
    where = raw.get("_where", "?")
    slug = raw.get("slug") or ""
    if not SLUG_RE.match(slug):
        log.warning("건너뜀(%s): slug 형식 오류 '%s' (소문자 영문·숫자·하이픈만)", where, slug)
        return None
    cat = category_key(raw.get("category"))
    if not cat:
        log.warning("건너뜀(%s): 카테고리 알 수 없음 '%s'", where, raw.get("category"))
        return None
    if not raw.get("title"):
        log.warning("건너뜀(%s): 제목 없음", where)
        return None
    rslug = region_slug(raw.get("region"))
    if not rslug:
        log.warning("건너뜀(%s): 지역 알 수 없음 '%s'", where, raw.get("region"))
        return None

    start = parse_date(raw.get("start"))
    deadline = parse_date(raw.get("deadline"))
    checked = raw.get("checked_at") if isinstance(raw.get("checked_at"), dt.date) else parse_date(raw.get("checked_at"))
    dtype = "date" if deadline else (raw.get("deadline_type") or "unknown")
    urgent = int(config.get("urgent_days", 7))

    # 상태: closed / open / urgent / year-round / unknown-deadline
    d_day = None
    if raw.get("closed_flag") or (deadline and deadline < today):
        status, label = "closed", "마감"
    elif dtype == "year-round":
        status, label = "year-round", "상시"
    elif deadline:
        d_day = (deadline - today).days
        if d_day <= urgent:
            status, label = "urgent", "마감 임박 D-%d" % d_day if d_day > 0 else "마감 임박 D-DAY"
        else:
            status, label = "open", "모집 중"
    elif dtype == "first-come":
        status, label = "open", "선착순 마감"
    elif dtype == "budget":
        status, label = "open", "예산 소진 시 마감"
    else:
        status, label = "open", "마감일 원문 확인"

    cm = commentary.get(slug)
    cat_conf = config["categories"][cat]
    region_name = REGION_BY_SLUG[rslug]
    place = region_name if rslug != "nationwide" else "전국"
    if raw.get("area"):
        place = "%s %s" % (region_name, raw["area"]) if rslug != "nationwide" else raw["area"]

    target = raw.get("target") or UNVERIFIED
    benefit = raw.get("benefit") or UNVERIFIED
    summary = raw.get("summary") or _auto_summary(target, benefit, raw.get("title"))

    if deadline:
        period = ("%s ~ %s" % (start.isoformat(), deadline.isoformat())) if start else ("~ %s" % deadline.isoformat())
    elif dtype == "year-round":
        period = "상시 모집"
    elif dtype == "first-come":
        period = "선착순 마감 (원문 확인)"
    elif dtype == "budget":
        period = "예산 소진 시 마감 (원문 확인)"
    else:
        period = UNVERIFIED
    if start and not deadline and dtype != "year-round":
        period = "%s ~ (마감일 %s)" % (start.isoformat(), UNVERIFIED)

    indexed = bool(cm) and bool(raw.get("source_url"))
    return {
        "slug": slug, "title": raw["title"], "cat": cat, "cat_name": cat_conf["name"],
        "region": rslug, "region_name": region_name, "area": raw.get("area") or "", "place": place,
        "target": target, "benefit": benefit,
        "self_pay": raw.get("self_pay") or UNVERIFIED,
        "how": raw.get("how") or "", "source_url": raw.get("source_url") or "",
        "host": raw.get("host") or "", "source": raw.get("source") or "직접 입력",
        "checked_at": checked, "start": start, "deadline": deadline, "deadline_type": dtype,
        "period": period, "status": status, "status_label": label, "d_day": d_day,
        "summary": summary, "poster_text": raw.get("poster_text") or "",
        "icon": raw.get("icon") or cat_conf["icon"], "free": bool(raw.get("free")),
        "note": raw.get("note") or "",
        "commentary": cm["text"] if cm else "", "commentary_date": cm["date"] if cm else None,
        "indexed": indexed,
        "url": "/p/%s/" % slug,
    }


def _auto_summary(target, benefit, title):
    t = "" if target == UNVERIFIED else target
    b = "" if benefit == UNVERIFIED else benefit
    if t and b:
        return "%s에게 %s" % (t, b)
    if b:
        return b
    if t:
        return "%s 대상 · 혜택은 원문 확인" % t
    return "대상과 혜택은 주관기관 원문에서 확인해 주세요"


def sort_key(n):
    """모집 중(마감 빠른순, 마감일 없는 것은 뒤) → 상시 → 마감(최근 확인순)."""
    rank = {"urgent": 0, "open": 0, "year-round": 1, "closed": 2}[n["status"]]
    if n["status"] in ("open", "urgent"):
        second = n["deadline"].toordinal() if n["deadline"] else 10 ** 9
    elif n["status"] == "closed":
        second = -(n["deadline"].toordinal() if n["deadline"] else (n["checked_at"].toordinal() if n["checked_at"] else 0))
    else:
        second = 0
    return (rank, second, n["title"])


def load_all(root, config, yc_config, today):
    sheet_dir = os.path.join(root, "data", "sheet")
    commentary = load_commentary(os.path.join(sheet_dir, "commentary.csv"))
    raws = load_youthcenter(yc_config, os.path.join(root, "data", "raw", "youthcenter"))
    raws += load_sheet_notices(os.path.join(sheet_dir, "notices.csv"))  # 시트가 나중 → 같은 slug면 시트가 우선

    by_slug = {}
    for raw in raws:
        n = normalize(raw, config, commentary, today)
        if not n:
            continue
        if n["slug"] in by_slug:
            log.warning("slug 중복 '%s': %s 가 앞의 항목을 덮어씀", n["slug"], raw.get("_where"))
        by_slug[n["slug"]] = n

    unknown = sorted(set(commentary) - set(by_slug))
    if unknown:
        log.warning("해설은 있는데 공고가 없는 slug: %s", ", ".join(unknown))

    notices = sorted(by_slug.values(), key=sort_key)
    log.info("공고 %d건 (색인 대상 %d건, 모집 중 %d건)", len(notices),
             sum(1 for n in notices if n["indexed"]),
             sum(1 for n in notices if n["status"] != "closed"))
    return notices
