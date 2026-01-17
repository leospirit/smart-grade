@echo off
setlocal EnableDelayedExpansion

title Smart Grade Academy - Launcher
echo ==================================================
echo    Smart Grade Academy - One-Click Launcher (Windows)
echo ==================================================

:: 1. Detect IP
echo [1/5] Detecting Network...
for /f "tokens=14" %%a in ('ipconfig ^| findstr IPv4') do set IP=%%a
if "%IP%"=="" set IP=localhost
echo       Detected IP: %IP%

:: 2. Configure Frontend
echo [2/5] Configuring Access Address...
echo VITE_API_URL=http://%IP%:8000 > frontend\.env

:: 3. Start Backend
echo [3/5] Starting Backend Server...
cd backend
if not exist "venv" (
    echo       Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

:: Kill port 8000 if used (optional, requires admin usually, skipping for safety or use simple loop)
:: start backend in new window
start "SmartGrade Backend" python main.py
cd ..

:: 4. Start Frontend
echo [4/5] Starting Frontend Interface...
cd frontend
if not exist "node_modules" (
    echo       Installing Frontend dependencies...
    call npm install
)

:: start frontend in new window
start "SmartGrade Frontend" npm run dev -- --host 0.0.0.0 --port 5174
cd ..

:: 5. Launch Browser
echo [5/5] Launching Browser...
timeout /t 5 >nul
start http://%IP%:5174/login

echo.
echo ==================================================
echo    App is Running!
echo    Access URL: http://%IP%:5174
echo    (Share this URL with parents on the same Wi-Fi)
echo ==================================================
echo.
echo DO NOT CLOSE this window or the opened server windows.
echo.
pause
