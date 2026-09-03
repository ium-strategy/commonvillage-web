@echo off
pushd "%~dp0"
title 커먼빌리지 - 웹사이트 업데이트
echo.
echo   고친 내용을 웹사이트에 반영합니다.
echo.
git add -A
git diff --cached --quiet
if not errorlevel 1 goto nochange
echo   무엇을 고치셨나요? 한 줄로 적고 엔터를 누르세요.
echo   예: 강릉 공고 마감일 수정
echo.
set /p msg=  내용: 
if "%msg%"=="" set msg=내용 수정
git commit -m "%msg%"
echo.
echo   깃허브로 올리는 중...
git push origin main
if errorlevel 1 goto pushfail
echo.
echo   ================================================
echo    올렸습니다. 1~2분 뒤 웹사이트에 반영됩니다.
echo    https://ium-strategy.github.io/commonvillage-web/
echo   ================================================
goto end

:nochange
echo   바뀐 내용이 없습니다. 파일을 먼저 고쳐 주세요.
goto end

:pushfail
echo.
echo   [문제] 깃허브에 올리지 못했습니다.
echo   로그인 창이 떴다면 로그인 후 이 파일을 다시 실행해 주세요.
echo   계속 안 되면 GitHub Desktop에서 Push origin 을 눌러 주세요.

:end
echo.
pause
popd
