ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine

WORKDIR /workspace

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4200

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
