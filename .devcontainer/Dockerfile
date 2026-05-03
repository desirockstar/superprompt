FROM node:20

WORKDIR /workspace

RUN npm install -g pnpm

RUN apt-get update && apt-get install -y git socat

# # Install pnpm workspace dependencies
# RUN pnpm install --frozen-lockfile