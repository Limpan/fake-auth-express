# Install dependencies
FROM node:20.7.0-bookworm-slim as build
RUN npm upgrade -g npm

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm clean-install

COPY . .
RUN npm run build

# Production image
FROM node:20.7.0-bookworm-slim

WORKDIR /app

COPY entrypoint.sh /

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist .
COPY src/views/ ./views/

EXPOSE 8000

ENV PORT 8000

ENTRYPOINT [ "/entrypoint.sh" ]
CMD [ "node", "index.js" ]
