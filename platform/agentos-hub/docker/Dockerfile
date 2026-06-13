# AgentOS Hub - Unified Agent Orchestration Platform
# Multi-stage Dockerfile for optimized production builds

# ==============================================================================
# Stage 1: Builder
# ==============================================================================
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ==============================================================================
# Stage 2: Development
# ==============================================================================
FROM python:3.11-slim as development

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY config/ ./config/

# Install development dependencies
RUN pip install --no-cache-dir pytest pytest-asyncio black isort mypy

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV LOG_LEVEL=INFO

# Expose ports
EXPOSE 8000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Default command
CMD ["python", "-m", "uvicorn", "src.api.gateway:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]

# ==============================================================================
# Stage 3: Production
# ==============================================================================
FROM python:3.11-slim as production

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd -r agentos && useradd -r -g agentos agentos

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# Copy source code
COPY --chown=agentos:agentos src/ ./src/
COPY --chown=agentos:agentos config/ ./config/

# Switch to non-root user
USER agentos

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV LOG_LEVEL=INFO
ENV WORKERS=4
ENV WORKER_CLASS=uvicorn.workers.UvicornWorker

# Expose ports
EXPOSE 8000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Default command
CMD ["gunicorn", "--config", "gunicorn_config.py", "src.api.gateway:create_app"]

# ==============================================================================
# Stage 4: Minimal (for specific components)
# ==============================================================================
FROM python:3.11-slim as minimal

WORKDIR /app

# Install minimal dependencies
RUN pip install --no-cache-dir --upgrade pip

# Copy only necessary files
COPY requirements-minimal.txt .
RUN pip install --no-cache-dir -r requirements-minimal.txt

COPY src/core/ ./src/core/

ENV PYTHONPATH=/app

CMD ["python", "-c", "from src.core import AgentOrchestrator; print('AgentOS Hub Core loaded')"]
