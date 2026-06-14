# Stage 1: Build
FROM node:20-alpine as build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy the built assets to Nginx
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Add custom Nginx configuration to support React Router
RUN echo 'server { \
    listen       80; \
    server_name  localhost; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
