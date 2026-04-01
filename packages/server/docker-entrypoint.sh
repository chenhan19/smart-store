#!/bin/sh
# Wait for MySQL to be ready before starting the server
set -e

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."

until nc -z "${DB_HOST}" "${DB_PORT}"; do
  echo "MySQL not ready, retrying in 2s..."
  sleep 2
done

echo "MySQL is ready. Starting server..."
exec "$@"
