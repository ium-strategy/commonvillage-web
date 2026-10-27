#!/usr/bin/env python3
"""구글 시트(웹에 게시 → CSV 주소)를 내려받아 data/sheet/ 에 저장합니다.

환경 변수
  SHEET_NOTICES_CSV_URL     공고 탭의 CSV 게시 주소
  SHEET_COMMENTARY_CSV_URL  해설 탭의 CSV 게시 주소
둘 다 비어 있으면 아무것도 하지 않고 저장소의 CSV를 그대로 씁니다.
내려받은 내용이 비어 있거나 머리글이 없으면 기존 파일을 덮어쓰지 않습니다.
"""
import io
import csv
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = [
    ("SHEET_NOTICES_CSV_URL", "notices.csv", "slug"),
    ("SHEET_COMMENTARY_CSV_URL", "commentary.csv", "slug"),
]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "commonvillage-build/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8-sig")


def main():
    did = False
    for env, filename, required_col in TARGETS:
        url = os.environ.get(env, "").strip()
        if not url:
            print("%s 없음 → %s 는 저장소 파일 사용" % (env, filename))
            continue
        try:
            text = fetch(url)
        except Exception as e:  # noqa: BLE001
            print("내려받기 실패 %s: %s" % (filename, e))
            sys.exit(1)
        rows = list(csv.DictReader(io.StringIO(text)))
        if not rows or required_col not in (rows[0].keys() if rows else []):
            print("%s: 내용이 비어 있거나 '%s' 열이 없어 기존 파일 유지" % (filename, required_col))
            continue
        path = os.path.join(ROOT, "data", "sheet", filename)
        with open(path, "w", encoding="utf-8-sig", newline="") as f:
            f.write(text if text.endswith("\n") else text + "\n")
        print("저장: %s (%d행)" % (path, len(rows)))
        did = True
    if not did:
        print("시트 갱신 없음")


if __name__ == "__main__":
    main()
