# Backend Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if any (e.g., for sqlite or numpy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn uvicorn

# Copy app code
COPY . .

# Expose port
EXPOSE 8000

# Run with Gunicorn + Uvicorn
CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
