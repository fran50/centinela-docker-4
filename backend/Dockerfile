FROM node:22-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY app.js ./app.js

EXPOSE 3001 8080

HEALTHCHECK --interval=15s --timeout=4s --retries=8 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/estado').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "app.js"]
