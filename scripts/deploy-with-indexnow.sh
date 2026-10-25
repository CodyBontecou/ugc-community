#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

pnpm deploy:worker
node scripts/verify-job-posting-auth.mjs

if command -v indexnow >/dev/null 2>&1; then
  indexnow submit-sitemap ugc.community --key-dir public --recent-days 7 --confirm
else
  printf '%s\n' 'warning: indexnow CLI not found; production deployed without URL notification' >&2
fi
