@echo off
pushd "%~dp0"
title 커먼빌리지 - 사이트 열어보기
echo.
echo   사이트를 만드는 중... (data 폴더의 시트 내용으로 HTML 생성)
echo.
python build.py --site-url http://127.0.0.1:4399 --base-path "" --out dist
if errorlevel 1 (
  echo.
  echo   [오류] 사이트를 만들지 못했습니다. 위 메시지를 확인하세요.
  echo   Python 이 없다면 https://www.python.org/downloads/ 에서 설치하세요.
  pause
  popd
  exit /b 1
)
echo.
echo   브라우저가 열립니다. 창을 닫으면 미리보기가 꺼집니다.
start "" http://127.0.0.1:4399/
python serve.py 4399
popd
