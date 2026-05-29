FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src/ ./src/
COPY knexfile.js ./
COPY migrations/ ./migrations/
COPY seeds/ ./seeds/

# Create .env placeholder (overridden by docker-compose)
RUN echo "PORT=3001" > .env

EXPOSE 3001

# Run migrations then start
CMD ["sh", "-c", "npx knex migrate:latest && npx knex seed:run && node src/server.js"]
