FROM node:16.13.0-alpine as builder
COPY package-lock.json /tmp/package-lock.json
COPY package.json /tmp/package.json
WORKDIR /tmp
RUN npm ci --only=production


FROM node:16.13.0-alpine
ENV NODE_ENV production
RUN apk --no-cache add bash curl dumb-init
USER node
COPY --chown=node:node --from=builder /tmp/node_modules /app/node_modules
COPY --chown=node:node . /app
WORKDIR /app
CMD ["dumb-init", "node", "index.js"]
