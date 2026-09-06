# Multi-stage Dockerfile for DataStage ETL Modernization Suite
# 1. Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
COPY server.ts ./

# Run linting and production build
RUN npm run lint
RUN npm run build

# 2. Production Runtime Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled build output from builder stage
COPY --from=builder /app/dist ./dist

# Expose web application port
EXPOSE 3000

# Start compiled server
CMD ["node", "dist/server.cjs"]
