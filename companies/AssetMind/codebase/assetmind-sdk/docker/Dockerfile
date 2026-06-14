# AssetMind SDK Docker
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy SDK
COPY python/ ./python/

# Install SDK in development mode
RUN pip install -e ./python/

# Create non-root user
RUN useradd -m sdkuser && chown -R sdkuser:sdkuser /app
USER sdkuser

# Verify installation
RUN python -c "from assetmind import __version__; print(f'AssetMind SDK v{__version__} installed')"

# Default command
CMD ["python", "-c", "print('AssetMind SDK ready')"]