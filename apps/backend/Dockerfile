# ========== BUILD STAGE ==========
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable pnpm

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/
COPY apps/frontend/ ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build backend
RUN pnpm build:backend

# ========== RUNTIME STAGE ==========
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/main.js"]