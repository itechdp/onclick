# Start Backend and Frontend Servers
Write-Host "Starting Razorpay Backend Server..." -ForegroundColor Green

# Start backend server in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm install --prefix . -f express @supabase/supabase-js razorpay dotenv @types/express tsx; $env:PORT='3000'; $env:RAZORPAY_KEY_ID='rzp_live_S0CUDu2mNcAuGX'; $env:RAZORPAY_KEY_SECRET='T2vUFDSBlnja2PGk26ktd6WK'; $env:SUPABASE_URL='https://zmdkhrzomzzxsjcxmyqo.supabase.co'; $env:SUPABASE_SERVICE_KEY='YOUR_SERVICE_KEY_HERE'; npx tsx razorpay-webhook-server.ts"

# Wait a moment for backend to start
Start-Sleep -Seconds 5

Write-Host "Starting Frontend Dev Server..." -ForegroundColor Cyan

# Start frontend in current terminal
npm run dev
