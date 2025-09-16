#!/bin/bash

# Wait for the Docker daemon to be ready
until docker info >/dev/null 2>&1; do
  echo "Waiting for Docker daemon to be ready..."
  sleep 1
done

echo "Docker daemon is ready."
