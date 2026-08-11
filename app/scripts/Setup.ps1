$ScriptDir = $PSScriptRoot
$AppDir = Split-Path $ScriptDir -Parent
$AdminDir = Join-Path $ScriptDir "admin"
$DevBuildDir = Join-Path $ScriptDir "dev-build"
$NodeDefaultDir = "C:\Program Files\nodejs"

$Host.UI.RawUI.WindowTitle = "FactoryFlow - Setup"

function Pause-Menu {
    Write-Host ""
    Read-Host "Pressione ENTER para continuar"
}

function Atualizar-Path {
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")

    $env:Path = "$machinePath;$userPath"

    # Em alguns casos o Node ja foi instalado, mas a sessao atual ainda
    # nao recebeu o novo PATH. Garante o caminho padrao nesta sessao.
    if ((Test-Path (Join-Path $NodeDefaultDir "node.exe")) -and
        ($env:Path -notlike "*$NodeDefaultDir*")) {
        $env:Path = "$env:Path;$NodeDefaultDir"
    }
}

function Testar-NodeNpm {
    Atualizar-Path

    $nodeEncontrado = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
    $npmEncontrado = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)

    return ($nodeEncontrado -and $npmEncontrado)
}

function Configurar-Ambiente {
    Clear-Host

    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "     FACTORYFLOW - CONFIGURAR AMBIENTE"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    # Atualiza o PATH antes da verificacao. Isso resolve o caso em que o
    # Node ja esta instalado, mas o terminal foi aberto antes da instalacao.
    Atualizar-Path

    if (Get-Command node -ErrorAction SilentlyContinue) {
        Write-Host "[OK] Node.js instalado: $(node --version)" -ForegroundColor Green
    }
    else {
        Write-Host "[!] Node.js nao encontrado." -ForegroundColor Yellow
        Write-Host ""

        if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
            Write-Host "[ERRO] WinGet nao esta instalado." -ForegroundColor Red
            Write-Host "Instale o App Installer da Microsoft e execute novamente."
            Pause-Menu
            return
        }

        Write-Host "[OK] WinGet encontrado." -ForegroundColor Green
        Write-Host ""
        Write-Host "Instalando Node.js LTS..." -ForegroundColor Cyan
        Write-Host ""

        winget install `
            --id OpenJS.NodeJS.LTS `
            --exact `
            --accept-package-agreements `
            --accept-source-agreements

        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "[ERRO] Falha ao instalar Node.js." -ForegroundColor Red
            Pause-Menu
            return
        }

        Atualizar-Path

        Write-Host ""
        Write-Host "[OK] Instalacao do Node.js concluida." -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Verificando ambiente..." -ForegroundColor Cyan
    Write-Host ""

    Atualizar-Path

    if (Get-Command node -ErrorAction SilentlyContinue) {
        Write-Host "[OK] Node: $(node --version)" -ForegroundColor Green
    }
    else {
        Write-Host "[ERRO] Node.js foi instalado, mas ainda nao esta disponivel nesta sessao." -ForegroundColor Red
        Write-Host "Feche e abra o terminal novamente."
        Pause-Menu
        return
    }

    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Write-Host "[OK] npm:  $(npm --version)" -ForegroundColor Green
    }
    else {
        Write-Host "[ERRO] npm nao encontrado." -ForegroundColor Red
        Write-Host "Feche e abra o terminal novamente e execute o Setup."
        Pause-Menu
        return
    }

    Write-Host ""
    Write-Host "[OK] Ambiente configurado com sucesso." -ForegroundColor Green
    Write-Host ""
    Write-Host "Observacao:" -ForegroundColor Yellow
    Write-Host "O Setup atualizou o PATH desta sessao."
    Write-Host "Se outro terminal ja estava aberto antes da instalacao do Node,"
    Write-Host "feche e abra esse terminal para que ele tambem receba o novo PATH."

    Pause-Menu
}

