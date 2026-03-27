FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Install a simple static server
RUN npm install -g serve

# Expose the Cloud Run default port
EXPOSE 8080

# Serve the app
CMD ["serve", "-s", "build", "-l", "tcp://0.0.0.0:8080"]
