@echo off
echo.
echo ================================================
echo        HAMKAR GAMES - LAUNCHER
echo ================================================
echo.
echo App binds to 0.0.0.0:1234
echo Public domain: proxy host nginx to 127.0.0.1:1234
echo.

where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker was not found. Install Docker Desktop first.
    pause
    exit /b 1
)

if not exist ".env" (
    copy ".env.example" ".env" >nul
)

start "" http://127.0.0.1:1234
docker compose up --build

pause
