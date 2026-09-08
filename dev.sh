#!/usr/bin/env bash
# Runs backend (8001) + frontend (3000) together. Ctrl-C stops both.
set -e
cd "$(dirname "$0")"
( cd backend && [ -d .venv ] || python3 -m venv .venv; . .venv/bin/activate && pip install -q -r requirements.txt && uvicorn server:app --host 0.0.0.0 --port 8001 --reload ) &
BACK=$!
( cd frontend && [ -d node_modules ] || npm install; npm start ) &
FRONT=$!
trap "kill $BACK $FRONT 2>/dev/null" EXIT INT TERM
wait
