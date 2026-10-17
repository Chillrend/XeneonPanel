# ==============================================================================
# XeneonPanel — Multi-Stage Production Dockerfile
# ==============================================================================

# Stage 1: Build frontend and compile static assets
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Stage 2: Production runtime image
FROM node:24-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY agent ./agent

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Persistent directory for SQLite database
VOLUME ["/app/server/data"]

# Healthcheck verifying HTTP status endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/status || exit 1

CMD ["npm", "run", "server"]
