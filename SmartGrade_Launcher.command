#!/bin/bash

# Get directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=================================================="
echo "   Smart Grade Academy - One-Click Launcher"
echo "=================================================="

# 1. Detect LAN IP
echo "[1/5] Detecting Network..."
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
if [ -z "$IP" ]; then
    IP="localhost"
fi
echo "      Detected IP: $IP"

# 2. Configure Frontend
echo "[2/5] Configuring Access Address..."
echo "VITE_API_URL=http://$IP:8000" > frontend/.env

# 3. Start Backend
echo "[3/5] Starting Backend Server..."
cd backend
# Check if venv exists, if not create it
if [ ! -d "venv" ]; then
    echo "      Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Stop any existing backend
lsof -t -i:8000 | xargs kill -9 2>/dev/null || true

# Run backend
nohup python3 main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "      Backend running (PID: $BACKEND_PID)"
cd ..

# 4. Start Frontend
echo "[4/5] Starting Frontend Interface..."
cd frontend
# Install node_modules if missing
if [ ! -d "node_modules" ]; then
    echo "      Installing Frontend dependencies (this may take a minute)..."
    npm install > /dev/null 2>&1
fi

# Stop any existing frontend port 5174
lsof -t -i:5174 | xargs kill -9 2>/dev/null || true

nohup npm run dev -- --host 0.0.0.0 --port 5174 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "      Frontend running (PID: $FRONTEND_PID)"
cd ..

# 5. Launch Browser
echo "[5/5] Launching Browser..."
sleep 3 # Wait for vite to warm up
open "http://$IP:5174/login"

echo ""
echo "=================================================="
echo "   App is Running!"
echo "   Access URL: http://$IP:5174"
echo "   (Share this URL with parents on the same Wi-Fi)"
echo "=================================================="
echo ""
echo "DO NOT CLOSE THIS WINDOW while using the app."
echo "Press [ENTER] to stop servers and exit."
read

# Cleanup
echo "Stopping servers..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "Goodbye!"
