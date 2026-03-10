Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot\_bootstrap.ps1"
pip install -r requirements-dev.txt

Write-Host "? Starter pack ready."
Write-Host "Run checks: .\scripts\test_local.ps1"
Write-Host "Run app:    .\scripts\run_local.ps1"
