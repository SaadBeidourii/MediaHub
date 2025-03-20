# Step 1: Build the Angular app
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# Add proxy configuration file
COPY proxy.conf.json ./
COPY . .

EXPOSE 4200

# Ensure correct build path with proxy config
ENTRYPOINT ["npm", "run", "docker"]