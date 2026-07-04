#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ENV="$ROOT_DIR/apps/backend/.env.local"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"
SESSION_LOG="$LOG_DIR/session_$(date +%Y%m%d_%H%M%S).txt"

echo "Crowd Source FAQ — local dev runner" | tee -a "$SESSION_LOG"

if [ ! -f "$BACKEND_ENV" ]; then
  echo "No apps/backend/.env.local found — let's create one." | tee -a "$SESSION_LOG"
  cp "$ROOT_DIR/apps/backend/.env.example" "$BACKEND_ENV"

  read -rp "MONGODB_URI (mongodb+srv://...): " MONGODB_URI
  read -rp "JWT_SECRET (leave blank to auto-generate): " JWT_SECRET
  if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
    echo "Generated JWT_SECRET." | tee -a "$SESSION_LOG"
  fi

  
  if sed --version >/dev/null 2>&1; then
    sed -i "s|^MONGODB_URI=.*|MONGODB_URI=${MONGODB_URI}|" "$BACKEND_ENV"
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$BACKEND_ENV"
  else
    sed -i '' "s|^MONGODB_URI=.*|MONGODB_URI=${MONGODB_URI}|" "$BACKEND_ENV"
    sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$BACKEND_ENV"
  fi
  echo "Saved to apps/backend/.env.local" | tee -a "$SESSION_LOG"
else
  echo "apps/backend/.env.local already exists — leaving it untouched." | tee -a "$SESSION_LOG"
fi

if [ ! -f "$ROOT_DIR/apps/frontend/.env.local" ]; then
  cp "$ROOT_DIR/apps/frontend/.env.example" "$ROOT_DIR/apps/frontend/.env.local"
fi


if [ ! -d "$ROOT_DIR/apps/backend/node_modules" ]; then
  echo "Installing backend deps..." | tee -a "$SESSION_LOG"
  (cd "$ROOT_DIR/apps/backend" && npm install) 2>&1 | tee -a "$SESSION_LOG"
fi
if [ ! -d "$ROOT_DIR/apps/frontend/node_modules" ]; then
  echo "Installing frontend deps..." | tee -a "$SESSION_LOG"
  (cd "$ROOT_DIR/apps/frontend" && npm install) 2>&1 | tee -a "$SESSION_LOG"
fi


echo "Starting backend (http://localhost:6767) and frontend (http://localhost:5173)..." | tee -a "$SESSION_LOG"

(cd "$ROOT_DIR/apps/backend" && npm run dev) 2>&1 | tee -a "$SESSION_LOG" &
BACKEND_PID=$!

(cd "$ROOT_DIR/apps/frontend" && npm run dev) 2>&1 | tee -a "$SESSION_LOG" &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null' EXIT INT TERM
wait
