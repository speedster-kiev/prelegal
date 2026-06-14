$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$dir\.."
if (-not (Test-Path "data")) { New-Item -ItemType Directory -Path "data" | Out-Null }
docker compose up --build -d
Write-Host "Prelegal is running at http://localhost:8000"
