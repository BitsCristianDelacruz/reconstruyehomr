FROM node:24-bookworm-slim AS dependencies
WORKDIR /workspace
RUN chown node:node /workspace
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY --chown=node:node . .

# Static files for Azure Static Web Apps: /workspace/dist/front/browser
FROM dependencies AS build
RUN npm run build

FROM dependencies AS development
ENV NG_CLI_ANALYTICS=false
EXPOSE 4200
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--poll", "1000"]
