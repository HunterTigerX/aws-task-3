# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Install dependencies efficiently
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy only necessary files for build
COPY tsconfig*.json ./
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src

# Build the application
RUN npm install && \
    npm run build && \
    npm prune --production

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Copy only production files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Clean up unnecessary files
RUN find ./node_modules -type d \( -name "test" -o -name "tests" -o -name "docs" -o -name "examples" \) -exec rm -rf {} + && \
    find ./node_modules -type f \( -name "*.md" -o -name "*.ts" -o -name "*.map" \) -delete

# Security: Use non-root user
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

CMD ["node", "dist/main.js"]
