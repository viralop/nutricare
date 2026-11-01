@echo off
setlocal enabledelayedexpansion
title NutriCare Demo - Start / Fix Everything

set PHP=C:\Users\7medo\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe
set CFD=C:\Program Files (x86)\cloudflared\cloudflared.exe
set NODE=C:\Program Files\nodejs

echo === NutriCare demo starter ===
echo.

rem ---- 1) Laravel API on :8000 ----
powershell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)) { Start-Process -FilePath '%PHP%' -ArgumentList 'artisan','serve','--host=127.0.0.1','--port=8000' -WorkingDirectory 'C:\ai\app\api' -WindowStyle Hidden; 'API started' } else { 'API already running' }"

rem ---- 2) Web dev server on :3000 ----
powershell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue)) { Start-Process -FilePath 'cmd' -ArgumentList '/c set PATH=%NODE%;%%PATH%% && cd /d C:\ai\app\web && npm run dev' -WindowStyle Minimized; 'Web dev server starting' } else { 'Web already running' }"

rem ---- 3) Cloudflare tunnel (fresh URL every run) ----
taskkill /IM cloudflared.exe /F >nul 2>&1
powershell -NoProfile -Command "Start-Process -FilePath '%CFD%' -ArgumentList 'tunnel','--url','http://127.0.0.1:8000','--no-autoupdate' -WindowStyle Hidden -RedirectStandardError \"$env:TEMP\cf-tunnel-err.log\""
echo Waiting for tunnel URL...
set TUNNEL=
for /l %%i in (1,1,20) do (
    if not defined TUNNEL (
        powershell -NoProfile -Command "$m = Select-String -Path \"$env:TEMP\cf-tunnel-err.log\" -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches | Select-Object -First 1; if ($m) { $m.Matches[0].Value }" > "%TEMP%\tunnel_url.txt" 2>nul
        for /f "usebackq delims=" %%u in ("%TEMP%\tunnel_url.txt") do if not "%%u"=="" set TUNNEL=%%u
        if not defined TUNNEL timeout /t 2 /nobreak >nul
    )
)

if not defined TUNNEL (
    echo ERROR: could not get tunnel URL. Try running this script again.
    pause
    exit /b 1
)
echo Tunnel: %TUNNEL%

rem ---- 4) Point the stable API proxy at the new tunnel ----
powershell -NoProfile -Command "$c = Get-Content 'C:\ai\app\tools\cf-api-proxy\wrangler.jsonc' -Raw; $c = $c -replace 'https://[a-z0-9-]+\.trycloudflare\.com', '%TUNNEL%'; Set-Content 'C:\ai\app\tools\cf-api-proxy\wrangler.jsonc' $c -NoNewline; 'proxy target updated'"
set PATH=%NODE%;%PATH%
cd /d C:\ai\app\tools\cf-api-proxy
call npx wrangler deploy --to env production 2>nul || call npx wrangler deploy
cd /d C:\ai\app

echo.
echo =====================================================
echo  Local app:    http://localhost:3000
echo  Public app:   https://nutricare-web.nutricare-demo.workers.dev
echo  Public API:   https://nutricare-api.nutricare-demo.workers.dev
echo  Login:        sara@nutricare.test  /  password1234
echo =====================================================
pause
