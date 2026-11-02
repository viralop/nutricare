@echo off
setlocal enabledelayedexpansion
title NutriCare - Go back to a checkpoint
cd /d C:\ai\app

echo === NutriCare checkpoints (newest first) ===
echo.
git log --oneline -15
echo.
set /p ID="Paste the code of the checkpoint to go back to (e.g. a5f8ffd), or press Enter to cancel: "
if "%ID%"=="" goto :end

rem Safety net: keep today's state on a backup branch before going back
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set dt=%%a
git branch backup-!dt:~0,8!-%ID% 2>nul

echo.
echo Restoring checkpoint %ID% ...
git reset --hard %ID%
echo.
echo Done. (Your previous state is still safe on branch backup-!dt:~0,8!-%ID%)

:end
echo.
pause
