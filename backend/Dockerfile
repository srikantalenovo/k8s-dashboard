FROM node:18-alpine

WORKDIR /app

# Install required tools for kubectl
RUN apk add --no-cache curl bash

# Install kubectl (latest stable)
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
    && rm kubectl

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies including devDependencies
RUN npm install

# Copy all files
COPY . .

# Install any additional production dependencies
RUN npm install helmet morgan cors express-validator @kubernetes/client-node@0.22.3 jsonwebtoken express-validator

ENV NODE_ENV=production
ENV PORT=5000
ENV JWT_SECRET=ec846f9100f102b76ab9d31eb2d02c98b2aefa24e3fcb24784b9fdf4fb9a75c7fe361a3e6b12eb01d6eab38498b1d06cd6c761642dcdbd2b76e433179d761cb6
ENV NODE_OPTIONS="--experimental-specifier-resolution=node"


EXPOSE 5000

CMD ["node", "src/server.js"]
