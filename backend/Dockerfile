FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json tsconfig.json ./
COPY prisma/ ./prisma/
RUN npm install
RUN npx prisma generate
COPY src/ ./src/
RUN npx tsc

FROM node:20-alpine

WORKDIR /app
COPY package.json ./
COPY prisma/ ./prisma/
RUN npm install --omit=dev
RUN npx prisma generate
COPY --from=builder /app/dist/ ./dist/
COPY db/ ./db/

EXPOSE 3000

CMD ["node", "dist/index.js"]
