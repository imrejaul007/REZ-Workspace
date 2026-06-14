# AssetMind CI/CD Configuration

# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
addopts = -v --cov=src --cov-report=html --cov-report=term

[coverage:run]
source = src
omit = tests/*

[coverage:report]
precision = 2
show_missing = True
skip_covered = False

# .dockerignore
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/
.pytest_cache/
.coverage
htmlcov/
.env
.venv
venv/
node_modules/

# Dockerfile.example
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

EXPOSE 8000

CMD ["uvicorn", "src:app", "--host", "0.0.0.0", "--port", "8000"]
