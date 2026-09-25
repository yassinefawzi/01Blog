#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT/.logs"
mkdir -p "$LOG_DIR"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Stopping backend and frontend..."
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  # Also stop child java/ng processes started under those shells
  pkill -f 'com.blog01.Blog01Application' 2>/dev/null || true
  wait 2>/dev/null || true
  echo "Done. Postgres is still running (docker compose down to stop it)."
}
trap cleanup EXIT INT TERM

free_port() {
  local port="$1"
  if ss -tln 2>/dev/null | grep -q ":${port} "; then
    echo "==> Freeing port $port"
    fuser -k "${port}/tcp" 2>/dev/null || true
    sleep 1
  fi
}

echo "==> Starting PostgreSQL"
cd "$ROOT"
# Container may already exist from an older project path — start it instead of recreating
if docker ps -a --format '{{.Names}}' | grep -qx 'blog01-postgres'; then
  docker start blog01-postgres >/dev/null
else
  docker compose up -d
fi

echo "==> Waiting for PostgreSQL"
for i in $(seq 1 30); do
  if docker exec blog01-postgres pg_isready -U blog01 -d blog01 >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [[ "$i" -eq 30 ]]; then
    echo "PostgreSQL did not become ready in time."
    exit 1
  fi
done

if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
  echo "==> Installing frontend dependencies"
  (cd "$ROOT/frontend" && npm install)
fi

# Clear leftover processes from previous runs so ports are free
free_port 8080
free_port 4200
pkill -f 'com.blog01.Blog01Application' 2>/dev/null || true
pkill -f 'ng serve' 2>/dev/null || true
sleep 1

: >"$LOG_DIR/backend.log"
: >"$LOG_DIR/frontend.log"

echo "==> Starting backend  → http://localhost:8080/api"
(cd "$ROOT/backend" && mvn spring-boot:run) >"$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

echo "==> Starting frontend → http://localhost:4200"
(cd "$ROOT/frontend" && npx ng serve --port 4200 --host 127.0.0.1) >"$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

wait_for_port() {
  local port="$1" name="$2" pid="$3"
  echo "==> Waiting for $name on :$port"
  # Frontend first compile can take a while (esp. after code errors then fix)
  local attempts=120
  for i in $(seq 1 "$attempts"); do
    if ss -tln 2>/dev/null | grep -q ":${port} "; then
      return 0
    fi
    if ! kill -0 "$pid" 2>/dev/null; then
      # Process may have been replaced by a child that still binds the port — recheck
      sleep 1
      if ss -tln 2>/dev/null | grep -q ":${port} "; then
        return 0
      fi
      echo "$name process exited. Check $LOG_DIR/${name}.log"
      tail -n 40 "$LOG_DIR/${name}.log" 2>/dev/null || true
      exit 1
    fi
    sleep 2
  done
  echo "$name did not become ready in time. Check $LOG_DIR/${name}.log"
  tail -n 40 "$LOG_DIR/${name}.log" 2>/dev/null || true
  exit 1
}

wait_for_port 8080 "backend" "$BACKEND_PID"
wait_for_port 4200 "frontend" "$FRONTEND_PID"

echo ""
echo "All services ready."
echo "  App:     http://localhost:4200"
echo "  API:     http://localhost:8080/api"
echo "  Admin:   admin / admin123"
echo "  Logs:    $LOG_DIR/backend.log , $LOG_DIR/frontend.log"
echo ""
echo "Press Ctrl+C to stop backend and frontend."

# Fail fast if either process exits
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 2
done

if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  echo "Backend exited. Check $LOG_DIR/backend.log"
  exit 1
fi
if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
  echo "Frontend exited. Check $LOG_DIR/frontend.log"
  exit 1
fi
