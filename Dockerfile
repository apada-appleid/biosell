FROM node:18.20.4-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY . .

RUN yarn db:generate
RUN yarn build

FROM node:18.20.4-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["yarn", "start"]
