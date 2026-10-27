# 커먼빌리지 웹사이트

청년 공고(살 곳 · 지원받을 곳 · 즐길 곳 · 도전할 곳)를 모아 공고마다 고유 주소의 정적 HTML로 만드는 사이트입니다.
2026-10-27 애드센스 대응 요구사항에 따라 한 파일 시안(`index.html`)을 **템플릿·스타일·스크립트·데이터**로 나누고,
빌드 스크립트가 홈·목록·상세·사이트맵을 생성하는 구조로 바꿨습니다. 디자인과 4개 카테고리는 승인된 시안 그대로입니다.

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `build.py` | 빌드 실행 파일. `python build.py` → `dist/` 생성 (Python 3.8 이상, 추가 설치 없음) |
| `cv/` | 빌드 코드. `data.py`(시트·API 읽기, 상태 계산), `html.py`(템플릿·카드·광고 조각) |
| `config.json` | 사이트 주소, 운영자 정보, 카테고리 설명, 애널리틱스·애드센스 설정 |
| `config/youthcenter.json` | 온통청년 API 호출·필드 매핑 설정(인증키는 넣지 않음) |
| `data/sheet/notices.csv` | 운영자 직접 입력 공고(구글 시트 CSV). 열 설명은 `data/sheet/README.md` |
| `data/sheet/commentary.csv` | 커먼빌리지 해설. `승인` 상태만 게시 |
| `data/raw/youthcenter/` | 온통청년 API 원본(날짜별 보관, 되돌리기용) |
| `src/templates/` | 페이지 템플릿(base, home, list, notice, guide, page, search, 404) |
| `src/css/site.css`, `src/js/site.js` | 스타일(시안 CSS 원본 + 추가)과 공통 스크립트 |
| `src/content/pages/` | 소개·문의·개인정보처리방침·이용약관(수기 작성) |
| `src/content/guides/` | 가이드 글(수기 작성). 파일 하나 = `/guide/<slug>/` 한 페이지 |
| `src/static/og/` | 카테고리별 공유 미리보기 이미지(`scripts/make_og_images.js`로 생성) |
| `scripts/fetch_sheet.py` | 구글 시트 CSV 내려받기 |
| `scripts/fetch_youthcenter.py` | 온통청년 API 수집·원본 보관·전날 대비 변경 기록 |
| `.github/workflows/build.yml` | 매일 05:00(KST)·푸시 시 자동 빌드 → GitHub Pages 배포 |
| `netlify.toml` | Netlify 를 쓸 경우의 빌드 설정 |
| `legacy.html`, `assets/`, `data/*.js`, `brand/` | 이전 v3.0 앱(1분 진단). 빌드 시 `/check/` 에 noindex 로 복사 |
| `docs/` | 담당자용 설명서. 빌드·배포는 `docs/7_빌드와-배포.md` |

## 생성되는 페이지

| 주소 | 내용 | 색인 |
|---|---|---|
| `/` | 홈(시안 디자인). 모집 중 공고를 마감 가까운 순으로 | O |
| `/notices/`, `/housing/`, `/support/`, `/play/`, `/challenge/` | 전체·카테고리 목록. 30건씩 `/housing/page/2/` | O |
| `/region/`, `/region/seoul/` … | 지역별 목록(공고가 있는 시·도만) | O |
| `/p/<slug>/` | 공고 상세(경로 › 제목·상태 › 요약 › 조건표 › 해설 › 원문 버튼 › 관련 3건 › 광고 자리) | 해설 승인 + 원문 링크가 있을 때만 O, 아니면 noindex |
| `/guide/`, `/guide/<slug>/` | 가이드 | O |
| `/about/`, `/contact/`, `/privacy/`, `/terms/` | 필수 페이지. 모든 페이지 푸터에서 연결 | O |
| `/search/?q=` | 검색(JS, `notices.json` 사용) | noindex |
| `/check/` | 1분 진단(이전 앱). 광고 없음 | noindex |
| `/sitemap.xml`, `/robots.txt`, `/404.html`, (설정 시) `/ads.txt`, `/CNAME` | | |

## 로컬에서 보기

```
python build.py --site-url http://127.0.0.1:4399 --base-path ""
python serve.py
```
윈도우에서는 `사이트 열어보기.bat` 을 두 번 클릭하면 같은 일을 합니다.

## 데이터 규칙

- 확인되지 않은 값은 비워 둡니다. 화면에 **원문 확인 필요**로 표시됩니다.
- 마감일이 지나면 자동으로 "마감"이 되고 목록 뒤로 갑니다. 페이지는 지우지 않습니다.
- 같은 정책이 다시 열리면 같은 slug 의 내용을 갱신합니다(주소 유지).
- 해설이 `승인`이 아니거나 원문 링크가 없는 공고는 noindex 이며 사이트맵에서 빠집니다.
- 광고는 승인 후 `config.json` 의 `adsense.enabled` 를 켜야 들어가며, 위치는 상세(관련 공고 아래)·목록(페이지 번호 아래)·가이드(중간·끝)뿐입니다. 홈·진단·필수 페이지에는 없습니다.

## 대표가 결정·준비할 것 (요구사항 10장)

- [ ] 온통청년 회원가입 후 오픈 API 인증키 신청 → 저장소 Secrets `YOUTHCENTER_API_KEY`
- [ ] 온통청년 상업적 이용·출처 표시 조건 확인 → `config.json` 의 `youthcenter.attribution`
- [ ] 제공목록(응답 필드명) 확인 → `config/youthcenter.json` 의 `endpoint`, `field_map`, `category_map` 채우고 `enabled: true`
- [ ] 도메인 결정·구입 → `config.json` 의 `site_url`, `cname`
- [ ] 구글 시트 만들기(열은 `data/sheet/README.md`) → "웹에 게시 → CSV" 주소를 Secrets `SHEET_NOTICES_CSV_URL`, `SHEET_COMMENTARY_CSV_URL`
- [ ] 문의 이메일, 사업자 정보 표기 범위 → `config.json` 의 `operator`
- [ ] 개인정보처리방침·이용약관의 `[확정 필요]` 채우고 법무 검토 → `src/content/pages/privacy.html`, `terms.html`
- [ ] 호스팅 선택(GitHub Pages 또는 Netlify) → `docs/7_빌드와-배포.md`
- [ ] 저장소 비공개 전환(GitHub Pages 는 유료 플랜 필요)
- [ ] 애드센스 신청 시 `config.json` 의 `adsense.client`, `ads_txt`; 승인 후 `enabled: true` 와 광고 단위 ID
