# AssetMind Yahoo Finance Connector - Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

ENV PORT=5010

EXPOSE 5010

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5010/health || exit 1

CMD ["uvicorn", "src:app", "--host", "0.0.0.0", "--port", "5010"]