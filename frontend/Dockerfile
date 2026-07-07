FROM node:22-bookworm-slim AS build
WORKDIR /app

ENV NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_METEO_WS_URL=ws://localhost:8080/meteo
ARG VITE_METEO_API_URL=http://localhost:3001
ENV VITE_METEO_WS_URL=$VITE_METEO_WS_URL
ENV VITE_METEO_API_URL=$VITE_METEO_API_URL

RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
