# Angular App Dockerfile for Supabase Lite deployment
# Expects pre-built artifacts from: npm run build -- --configuration=docker

FROM node:20-alpine
WORKDIR /app

# Copy pre-built artifacts and package files
COPY dist/angular-starter ./dist/angular-starter
COPY package*.json ./

# Install production dependencies only (--ignore-scripts skips husky setup)
RUN npm ci --omit=dev --ignore-scripts

# Expose port and set environment
EXPOSE 4200
ENV PORT=4200
ENV NODE_ENV=production

# Start SSR server
CMD ["node", "dist/angular-starter/server/server.mjs"]
