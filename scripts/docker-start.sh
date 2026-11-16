#!/bin/sh
set -e

echo "[start] applying database migrations"
cd /migrate
node node_modules/prisma/build/index.js migrate deploy
node create-admin.mjs

echo "[start] starting web server on port ${PORT:-3000}"
cd /app
exec node server.js
