# AssetMind Database Docker
FROM postgres:15-alpine

WORKDIR /app

# Install migrations tools
RUN apk add --no-cache \
    bash \
    curl \
    postgresql-contrib

# Copy schema and migrations
COPY schema/ ./schema/
COPY migrations/ ./migrations/

# Create extensions
RUN echo "CREATE EXTENSION IF NOT EXISTS timescaledb;" | psql -U postgres

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pg_isready -U postgres || exit 1

# Default port
EXPOSE 5432

# Environment variables
ENV POSTGRES_DB=assetmind
ENV POSTGRES_USER=assetmind
ENV POSTGRES_PASSWORD=assetmind_secret

# Initialize database with schema
COPY schema/init.sql /docker-entrypoint-initdb.d/
COPY migrations/*.sql /docker-entrypoint-initdb.d/

CMD ["postgres"]