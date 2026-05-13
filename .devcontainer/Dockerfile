FROM node:20

WORKDIR /workspace

RUN npm install -g pnpm

RUN apt-get update && apt-get install -y git socat

# Copy project files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages/
COPY apps apps/

# Install pnpm workspace dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages
RUN pnpm --filter @superprompt/db build || (echo "=== DB BUILD FAILED ===" && cat packages/db/dist/*.ts 2>/dev/null || echo "No dist files")
RUN pnpm --filter @superprompt/types build
RUN pnpm --filter @superprompt/utils build