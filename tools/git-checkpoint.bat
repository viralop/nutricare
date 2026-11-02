@echo off
setlocal
title NutriCare - Save a checkpoint
cd /d C:\ai\app

rem Save all current changes as a git checkpoint and push it to GitHub.
set MSG=%1
if "%MSG%"=="" set MSG=Checkpoint %DATE% %TIME:~0,5%

git add -A
git commit -m "%MSG%"
git push
if errorlevel 1 (
    echo.
    echo Saved locally, but push to GitHub failed - check internet.
) else (
    echo.
    echo Checkpoint saved and pushed: %MSG%
)
echo.
pause
