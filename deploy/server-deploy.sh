#!/usr/bin/env sh
set -eu

APP_DIR="${BRIDGENEWS_DIR:-/opt/bridgenews}"
cd "$APP_DIR"

if [ ! -f .env.production ]; then
  echo "Missing $APP_DIR/.env.production" >&2
  exit 1
fi

set -a
. ./.env.production
set +a

if [ -z "${SITE_DOMAIN:-}" ]; then
  echo "SITE_DOMAIN must be set in .env.production" >&2
  exit 1
fi

echo "Updating BridgeNews from main..."
git fetch --prune origin main
git checkout main
git reset --hard origin/main

echo "Building production container..."
docker compose -f docker-compose.production.yml build --pull web

echo "Starting BridgeNews..."
docker compose -f docker-compose.production.yml up -d --remove-orphans

echo "Cleaning unused images..."
docker image prune -f >/dev/null 2>&1 || true

echo "Deployment complete: https://$SITE_DOMAIN"
