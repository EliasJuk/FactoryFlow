Set-StrictMode -Version Latest

function Get-FactoryFlowPostgresTestSettings {
  [CmdletBinding()]
  param(
    [string]$AppRoot = (
      Resolve-Path (Join-Path $PSScriptRoot "../../..")
    ).Path
  )

  $publicConfigPath = Join-Path (
    $AppRoot
  ) "tests/config/postgres.json"

  $localConfigPath = Join-Path (
    $AppRoot
  ) "tests/config/postgres.local.json"

  if (-not (Test-Path $publicConfigPath)) {
    throw @"
A configuracao publica do PostgreSQL de testes nao foi encontrada:
$publicConfigPath
"@
  }

  if (-not (Test-Path $localConfigPath)) {
    $examplePath = Join-Path (
      $AppRoot
    ) "tests/config/postgres.local.example.json"

    throw @"
A configuracao local do PostgreSQL de testes nao foi encontrada:
$localConfigPath

Crie o arquivo usando este modelo:
$examplePath
"@
  }

  try {
    $publicConfig = Get-Content -Raw $publicConfigPath |
      ConvertFrom-Json

    $localConfig = Get-Content -Raw $localConfigPath |
      ConvertFrom-Json
  }
  catch {
    throw "Nao foi possivel ler os arquivos JSON do PostgreSQL de testes: $($_.Exception.Message)"
  }

  $connection = $publicConfig.connection
  $password = [string]$localConfig.password

  if ($null -eq $connection) {
    throw "A propriedade 'connection' nao existe em postgres.json."
  }

  if ([string]::IsNullOrWhiteSpace([string]$connection.host)) {
    throw "O host do PostgreSQL de testes nao foi configurado."
  }

  $port = 0

  if (
    -not [int]::TryParse(
      [string]$connection.port,
      [ref]$port
    ) -or
    $port -lt 1 -or
    $port -gt 65535
  ) {
    throw "A porta do PostgreSQL de testes e invalida."
  }

  if ([string]::IsNullOrWhiteSpace([string]$connection.database)) {
    throw "O banco do PostgreSQL de testes nao foi configurado."
  }

  if ([string]::IsNullOrWhiteSpace([string]$connection.user)) {
    throw "O usuario do PostgreSQL de testes nao foi configurado."
  }

  if ([string]::IsNullOrWhiteSpace($password)) {
    throw "A senha em postgres.local.json nao foi configurada."
  }

  $timeoutSeconds = 15

  if (
    $null -ne $connection.PSObject.Properties[
      "timeoutSeconds"
    ]
  ) {
    $parsedTimeout = 0

    if (
      -not [int]::TryParse(
        [string]$connection.timeoutSeconds,
        [ref]$parsedTimeout
      ) -or
      $parsedTimeout -lt 1
    ) {
      throw "O timeout do PostgreSQL de testes e invalido."
    }

    $timeoutSeconds = $parsedTimeout
  }

  $ssl = $false

  if (
    $null -ne $connection.PSObject.Properties[
      "ssl"
    ]
  ) {
    $ssl = [bool]$connection.ssl
  }

  [PSCustomObject]@{
    AppRoot = $AppRoot

    PublicConfigPath = $publicConfigPath
    LocalConfigPath = $localConfigPath

    Host = [string]$connection.host
    Port = $port
    Database = [string]$connection.database
    User = [string]$connection.user
    Password = $password
    TimeoutSeconds = $timeoutSeconds
    Ssl = $ssl
  }
}

function Set-FactoryFlowPostgresTestEnvironment {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [PSCustomObject]$Settings
  )

  $env:PGHOST = $Settings.Host
  $env:PGPORT = [string]$Settings.Port
  $env:PGDATABASE = $Settings.Database
  $env:PGUSER = $Settings.User
  $env:PGPASSWORD = $Settings.Password

  $env:FACTORYFLOW_POSTGRES_TIMEOUT_SECONDS = (
    [string]$Settings.TimeoutSeconds
  )

  if ($Settings.Ssl) {
    $env:FACTORYFLOW_POSTGRES_SSL = "true"
  }
  else {
    $env:FACTORYFLOW_POSTGRES_SSL = "false"
  }
}

function Write-FactoryFlowSyncInstanceConfig {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [string]$TemplatePath,

    [Parameter(Mandatory)]
    [string]$TargetPath,

    [Parameter(Mandatory)]
    [PSCustomObject]$Settings
  )

  if (-not (Test-Path $TemplatePath)) {
    throw "O template da instancia nao foi encontrado: $TemplatePath"
  }

  try {
    $config = Get-Content -Raw $TemplatePath |
      ConvertFrom-Json
  }
  catch {
    throw "Nao foi possivel ler o template da instancia: $($_.Exception.Message)"
  }

  if ($null -eq $config.database) {
    throw "O template da instancia nao possui a propriedade 'database'."
  }

  $postgresConfig = [PSCustomObject][ordered]@{
    host = $Settings.Host
    port = $Settings.Port
    database = $Settings.Database
    user = $Settings.User
    timeoutSeconds = $Settings.TimeoutSeconds
    ssl = $Settings.Ssl
  }

  $postgresProperty = $config.database.PSObject.Properties[
    "postgres"
  ]

  if ($null -eq $postgresProperty) {
    $config.database |
      Add-Member `
        -MemberType NoteProperty `
        -Name "postgres" `
        -Value $postgresConfig
  }
  else {
    $config.database.postgres = $postgresConfig
  }

  $targetDirectory = Split-Path -Parent $TargetPath

  if (-not (Test-Path $targetDirectory)) {
    New-Item `
      -ItemType Directory `
      -Force `
      -Path $targetDirectory |
      Out-Null
  }

  $json = $config |
    ConvertTo-Json -Depth 20

  # Windows PowerShell 5.1 grava BOM com Set-Content -Encoding UTF8.
  # O JSON.parse do Node/Electron nao aceita esse caractere no inicio.
  $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)

  [System.IO.File]::WriteAllText(
    $TargetPath,
    $json,
    $utf8WithoutBom
  )
}
