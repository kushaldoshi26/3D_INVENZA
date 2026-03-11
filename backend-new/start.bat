@echo off
echo Starting 3D INVENZA Platform v2.0...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Create necessary directories
if not exist "storage\uploads" mkdir storage\uploads
if not exist "storage\processed" mkdir storage\processed
if not exist "storage\outputs" mkdir storage\outputs

REM Start the server
echo.
echo Starting FastAPI server...
echo Platform will be available at: http://localhost:8000
echo API documentation at: http://localhost:8000/docs
echo.

uvicorn main:app --host 0.0.0.0 --port 8000 --reload