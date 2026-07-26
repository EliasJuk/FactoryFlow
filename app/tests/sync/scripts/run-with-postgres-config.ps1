[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidateNotNullOrEmpty()]
  [string]$NpmScript
)

$ErrorActionPreference = "Stop"

$appRoot = (
  Resolve-Path (Join-Path $PSScriptRoot "../../..")
).Path

$configModule = Join-Path (
  $PSScriptRoot
) "postgres-test-config.ps1"

if (-not (Test-Path $configModule)) {
  throw "O carregador do PostgreSQL de testes nao foi encontrado: $configModule"
}

. $configModule

$settings = Get-FactoryFlowPostgresTestSettings `
  -AppRoot $appRoot

Set-FactoryFlowPostgresTestEnvironment `
  -Settings $settings

Write-Host ""
Write-Host "[POSTGRES TEST] Configuracao carregada"
Write-Host "[POSTGRES TEST] Host: $($settings.Host)"
Write-Host "[POSTGRES TEST] Port: $($settings.Port)"
Write-Host "[POSTGRES TEST] Database: $($settings.Database)"
Write-Host "[POSTGRES TEST] User: $($settings.User)"
Write-Host "[POSTGRES TEST] Password configurada: True"
Write-Host ""

Set-Location $appRoot

try {
  & npm.cmd run $NpmScript
  $result = $LASTEXITCODE
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

exit $result
