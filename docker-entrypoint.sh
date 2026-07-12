#!/bin/sh
set -e

echo "Running database migrations..."
node database/migrate.js

echo "Starting bot..."
exec npm start

