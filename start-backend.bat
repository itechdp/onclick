@echo off
echo ==========================================
echo   STARTING RAZORPAY BACKEND SERVER
echo ==========================================
echo.

REM Check if .env.backend exists
if not exist .env.backend (
    echo ERROR: .env.backend file not found!
    echo.
    echo Creating .env.backend file...
    (
        echo PORT=3000
        echo RAZORPAY_KEY_ID=rzp_live_S0CUDu2mNcAuGX
        echo RAZORPAY_KEY_SECRET=T2vUFDSBlnja2PGk26ktd6WK
        echo RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
        echo SUPABASE_URL=https://zmdkhrzomzzxsjcxmyqo.supabase.co
        echo SUPABASE_SERVICE_KEY=PASTE_YOUR_SERVICE_KEY_HERE
    ) > .env.backend
    echo.
    echo Created .env.backend file.
    echo IMPORTANT: Edit .env.backend and add your Supabase Service Key!
    echo Get it from: https://supabase.com/dashboard/project/zmdkhrzomzzxsjcxmyqo/settings/api
    echo.
    pause
    exit /b 1
)

echo Loading environment variables...
for /f "tokens=1,* delims==" %%a in (.env.backend) do (
    set "%%a=%%b"
)

echo.
echo Configuration:
echo - Port: %PORT%
echo - Razorpay Key: %RAZORPAY_KEY_ID%
echo - Supabase URL: %SUPABASE_URL%
echo.

if "%SUPABASE_SERVICE_KEY%"=="PASTE_YOUR_SERVICE_KEY_HERE" (
    echo ERROR: Supabase Service Key not configured!
    echo.
    echo Please edit .env.backend and add your Supabase Service Key
    echo Get it from: https://supabase.com/dashboard/project/zmdkhrzomzzxsjcxmyqo/settings/api
    echo.
    pause
    exit /b 1
)

echo Starting backend server...
echo.
npx tsx razorpay-webhook-server.ts
