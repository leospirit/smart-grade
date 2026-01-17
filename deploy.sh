#!/bin/bash
# Smart Grade Deployment Helper Script

# Colors
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Smart Grade Deployment Helper ===${NC}"

# 1. check Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker could not be found. Please install Docker first."
    exit 1
fi

# 2. Ask for Server IP
read -p "Enter the Public IP (or Domain) of this server (e.g. 1.2.3.4): " SERVER_IP

if [ -z "$SERVER_IP" ]; then
    echo "Error: IP cannot be empty."
    exit 1
fi

# Remove http:// prefix if user typed it, to be safe, then re-add
CLEAN_IP="${SERVER_IP#http://}"
CLEAN_IP="${CLEAN_IP#https://}"
FULL_API_URL="http://${CLEAN_IP}:8000"

echo -e "Configuring Frontend to connect to: ${GREEN}${FULL_API_URL}${NC}"

# 3. Export for docker-compose
export VITE_API_URL=$FULL_API_URL

# 4. Run Docker Compose
echo "Building and Starting Containers..."
docker-compose up -d --build

echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo "Frontend: http://${CLEAN_IP}"
echo "Backend:  http://${CLEAN_IP}:8000"
