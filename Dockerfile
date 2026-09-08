# Stage 1: build the React frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin API. Set explicitly so the build never depends on frontend/.env,
# which is gitignored and therefore absent from the uploaded build context.
ENV REACT_APP_BACKEND_URL=""
RUN npm run build

# Stage 2: FastAPI serves /api + the built frontend from one process
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ backend/
COPY --from=frontend /app/frontend/build frontend/build
WORKDIR /app/backend
ENV PORT=8001
EXPOSE 8001
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT}
