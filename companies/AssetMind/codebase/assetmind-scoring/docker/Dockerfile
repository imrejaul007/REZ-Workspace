# AssetMind Scoring Services Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Expose ports for all 9 scoring services
EXPOSE 5070 5071 5072 5073 5074 5075 5076 5077 5078

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5070/health || exit 1

# Run
CMD ["uvicorn", "src.services.health_score_service:app", "--host", "0.0.0.0", "--port", "5070"]