function Instalar-Dependencias {
    Clear-Host

    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "       FACTORYFLOW - NPM INSTALL"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    Atualizar-Path

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "[ERRO] Node.js nao esta disponivel." -ForegroundColor Red
        Write-Host "Execute primeiro a opcao 1 - Configurar ambiente."
        Pause-Menu
        return
    }

    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "[ERRO] npm nao esta disponivel." -ForegroundColor Red
        Write-Host "Execute primeiro a opcao 1 - Configurar ambiente."
        Pause-Menu
        return
    }

    if (-not (Test-Path (Join-Path $AppDir "package.json"))) {
        Write-Host "[ERRO] package.json nao encontrado em:" -ForegroundColor Red
        Write-Host $AppDir
        Pause-Menu
        return
    }

    Write-Host "Node: $(node --version)" -ForegroundColor Green
    Write-Host "npm:  $(npm --version)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Projeto: $AppDir"
    Write-Host ""
    Write-Host "Executando npm install..." -ForegroundColor Cyan
    Write-Host ""

    Push-Location $AppDir

    try {
        npm install

        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "[OK] Dependencias instaladas." -ForegroundColor Green
        }
        else {
            Write-Host ""
            Write-Host "[ERRO] npm install terminou com erro." -ForegroundColor Red
        }
    }
    finally {
        Pop-Location
    }

    Pause-Menu
}

function Executar-ScriptBat {
    param(
        [Parameter(Mandatory = $true)]
        [string]$NomeArquivo,

        [Parameter(Mandatory = $true)]
        [string]$Descricao
    )

    Atualizar-Path

    $script = Join-Path $DevBuildDir $NomeArquivo

    if (-not (Test-Path $script)) {
        Write-Host "[ERRO] Script nao encontrado:" -ForegroundColor Red
        Write-Host $script
        Pause-Menu
        return
    }

    Write-Host "Executando $Descricao..." -ForegroundColor Cyan
    Write-Host ""

    & $script
}

function Iniciar-Dev {
    Executar-ScriptBat -NomeArquivo "run-dev.bat" -Descricao "ambiente de desenvolvimento"
}

function Executar-Build {
    Executar-ScriptBat -NomeArquivo "run-build.bat" -Descricao "build"
}

function Executar-Portable {
    Executar-ScriptBat -NomeArquivo "run-portable.bat" -Descricao "build portable"
}

function Executar-Release {
    Executar-ScriptBat -NomeArquivo "run-release.bat" -Descricao "release"
}

function Criar-AdminSQLite {
    Clear-Host

    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "     CRIAR ADMINISTRADOR SQLITE"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    Atualizar-Path

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "[ERRO] Node.js nao esta disponivel." -ForegroundColor Red
        Write-Host "Execute primeiro a opcao 1 - Configurar ambiente."
        Pause-Menu
        return
    }

    $script = Join-Path $AdminDir "create-admin-sqlite.bat"

    if (-not (Test-Path $script)) {
        Write-Host "[ERRO] Script nao encontrado:" -ForegroundColor Red
        Write-Host $script
        Pause-Menu
        return
    }

    & $script

    Pause-Menu
}

do {
    Clear-Host

    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "          FACTORYFLOW - SETUP"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[1] Configurar ambiente"                    -ForegroundColor Green
    Write-Host "    - Verificar Node.js"                    -ForegroundColor Green
    Write-Host "    - Instalar Node.js LTS se necessario"   -ForegroundColor Green
    Write-Host "    - Verificar npm"                        -ForegroundColor Green
    Write-Host ""
    Write-Host "[2] Instalar dependencias"                  -ForegroundColor Yellow
    Write-Host "    - npm install"                          -ForegroundColor DarkYellow
    Write-Host ""
    Write-Host "[3] Criar administrador SQLite"
    Write-Host ""
    Write-Host "[4] Iniciar ambiente DEV"                   -ForegroundColor Blue
    Write-Host ""
    Write-Host "[5] Gerar build"
    Write-Host ""
    Write-Host "[6] Gerar portable"
    Write-Host ""
    Write-Host "[7] Gerar release"
    Write-Host ""
    Write-Host "[0] Sair"
    Write-Host ""

    $opcao = Read-Host "Escolha uma opcao"

    switch ($opcao) {
        "1" { Configurar-Ambiente }
        "2" { Instalar-Dependencias }
        "3" { Criar-AdminSQLite }
        "4" { Iniciar-Dev }
        "5" { Executar-Build }
        "6" { Executar-Portable }
        "7" { Executar-Release }
        "0" { Write-Host "Saindo..." }
        default {
            Write-Host ""
            Write-Host "Opcao invalida." -ForegroundColor Yellow
            Start-Sleep -Seconds 1
        }
    }

} while ($opcao -ne "0")
