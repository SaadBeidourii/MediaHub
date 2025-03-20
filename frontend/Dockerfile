# Step 1: Build the Angular app
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 4200

# Ensure correct build path
ENTRYPOINT ["npm", "run", "docker"]
