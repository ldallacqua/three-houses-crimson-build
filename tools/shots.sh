#!/usr/bin/env bash
# Screenshots of each view with headless Edge (Windows). Usage: tools/shots.sh OUT_DIR WIDTH HEIGHT route...
OUT="$1"; W="$2"; H="$3"; shift 3
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
for r in "$@"; do
  name=$(echo "$r" | tr '/' '-')
  timeout 60 "$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size="$W,$H" --virtual-time-budget=9000 --screenshot="$OUT/$name.png" "http://localhost:8790/#/$r" >/dev/null 2>&1
  echo "$name"
done
