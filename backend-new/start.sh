#!/bin/bash
# start.sh

echo "🚀 Starting 3D INVENZA Core API..."

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Create directories
echo "📁 Creating storage directories..."
mkdir -p storage/uploads
mkdir -p storage/processed  
mkdir -p storage/outputs

# Start server
echo "🔥 Starting FastAPI server..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000