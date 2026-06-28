# ---------- BASE ----------
FROM node:22 AS base

WORKDIR /usr/src/app

COPY shared ./shared
COPY pnpm-lock.yaml ./
COPY turbo.json ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY services/engine/package*.json ./services/engine/
COPY services/engine/jest.config.js ./services/engine/
COPY services/engine/tsconfig.json ./services/engine/
COPY services/engine/src ./services/engine/src/
COPY services/engine/__tests__ ./services/engine/__tests__/
COPY services/engine/prisma ./services/engine/prisma/


# ---------- DEV ----------
FROM base AS dev
ENV NODE_ENV=development

USER root
RUN corepack enable && pnpm install
RUN chown -R node:node /usr/src/app

USER node

EXPOSE 50051

CMD ["pnpm", "--filter", "engine", "start"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 50051 || exit 1


# ---------- PROD ----------
FROM base AS prod
ENV NODE_ENV=production

USER root
RUN corepack enable && pnpm install --frozen-lockfile --prod && pnpm run --filter engine build
RUN chown -R node:node /usr/src/app

USER node

EXPOSE 50051

CMD ["node", "services/engine/dist/app.js"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 50051 || exit 1
