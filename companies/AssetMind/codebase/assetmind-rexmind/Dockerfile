# AssetMind RexMind AI - Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY src/ ./src/

# Environment
ENV PORT=5160
ENV CUDA_VISIBLE_DEVICES=0

# Expose port
EXPOSE 5160

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5160/health || exit 1

# Run
CMD ["uvicorn", "src:app", "--host", "0.0.0.0", "--port", "5160"]