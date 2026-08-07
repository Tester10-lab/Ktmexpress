FROM node:20 AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV UV_THREADPOOL_SIZE=4
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
