# AssetMind Council - Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

ENV PORT=5195

EXPOSE 5195

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5195/health || exit 1

CMD ["uvicorn", "src:app", "--host", "0.0.0.0", "--port", "5195"]