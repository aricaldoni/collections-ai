#!/bin/bash
# Railway start script for FastAPI application

# Run uvicorn with the correct module path
# Since Railway sets root directory to "api", the app module is at app.main:app
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
