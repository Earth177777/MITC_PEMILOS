# Use Node.js 18 LTS as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S reactjs -u 1001

# Set proper permissions
RUN chown -R reactjs:nodejs /usr/share/nginx/html
RUN chown -R reactjs:nodejs /var/cache/nginx
RUN chown -R reactjs:nodejs /var/log/nginx
RUN chown -R reactjs:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R reactjs:nodejs /var/run/nginx.pid

# Switch to non-root user
USER reactjs

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]