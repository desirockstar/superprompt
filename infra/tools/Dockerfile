FROM node:22-alpine

RUN apk add --no-cache \
    curl \
    git \
    jq \
    bash \
    openssh-client \
    docker-cli \
    docker-cli-compose

RUN curl -fsSL https://get.pulumi.com | sh && \
    ln -sf /root/.pulumi/bin/pulumi /usr/local/bin/pulumi && \
    curl -sL https://github.com/cli/cli/releases/download/v2.64.0/gh_2.64.0_linux_amd64.tar.gz | tar -xz -C /tmp && \
    mv /tmp/gh_2.64.0_linux_amd64/bin/gh /usr/local/bin/gh && \
    rm -rf /tmp/gh_2.64.0_linux_amd64

RUN npm install -g pnpm tsx

WORKDIR /workspace