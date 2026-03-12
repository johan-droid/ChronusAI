# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including TypeScript for build)
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production

# Add curl and gettext for envsubst
RUN apk add --no-cache curl gettext

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config as template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create non-root user (nginx group already exists in Alpine)
RUN adduser -S nginx -u 1001 -G nginx || true

# Health check (Use the runtime PORT if needed, otherwise rely on orchestrator)
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-80}/health || exit 1

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]

# Use exec form for better signal handling
CMD ["nginx", "-g", "daemon off;"]
