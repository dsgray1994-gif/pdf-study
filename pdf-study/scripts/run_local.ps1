Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot\_bootstrap.ps1"
streamlit run $script:APP_ENTRY
