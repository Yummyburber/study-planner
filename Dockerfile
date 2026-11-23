FROM node:20-bookworm-slim

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY backend ./backend
COPY Frontend ./Frontend

ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIRECTORY=/app/data

RUN mkdir -p /app/data
EXPOSE 8080

CMD ["node", "backend/server.js"]
