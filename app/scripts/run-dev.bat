@echo off
setlocal

rem Este arquivo fica em app\scripts.
rem Volta para a pasta app, onde esta o package.json.
cd /d "%~dp0.."

title FactoryFlow - Desenvolvimento
color 0B
cls

echo.
echo ============================================================
echo                 FACTORYFLOW - DESENVOLVIMENTO
echo ============================================================
echo.

if not exist "package.json" (
  color 0C
  echo ERRO: package.json nao foi encontrado em:
  echo %CD%
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dependencias nao encontradas.
  echo Executando npm install...
  echo.

  call npm install

  if errorlevel 1 (
    color 0C
    echo.
    echo ERRO: nao foi possivel instalar as dependencias.
    echo.
    pause
    exit /b 1
  )
)

call npm run dev
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  color 0C
  echo.
  echo O ambiente de desenvolvimento terminou com erro.
  echo Codigo: %EXIT_CODE%
  echo.
  pause
)

exit /b %EXIT_CODE%
