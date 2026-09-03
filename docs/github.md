# GitHub에 올리기

이 저장소는 이미 `git init` + 첫 커밋까지 되어 있습니다. 남은 것은 **GitHub에 빈 저장소를 만들고 연결해 올리는 것**뿐입니다.

> [!WARNING]
> **저장소는 Private으로 만드시길 권합니다.**
> 문서에 사업 기획 내용(수익 구조, B2G 영업 방식, 미결 사항)이 들어 있고,
> 시드 데이터의 지자체 사업명·실적은 실제가 아닌 예시라 공개되면 오해를 살 수 있습니다.

---

## 0. 처음 한 번만 — Git 사용자 정보

커밋에 기록될 이름과 메일입니다. 아직 설정돼 있지 않다면:

```bash
git config --global user.name "이름"
git config --global user.email "메일주소"
```

## 1. GitHub에서 빈 저장소 만들기

<https://github.com/new> 에서:

- **Repository name**: `commonvillage-web` (원하는 이름)
- **Private** 선택
- **README, .gitignore, license는 추가하지 마세요.** 이미 여기 있어서 충돌합니다

만들고 나면 나오는 주소를 복사합니다. `https://github.com/<계정>/commonvillage-web.git` 형태입니다.

## 2. 연결하고 올리기

이 폴더에서:

```bash
git remote add origin https://github.com/<계정>/commonvillage-web.git
git push -u origin main
```

처음 push할 때 로그인 창이 뜹니다. 브라우저로 GitHub에 로그인하면 됩니다.
(터미널에서 비밀번호를 묻는다면 GitHub 계정 비밀번호가 아니라 **Personal Access Token**이 필요합니다.
Settings → Developer settings → Personal access tokens → Fine-grained tokens에서 발급하고, 해당 저장소의 Contents 권한을 Read and write로 주세요.)

## 3. 이후 수정할 때

```bash
git add .
git commit -m "설명"
git push
```

---

## 참고: 팀에 미리보기 링크를 주고 싶다면 (GitHub Pages)

이 프로토타입은 빌드가 필요 없는 정적 사이트라 GitHub Pages로 그대로 올라갑니다.

저장소 → **Settings → Pages** → Source를 `Deploy from a branch`, 브랜치를 `main` / `/ (root)`로 두고 저장하면
1~2분 뒤 `https://<계정>.github.io/commonvillage-web/` 에서 열립니다.

주의할 점 두 가지입니다.

- **Private 저장소의 Pages는 유료 플랜에서만 됩니다.** 무료 계정이면 저장소를 Public으로 바꿔야 하는데,
  그러면 위의 경고대로 기획 내용이 공개됩니다. 팀 공유가 목적이라면 저장소를 Private으로 두고 각자 클론해서
  `python serve.py`로 보는 편이 안전합니다.
- Pages로 공개한다면 **프로토타입 고지 바를 반드시 남겨 두세요.** 예시 데이터를 실제 모집 정보로 오인할 수 있습니다.

---

## 참고: 무엇이 올라가고 무엇이 빠지는가

`.gitignore`가 아래를 제외합니다.

- `__pycache__/`, `*.pyc` — 파이썬 캐시
- `.DS_Store`, `Thumbs.db` — OS가 만드는 파일
- `.vscode/`, `.idea/` — 편집기 설정
- `node_modules/`

소스와 문서는 전부 올라갑니다. 비밀 키나 개인정보는 코드에 없습니다
(알림 이메일은 방문자 브라우저에만 저장되고 서버로 가지 않습니다).
