FROM node:22-bookworm-slim

WORKDIR /app

COPY backend/package*.json ./backend/

RUN npm --prefix backend install

COPY backend ./backend
COPY frontend ./frontend

RUN npm --prefix backend run build

RUN mkdir -p /app/backend/data

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
