FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Evita que o Puppeteer baixe o Chromium, pois usaremos um serviço remoto
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

VOLUME ["/app/data"]

EXPOSE 3000

CMD ["npm", "start"]
