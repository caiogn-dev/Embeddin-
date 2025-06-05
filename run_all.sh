#!/bin/bash
set -e

# 1. Check/install Ollama
if ! command -v ollama &> /dev/null; then
  echo "[INFO] Ollama not found. Installing..."
  curl -fsSL https://ollama.com/install.sh | sh
else
  echo "[OK] Ollama is installed."
fi

# 2. Pull Ollama model (example: llama3)
if ! ollama list | grep -q "nomic-embed-text"; then
  echo "[INFO] Pulling Ollama model: nomic-embed-text..."
  ollama pull nomic-embed-text
else
  echo "[OK] Ollama model 'nomic-embed-text' is available."
fi

# 3. Check/install Docker
if ! command -v docker &> /dev/null; then
  echo "[ERROR] Docker is not installed. Please install Docker manually."
  exit 1
else
  echo "[OK] Docker is installed."
fi

# 4. Start TimescaleDB (with vector extension)
if sudo docker ps -a --format '{{.Names}}' | grep -q '^timescaledb-rag$'; then
  # Container exists
  if sudo docker ps --format '{{.Names}}' | grep -q '^timescaledb-rag$'; then
    echo "[OK] TimescaleDB container is running."
  else
    echo "[INFO] Starting existing TimescaleDB Docker container..."
    sudo docker start timescaledb-rag
    sleep 5
  fi
else
  echo "[INFO] Creating and starting TimescaleDB Docker container..."
  sudo docker run -d --name timescaledb-rag -e POSTGRES_PASSWORD=password -e POSTGRES_DB=rag_db -p 5432:5432 timescale/timescaledb-ha:pg17
  sleep 10
fi

# 5. Enable vector extension (if not already)
sudo docker exec -u postgres timescaledb-rag psql -d rag_db -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 6. Python venv and backend dependencies
cd beckend
if [ -d "venv" ]; then
  echo "[OK] Python venv já existe."
else
  echo "[INFO] Criando Python venv..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# 7. Frontend dependencies
if [ ! -d "node_modules" ]; then
  echo "[INFO] Installing frontend dependencies..."
  npm install
fi

# 8. Run backend migrations
cd beckend
source venv/bin/activate
python manage.py migrate
cd ..

# 9. Start all services
# Start backend
cd beckend && source venv/bin/activate && nohup python manage.py runserver 0.0.0.0:8000 &
cd ..
# Start frontend
nohup npm run dev &
# Start Ollama (if not running)
if ! pgrep -f "ollama serve" > /dev/null; then
  nohup ollama serve &
fi

echo "[SUCCESS] All services started."
echo "- Backend: http://localhost:8000"
echo "- Frontend: http://localhost:8080"
echo "- TimescaleDB: localhost:5432 (db: rag_db, user: postgres, pass: password)"
echo "- Ollama: http://localhost:11434"
