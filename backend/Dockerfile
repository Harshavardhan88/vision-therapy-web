
FROM python:3.10-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend

# Expose port (internal)
EXPOSE 8000

# Run commands from root to keep module imports working
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
