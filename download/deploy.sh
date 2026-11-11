#!/usr/bin/env bash
# =============================================================================
# GÖDEL HYPERCHIP — local deploy script
# Run this from inside the extracted project folder.
#
#   ./deploy.sh init     # first time: install deps + init git + push to GitHub
#   ./deploy.sh push     # subsequent: commit changes + push to GitHub
#   ./deploy.sh vercel   # deploy to Vercel production (aumnium.tech/demo)
# =============================================================================
set -e

REMOTE_URL="https://github.com/ShieldCubed/demo.git"

cmd="${1:-help}"

case "$cmd" in
  init)
    echo "==> Installing dependencies (bun)"
    if command -v bun >/dev/null 2>&1; then
      bun install
    else
      npm install
    fi

    echo "==> Initializing git"
    if [ ! -d .git ]; then
      git init -b main
    fi
    git remote remove origin 2>/dev/null || true
    git remote add origin "$REMOTE_URL"
    git add -A
    git commit -m "Photorealistic GÖDEL Hyperchip render (Next.js 16 + R3F)" || true
    echo "==> Pushing to GitHub (origin main)"
    git push -u origin main --force-with-lease
    echo
    echo "Done. Repo is at: $REMOTE_URL"
    echo "Next step: ./deploy.sh vercel"
    ;;

  push)
    echo "==> Committing changes"
    git add -A
    git commit -m "Update GÖDEL Hyperchip render" || true
    echo "==> Pushing to GitHub"
    git push origin main
    echo "Done."
    ;;

  vercel)
    echo "==> Deploying to Vercel production"
    if ! command -v vercel >/dev/null 2>&1; then
      echo "Vercel CLI not found. Installing…"
      npm install -g vercel
    fi
    vercel --prod
    echo
    echo "If you haven't yet, add the aumnium.tech domain in:"
    echo "  Vercel dashboard → Project → Settings → Domains → Add"
    echo "  - aumnium.tech          (apex)"
    echo "  - aumnium.tech/demo     (subpath rewrite — handled by next.config.ts basePath)"
    ;;

  help|*)
    cat <<EOF
GÖDEL HYPERCHIP deploy commands:

  ./deploy.sh init     # first time — install deps, git init, push to ShieldCubed/demo
  ./deploy.sh push     # push later commits
  ./deploy.sh vercel   # deploy current main to Vercel production

The project is preconfigured with basePath="/demo" so once Vercel routes
aumnium.tech/demo/* to this Next.js app, every asset and route resolves correctly.
EOF
    ;;
esac
