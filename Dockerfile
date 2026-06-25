FROM node:22
ENV NODE_ENV=development

WORKDIR /usr/src/app/

COPY shared/ ./shared/
COPY turbo.json  ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY services/engine/package*.json ./services/engine/
COPY services/engine/jest.config.js ./services/engine/
COPY services/engine/tsconfig.json ./services/engine/
COPY services/engine/src ./services/engine/src/
COPY services/engine/prisma ./services/engine/prisma/
COPY services/engine/__tests__ ./services/engine/__tests__/
COPY services/engine/.env ./services/engine/.env

USER root

RUN apt-get clean && \
    mkdir -p /var/lib/apt/lists/partial && \
    apt-get update && \
    apt-get install -y netcat-openbsd

RUN corepack enable && pnpm install
RUN cd /usr/src/app/services/engine && npx prisma generate
RUN chown -R node:node /usr/src/app

USER node

EXPOSE 50051

CMD ["pnpm", "--filter", "engine", "start"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 50051 || exit 1
