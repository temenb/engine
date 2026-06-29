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
COPY services/engine/prisma ./services/engine/prisma/
COPY services/engine/src ./services/engine/src/
COPY services/engine/__tests__ ./services/engine/__tests__/

# ---------- BUILD ----------
FROM base AS build

ENV NODE_ENV=development

RUN corepack enable \
 && pnpm install --frozen-lockfile \
 && pnpm run --filter engine build \
 && pnpm prune --prod


# ---------- DEV ----------
FROM build AS dev

ENV NODE_ENV=development

USER node

EXPOSE 50051

CMD ["pnpm", "--filter", "engine", "start"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9090/livez || exit 1

# ---------- PROD ----------
FROM node:22 AS prod

WORKDIR /usr/src/app

ENV NODE_ENV=production


#COPY --from=build /usr/src/app /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/services/engine/dist ./services/engine/dist
COPY --from=build /usr/src/app/shared/*/dist ./shared/*/dist
COPY --from=build /usr/src/app/shared/*/package.json ./shared/*/package.json

#COPY --from=build /usr/src/app/shared ./shared

USER node

EXPOSE 50051

CMD ["node", "dist/services/engine/src/app.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:9090/livez || exit 1
