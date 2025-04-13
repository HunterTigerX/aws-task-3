# Stage 1: Build stage (installs dependencies and builds the app)
# Copy only package files first for optimal caching
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./

# Install production dependencies only (no devDependencies)
RUN npm ci --omit=dev 

# Stage 2: Build NestJS application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the files
COPY . .

# Build the application
RUN npm run build

# Stage 3: Production image (less than 500 MB)
FROM node:20-alpine
WORKDIR /app

# Copy only production necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json .
COPY --from=builder /app/.env.production .env

# Drop root privileges for security
USER node

# Application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Run the application
CMD ["node", "dist/main.js"] 