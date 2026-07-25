$ErrorActionPreference = "Stop"

$appRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path

$paths = @(
  (Join-Path $appRoot "tests/sync/databases/pc-a.db"),
  (Join-Path $appRoot "tests/sync/databases/pc-a.db-wal"),
  (Join-Path $appRoot "tests/sync/databases/pc-a.db-shm"),
  (Join-Path $appRoot "tests/sync/databases/pc-b.db"),
  (Join-Path $appRoot "tests/sync/databases/pc-b.db-wal"),
  (Join-Path $appRoot "tests/sync/databases/pc-b.db-shm"),
  (Join-Path $appRoot "tests/sync/pc-a/user-data"),
  (Join-Path $appRoot "tests/sync/pc-a/config"),
  (Join-Path $appRoot "tests/sync/pc-b/user-data"),
  (Join-Path $appRoot "tests/sync/pc-b/config")
)

foreach ($path in $paths) {
  if (Test-Path $path) {
    Remove-Item $path -Recurse -Force
  }
}

Write-Host "Ambiente de teste PC A / PC B limpo."