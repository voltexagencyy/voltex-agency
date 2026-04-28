#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INDEX="$ROOT/index.html"
HEADERS="$ROOT/_headers"

# Extract the inline <script> block, strip CR (LF-normalise to match browser
# hash behaviour per the HTML parsing spec), then SHA-256 + base64-encode.
HASH=$(awk '/<script>/{found=1; printf "\n"; next} /<\/script>/{found=0} found{print}' "$INDEX" \
  | tr -d '\r' \
  | openssl dgst -sha256 -binary \
  | openssl base64 -A)

# Replace whichever sha256 hash is already in _headers.
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|'sha256-[A-Za-z0-9+/=]*'|'sha256-${HASH}'|" "$HEADERS"
else
  sed -i "s|'sha256-[A-Za-z0-9+/=]*'|'sha256-${HASH}'|" "$HEADERS"
fi

echo "CSP hash updated: sha256-${HASH}"
