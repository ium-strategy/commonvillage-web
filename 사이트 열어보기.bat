@echo off
pushd "%~dp0"
title 커먼빌리지 - 사이트 미리보기
echo.
echo   커먼빌리지 웹사이트를 엽니다.
echo.
where python >nul 2>nul
if errorlevel 1 goto nopython
start "" "http://127.0.0.1:4399"
echo   브라우저가 열립니다. 잠시만 기다려 주세요.
echo   (화면이 안 나오면 브라우저에서 새로고침 한 번 눌러 주세요)
echo.
echo   ================================================
echo    이 창을 닫으면 사이트도 꺼집니다.
echo    보는 동안에는 이 창을 그대로 두세요.
echo   ================================================
echo.
python serve.py 4399
goto end

:nopython
echo   [문제] 이 컴퓨터에 파이썬(Python)이 설치되어 있지 않습니다.
echo.
echo   아래 주소에서 내려받아 설치한 뒤 이 파일을 다시 실행해 주세요.
echo   https://www.python.org/downloads/
echo.
echo   설치할 때 Add Python to PATH 항목에 반드시 체크하세요.
echo.
pause

:end
popd
