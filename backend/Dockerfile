# Stage 1: Build
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim as runner

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local
COPY . .

# Ensure scripts are executable
RUN chmod +x start.sh

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Create and use non-root user
RUN useradd --create-home app && chown -R app:app /app
USER app

EXPOSE 8000

CMD ["./start.sh"]
