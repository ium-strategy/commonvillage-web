#!/usr/bin/env node
/* 공유 미리보기(og:image) 이미지 생성. 개발용 도구로 Playwright(Chromium)가 필요합니다.
   결과는 src/static/og/*.png (1200x630) 에 저장되어 저장소에 함께 올립니다. 배포 빌드에서는 실행하지 않습니다.
   사용: node scripts/make_og_images.js  */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'static', 'og');
const COLORS = { housing: ['#ffe5ee', '#a81854'], support: ['#eaf0db', '#345642'], play: ['#fff27e', '#604e22'], challenge: ['#eee8fb', '#61408f'], default: ['#fffbe2', '#d81b6a'] };

function html(bg, fg, c) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700;900&display=swap" rel="stylesheet">
<style>body{margin:0;width:1200px;height:630px;background:${bg};color:${fg};font-family:'Noto Sans KR',sans-serif;position:relative;overflow:hidden;
background-image:linear-gradient(#00000010 1px,transparent 1px),linear-gradient(90deg,#00000010 1px,transparent 1px);background-size:60px 60px}
.wrap{position:absolute;left:80px;top:90px;right:80px}.eyebrow{font:700 22px/1 sans-serif;letter-spacing:5px;opacity:.75}
h1{font-size:92px;font-weight:900;letter-spacing:-5px;line-height:1.15;margin:26px 0 20px}
p{font-size:30px;font-weight:700;opacity:.8;margin:0;max-width:760px}
.brand{position:absolute;left:80px;bottom:70px;font-size:34px;font-weight:900;letter-spacing:-1.5px;color:#d81b6a}
.brand small{display:block;font:800 13px/1 sans-serif;letter-spacing:5px;margin-top:8px}
.icon{position:absolute;right:90px;bottom:60px;font-size:250px;line-height:1;transform:rotate(-8deg);filter:drop-shadow(8px 12px 0 #0000000d)}
.ring{position:absolute;width:420px;height:420px;border:2px solid currentColor;opacity:.15;border-radius:50%;right:-120px;top:-140px}</style></head>
<body><div class="ring"></div><div class="wrap"><div class="eyebrow">${c.en}</div><h1>${c.name}</h1><p>${c.sub}</p></div>
<div class="brand">커먼빌리지<small>COMMON VILLAGE</small></div><div class="icon">${c.icon}</div></body></html>`;
}

(async () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  const cats = Object.assign({}, cfg.categories, { default: { name: '컴빌에 놀러 와!', sub: '살 곳부터 새로운 도전까지, 청년 공고 한눈에', en: 'A LITTLE CHANCE, A NEW EXPERIENCE', icon: '✳' } });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [key, c] of Object.entries(cats)) {
    const [bg, fg] = COLORS[key];
    await page.setContent(html(bg, fg, c));
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, key + '.png') });
    console.log('생성:', key);
  }
  await browser.close();
})();
