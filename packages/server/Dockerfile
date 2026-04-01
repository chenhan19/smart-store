# ---- Build stage ----
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Build shared (outputs to packages/shared/dist)
RUN pnpm --filter @smart-shop/shared build

# Patch shared's main to point to compiled output so server tsc can resolve it
RUN node -e "\
  const fs = require('fs'); \
  const p = './packages/shared/package.json'; \
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8')); \
  pkg.main = 'dist/index.js'; \
  pkg.types = 'dist/index.d.ts'; \
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2)); \
"

# Build server
RUN pnpm --filter @smart-shop/server build

# ---- Runtime stage ----
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:20-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Patch shared main for runtime
RUN node -e "\
  const fs = require('fs'); \
  const p = './packages/shared/package.json'; \
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8')); \
  pkg.main = 'dist/index.js'; \
  pkg.types = 'dist/index.d.ts'; \
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2)); \
"

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/server/dist ./packages/server/dist

# Add netcat for healthcheck wait script
RUN apk add --no-cache netcat-openbsd

COPY packages/server/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "packages/server/dist/app.js"]
