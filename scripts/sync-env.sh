#!/usr/bin/env bash
# Syncs all non-empty, non-comment vars from .env.local to Vercel (all 3 environments).
# Usage: bash scripts/sync-env.sh
# Prerequisites: vercel CLI authenticated and project linked (run from project root).

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Run from project root."
  exit 1
fi

echo "Syncing $ENV_FILE → Vercel (production, preview, development)..."
echo ""

while IFS= read -r line || [ -n "$line" ]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue

  KEY="${line%%=*}"
  VALUE="${line#*=}"
  VALUE="${VALUE%\"}"; VALUE="${VALUE#\"}"
  VALUE="${VALUE%\'}"; VALUE="${VALUE#\'}"
  [ -z "$KEY" ] || [ -z "$VALUE" ] && continue

  echo "→ $KEY"
  # production
  printf '%s' "$VALUE" | vercel env add "$KEY" production --force 2>/dev/null || true
  # preview (all branches, requires --yes)
  vercel env add "$KEY" preview --value "$VALUE" --yes --force 2>/dev/null || true
  # development
  printf '%s' "$VALUE" | vercel env add "$KEY" development --force 2>/dev/null || true

done < "$ENV_FILE"

echo ""
echo "Done. Run 'vercel env ls' to verify."
