$ErrorActionPreference = "Stop"

$appRoot = (
  Resolve-Path (Join-Path $PSScriptRoot "../..")
).Path

$instanceRoot = Join-Path (
  $appRoot
) "tests/first-access/pc-new"

Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host " FACTORYFLOW - RESET DO PRIMEIRO ACESSO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path $instanceRoot)) {
  Write-Host "[FIRST ACCESS] A instancia isolada ja esta limpa." -ForegroundColor Green
  exit 0
}

try {
  Remove-Item `
    -Path $instanceRoot `
    -Recurse `
    -Force
}
catch {
  throw "Nao foi possivel remover a instancia. Feche o FactoryFlow de teste e tente novamente. Detalhes: $($_.Exception.Message)"
}

Write-Host "[FIRST ACCESS] Instancia isolada removida:" -ForegroundColor Green
Write-Host $instanceRoot
Write-Host ""
Write-Host "O banco, a configuracao e as credenciais do ambiente normal nao foram alterados."
