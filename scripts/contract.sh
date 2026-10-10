#!/usr/bin/env bash
# Contract check: runs one scenario against the MSW mocks and the real Go API
# and fails if their answers differ (status codes, JSON shapes).
#
# Starts the API on a throwaway database (created on the Postgres in
# DATABASE_URL, dropped afterwards) with one admin account.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

base="${DATABASE_URL:-postgres://csgrundlagen:csgrundlagen@localhost:5432/csgrundlagen}"
name="csgrundlagen_contract_$$"
dburl="${base%/*}/$name"
port="${CONTRACT_PORT:-18080}"
bin="$(mktemp -d)"

cleanup() {
  [[ -n "${api_pid:-}" ]] && kill "$api_pid" 2>/dev/null && wait "$api_pid" 2>/dev/null || true
  psql "$base" -qc "DROP DATABASE IF EXISTS $name WITH (FORCE)" >/dev/null 2>&1 || true
  rm -rf "$bin"
}
trap cleanup EXIT

psql "$base" -qc "CREATE DATABASE $name" >/dev/null
(cd "$root/apps/api" && go build -o "$bin/" ./cmd/api ./cmd/adduser)

DATABASE_URL="$dburl" PORT="$port" "$bin/api" >"$bin/api.log" 2>&1 &
api_pid=$!
for _ in $(seq 50); do
  curl -sf "http://127.0.0.1:$port/healthz" >/dev/null && break
  sleep 0.2
done
curl -sf "http://127.0.0.1:$port/healthz" >/dev/null || { cat "$bin/api.log"; exit 1; }

export CONTRACT_ADMIN_EMAIL=contract-admin@example.com
export CONTRACT_ADMIN_PASSWORD=contract-password
DATABASE_URL="$dburl" "$bin/adduser" -email "$CONTRACT_ADMIN_EMAIL" -name "Contract Admin" \
  -password "$CONTRACT_ADMIN_PASSWORD" -role admin >/dev/null

cd "$root/apps/web"
CONTRACT_API_URL="http://127.0.0.1:$port" npx vitest run -c vitest.contract.config.ts "$@"
