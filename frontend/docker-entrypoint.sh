#!/bin/sh
set -e

# Default values if not provided
export PORT=${PORT:-80}
export BACKEND_URL=${BACKEND_URL:-http://backend:8000}

# Replace environment variables in nginx.conf
# We use envsubst to substitute variables
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the passed command
exec "$@"
