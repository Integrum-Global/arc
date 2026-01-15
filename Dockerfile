# ==============================================================================
# ARC Investment Platform - Backend Dockerfile
# Multi-stage build optimized for Python 3.12+ with uv package manager
# ==============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Install dependencies and build the application
# -----------------------------------------------------------------------------
FROM python:3.12-slim AS builder

# Install uv for fast Python package management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set environment variables for uv
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_PYTHON_DOWNLOADS=never
ENV UV_PYTHON=python3.12

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first for better layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies (without the project itself)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Copy the source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Install the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# -----------------------------------------------------------------------------
# Stage 2: Production - Minimal runtime image
# -----------------------------------------------------------------------------
FROM python:3.12-slim AS production

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd --gid 1000 arc \
    && useradd --uid 1000 --gid arc --shell /bin/bash --create-home arc

WORKDIR /app

# Copy the virtual environment from builder
COPY --from=builder --chown=arc:arc /app/.venv /app/.venv

# Copy source code
COPY --from=builder --chown=arc:arc /app/src /app/src
COPY --from=builder --chown=arc:arc /app/scripts /app/scripts

# Set up environment
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/src:$PYTHONPATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create logs directory
RUN mkdir -p /app/logs && chown -R arc:arc /app/logs

# Switch to non-root user
USER arc

# Expose the API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command - run the Nexus API
CMD ["python", "-m", "uvicorn", "arc.api.app:app", "--host", "0.0.0.0", "--port", "8000"]

# -----------------------------------------------------------------------------
# Stage 3: Development - Includes dev dependencies and hot reload
# -----------------------------------------------------------------------------
FROM python:3.12-slim AS development

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libpq5 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1000 arc \
    && useradd --uid 1000 --gid arc --shell /bin/bash --create-home arc

WORKDIR /app

# Set environment variables for uv
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_PYTHON_DOWNLOADS=never
ENV UV_PYTHON=python3.12

# Copy dependency files
COPY --chown=arc:arc pyproject.toml uv.lock ./

# Install all dependencies including dev
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project

# Copy source code (will be overwritten by volume mount in development)
COPY --chown=arc:arc src/ ./src/
COPY --chown=arc:arc scripts/ ./scripts/
COPY --chown=arc:arc tests/ ./tests/

# Install the project in editable mode
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

# Set up environment
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/src:$PYTHONPATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create logs directory
RUN mkdir -p /app/logs && chown -R arc:arc /app/logs

# Switch to non-root user
USER arc

# Expose the API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Development command with hot reload
CMD ["python", "-m", "uvicorn", "arc.api.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
