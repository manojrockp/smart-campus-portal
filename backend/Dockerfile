# Use Debian-based Node image
FROM node:18-bullseye

# Install OpenSSL 1.1
RUN apt-get update && apt-get install -y \
    openssl \
    libssl1.1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Generate Prisma client with specific binary target
RUN npx prisma generate

# Create non-root user
RUN groupadd -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nodejs

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port your server uses
EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"]