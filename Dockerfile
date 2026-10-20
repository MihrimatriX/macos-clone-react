FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
RUN bun run build && find dist -type f ! -name '*.png' -exec gzip -k9 {} +

FROM nginx:alpine-slim
RUN echo 'gzip_static on;' > /etc/nginx/conf.d/gzip.conf
COPY --from=build /app/dist /usr/share/nginx/html
