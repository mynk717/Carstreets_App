#!/bin/bash
set -e

echo "🐋 Setting up Tabby with Docker restart handling..."

# Wait for Docker daemon to be ready
until docker info >/dev/null 2>&1; do
  echo "⏳ Waiting for Docker daemon..."
  sleep 3
done
echo "✅ Docker daemon is ready!"

# Clean up any existing containers and images to avoid layer conflicts
echo "🧹 Cleaning up existing Docker state..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker rmi $(docker images -q) 2>/dev/null || true
docker system prune -a -f

# Restart Docker daemon to clear any corruption
echo "🔄 Restarting Docker daemon..."
sudo pkill dockerd || true
sudo pkill containerd || true
sleep 2
bash /usr/local/share/docker-init.sh &
sleep 5

# Wait for Docker to be ready again
until docker info >/dev/null 2>&1; do
  echo "⏳ Waiting for Docker daemon to restart..."
  sleep 3
done

# Pull Tabby image
echo "📥 Pulling Tabby image..."
docker pull tabbyml/tabby:latest

# Create data directory
mkdir -p $HOME/.tabby

# Start Tabby server
echo "🚀 Starting Tabby server..."
docker run -d \
  --name tabby-server \
  --restart unless-stopped \
  -p 8080:8080 \
  -v $HOME/.tabby:/data \
  tabbyml/tabby:latest serve --model StarCoder-1B --host 0.0.0.0

# Wait for server to be ready
echo "⏳ Waiting for Tabby server to start..."
for i in {1..60}; do
  if curl -f -s http://localhost:8080/v1/health >/dev/null 2>&1; then
    echo "✅ Tabby server is running successfully!"
    echo "🌐 Server available at: http://localhost:8080"
    exit 0
  fi
  
  if [ $((i % 10)) -eq 0 ]; then
    echo "⏳ Still waiting... (attempt $i/60)"
    docker logs --tail 5 tabby-server 2>/dev/null || true
  fi
  
  sleep 5
done

echo "❌ Server startup timed out. Check logs:"
docker logs tabby-server
exit 1
