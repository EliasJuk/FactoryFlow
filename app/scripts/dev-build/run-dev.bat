```bat
@echo off
setlocal

rem Este arquivo fica em app\scripts\dev-build.
rem Volta duas pastas para app, onde esta o package.json.
cd /d "%~dp0../.."

title FactoryFlow - Desenvolvimento
color 01
cls

echo.
echo ============================================================
echo                 FACTORYFLOW - DESENVOLVIMENTO
echo ============================================================
echo.

rem ============================================================
rem Verificar projeto
rem ============================================================

if not exist "package.json" (
  color 01
  echo ERRO: package.json nao foi encontrado em:
  echo %CD%
  echo.
  pause
  exit /b 1
)

rem ============================================================
rem Verificar Node.js
rem ============================================================

where node >nul 2>&1

if errorlevel 1 (
  color 01
  echo ERRO: Node.js nao foi encontrado.
  echo.
  echo Execute o Setup e escolha:
  echo [1] Configurar ambiente
  echo.
  pause
  exit /b 1
)

echo Node.js:
node --version
echo.

rem ============================================================
rem Verificar npm
rem ============================================================

where npm >nul 2>&1

if errorlevel 1 (
  color 01
  echo ERRO: npm nao foi encontrado.
  echo.
  echo Execute o Setup e escolha:
  echo [1] Configurar ambiente
  echo.
  pause
  exit /b 1
)

echo npm:
call npm --version
echo.

rem ============================================================
rem Verificar dependencias
rem ============================================================

if not exist "node_modules" (
  echo Dependencias nao encontradas.
  echo Executando npm install...
  echo.

  call npm install

  if errorlevel 1 (
    color 01
    echo.
    echo ERRO: nao foi possivel instalar as dependencias.
    echo.
    pause
    exit /b 1
  )
)

rem ============================================================
rem Iniciar ambiente de desenvolvimento
rem ============================================================

echo.
echo Iniciando FactoryFlow...
echo.

call npm run dev
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  color 01
  echo.
  echo O ambiente de desenvolvimento terminou com erro.
  echo Codigo: %EXIT_CODE%
  echo.
  pause
)

color 07
exit /b %EXIT_CODE%
```