FROM node:24-bookworm-slim AS dependencies
WORKDIR /workspace
RUN chown node:node /workspace
USER node
COPY --chown=node:node apps/back/package.json apps/back/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY --chown=node:node apps/back/ .
COPY --chown=node:node infra/database/migrations/ ./migrations/
ENV PORT=3000 MIGRATIONS_DIR=/workspace/migrations

FROM dependencies AS development
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM dependencies AS build
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM node:24-bookworm-slim AS production
WORKDIR /workspace
ENV NODE_ENV=production PORT=3000 MIGRATIONS_DIR=/workspace/migrations
COPY --from=build --chown=node:node /workspace/package*.json ./
COPY --from=build --chown=node:node /workspace/node_modules/ ./node_modules/
COPY --from=build --chown=node:node /workspace/dist/ ./dist/
COPY --from=build --chown=node:node /workspace/migrations/ ./migrations/
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
