$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$dir\.."
docker compose down
Write-Host "Prelegal stopped."
