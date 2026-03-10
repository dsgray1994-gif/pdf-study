Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot\_bootstrap.ps1"
pip install -r requirements-dev.txt

ruff check . --select=E9,F63,F7,F82
pytest -q
python -c "import importlib; importlib.import_module('$script:APP_MODULE'); print('Import OK:', '$script:APP_MODULE')"

Write-Host "? Local build checks passed"
