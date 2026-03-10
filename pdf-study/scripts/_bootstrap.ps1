Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-AppEntry {
  if (Test-Path "app.py") { return "app.py" }

  $candidates = Get-ChildItem -Path "." -Filter "*.py" -File
  foreach ($f in $candidates) {
    $txt = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    if (($txt -match "import\s+streamlit" -or $txt -match "from\s+streamlit") -and $txt -match "st\.set_page_config") {
      return $f.Name
    }
  }

  foreach ($f in $candidates) {
    $txt = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    if ($txt -match "import\s+streamlit" -or $txt -match "from\s+streamlit") {
      return $f.Name
    }
  }

  if (Test-Path "main.py") { return "main.py" }
  throw "Could not determine Streamlit entrypoint."
}

$script:APP_ENTRY = Get-AppEntry
$script:APP_MODULE = [System.IO.Path]::GetFileNameWithoutExtension($script:APP_ENTRY)

if (!(Test-Path ".venv")) { python -m venv .venv }

. .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

Write-Host "? Bootstrapped venv. APP_ENTRY=$script:APP_ENTRY APP_MODULE=$script:APP_MODULE"
