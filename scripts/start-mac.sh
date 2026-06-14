#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/.."
mkdir -p data
docker compose up --build -d
echo "Prelegal is running at http://localhost:8000"
