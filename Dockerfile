# ── Stage 1: Build Next.js static output ─────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python runtime ───────────────────────────────────────────────────
FROM python:3.12-slim
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.11.16 /uv /usr/local/bin/uv

# Install dependencies before copying source (better layer caching)
COPY backend/pyproject.toml backend/uv.lock ./backend/
RUN cd backend && uv sync --frozen --no-dev --no-install-project

# Copy source and install the package itself
COPY backend/src/ ./backend/src/
RUN cd backend && uv sync --frozen --no-dev

COPY --from=frontend-builder /app/frontend/out ./frontend/out

EXPOSE 8000

CMD ["/app/backend/.venv/bin/uvicorn", "prelegal.main:app", "--host", "0.0.0.0", "--port", "8000"]
