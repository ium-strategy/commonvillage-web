#!/usr/bin/env python3
"""온통청년 오픈 API 전체를 받아 원본 그대로 보관하고, 전날과 비교해 신규·변경·종료를 기록합니다.

환경 변수
  YOUTHCENTER_API_KEY   인증키(저장소 비밀값으로만 보관. 코드·설정 파일에 넣지 않음)
설정
  config/youthcenter.json  endpoint, api_key_param, params, 페이징, items_path, field_map
출력
  data/raw/youthcenter/YYYY-MM-DD.json   그날 원본(되돌리기용)
  data/raw/youthcenter/latest.json       빌드가 읽는 최신 원본
  data/raw/youthcenter/changes-YYYY-MM-DD.json   전날 대비 신규·변경·사라진 정책 id
  data/raw/youthcenter/review-needed.json        API에서 사라진 정책(바로 삭제하지 않고 운영자 확인용)

필드명은 인증키 발급 후 제공목록을 보고 config/youthcenter.json 에 채웁니다. enabled=false 이거나
endpoint 가 비어 있으면 아무것도 하지 않습니다.
"""
import datetime as dt
import json
import os
import shutil
import sys
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw", "youthcenter")


def load_config():
    with open(os.path.join(ROOT, "config", "youthcenter.json"), encoding="utf-8") as f:
        return json.load(f)


def dig(obj, path):
    cur = obj
    for key in [p for p in path.split(".") if p]:
        cur = cur.get(key) if isinstance(cur, dict) else None
        if cur is None:
            return None
    return cur


def call(endpoint, params):
    url = endpoint + ("&" if "?" in endpoint else "?") + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "commonvillage-build/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        body = r.read().decode("utf-8")
    try:
        return json.loads(body)
    except ValueError:
        raise SystemExit("JSON 이 아닌 응답입니다. 명세의 응답 형식(JSON/XML)을 확인하세요: %s" % body[:200])


def fetch_all(cfg, key):
    params = dict(cfg.get("params") or {})
    if cfg.get("api_key_param"):
        params[cfg["api_key_param"]] = key
    page_param, size_param = cfg.get("page_param"), cfg.get("page_size_param")
    if size_param:
        params[size_param] = cfg.get("page_size", 100)
    if not page_param:
        return call(cfg["endpoint"], params), None
    merged_items, first, page = [], None, 1
    while True:
        params[page_param] = page
        res = call(cfg["endpoint"], params)
        items = dig(res, cfg.get("items_path", "")) if cfg.get("items_path") else res
        if first is None:
            first = res
        if not isinstance(items, list) or not items:
            break
        merged_items.extend(items)
        if len(items) < int(cfg.get("page_size", 100)):
            break
        page += 1
        if page > 500:
            print("경고: 500페이지를 넘어 중단")
            break
    return first, merged_items


def ids_of(items, id_field):
    out = {}
    for it in items or []:
        if isinstance(it, dict) and id_field in it:
            out[str(it[id_field])] = it
    return out


def main():
    cfg = load_config()
    if not cfg.get("enabled") or not cfg.get("endpoint"):
        print("온통청년 연동 비활성(config/youthcenter.json). 건너뜀.")
        return
    key = os.environ.get("YOUTHCENTER_API_KEY", "").strip()
    if not key:
        print("YOUTHCENTER_API_KEY 가 없습니다. 저장소 Secrets 에 등록하세요.")
        sys.exit(1)
    os.makedirs(RAW, exist_ok=True)
    today = (dt.datetime.utcnow() + dt.timedelta(hours=9)).date().isoformat()

    raw, merged = fetch_all(cfg, key)
    if merged is not None:
        # 여러 페이지를 하나로 합친 형태로 저장(items_path 위치에 전체 목록)
        raw = {"_merged": True, "_items": merged, "_first_page": raw}
        cfg_items_path = "_items"
    else:
        cfg_items_path = cfg.get("items_path", "")
    if isinstance(raw, dict):
        raw["_fetched_at"] = today
        raw["_items_path"] = cfg_items_path

    today_path = os.path.join(RAW, "%s.json" % today)
    latest_path = os.path.join(RAW, "latest.json")
    prev = None
    if os.path.exists(latest_path):
        with open(latest_path, encoding="utf-8") as f:
            prev = json.load(f)
    with open(today_path, "w", encoding="utf-8") as f:
        json.dump(raw, f, ensure_ascii=False, indent=1)
    shutil.copyfile(today_path, latest_path)

    id_field = (cfg.get("field_map") or {}).get("id")
    new_items = dig(raw, cfg_items_path) if cfg_items_path else raw
    print("저장: %s (%s건)" % (today_path, len(new_items) if isinstance(new_items, list) else "?"))
    if not id_field or not isinstance(new_items, list):
        print("field_map.id 가 비어 있어 변경 비교는 건너뜀")
        return
    prev_items = (dig(prev, prev.get("_items_path", "")) if isinstance(prev, dict) else None) or []
    cur, old = ids_of(new_items, id_field), ids_of(prev_items, id_field)
    added = sorted(set(cur) - set(old))
    gone = sorted(set(old) - set(cur))
    changed = sorted(i for i in set(cur) & set(old) if cur[i] != old[i])
    with open(os.path.join(RAW, "changes-%s.json" % today), "w", encoding="utf-8") as f:
        json.dump({"date": today, "added": added, "changed": changed, "removed": gone}, f, ensure_ascii=False, indent=1)
    review_path = os.path.join(RAW, "review-needed.json")
    review = {}
    if os.path.exists(review_path):
        with open(review_path, encoding="utf-8") as f:
            review = json.load(f)
    for i in gone:
        review[i] = {"since": today, "title": str(old[i].get((cfg.get("field_map") or {}).get("title", ""), ""))}
    for i in list(review):
        if i in cur:
            review.pop(i)
    with open(review_path, "w", encoding="utf-8") as f:
        json.dump(review, f, ensure_ascii=False, indent=1)
    print("신규 %d · 변경 %d · 사라짐(확인 필요) %d" % (len(added), len(changed), len(gone)))


if __name__ == "__main__":
    main()
