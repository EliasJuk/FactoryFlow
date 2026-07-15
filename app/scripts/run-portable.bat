@echo off
setlocal

rem Este arquivo fica em app\scripts.
rem Volta para a pasta app, onde estao package.json e electron-builder.yml.
cd /d "%~dp0.."

title FactoryFlow - Portable
color 0B
cls

echo.
echo ============================================================
echo                    FACTORYFLOW - PORTABLE
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

if not exist "electron-builder.yml" (
  color 0C
  echo ERRO: electron-builder.yml nao foi encontrado em:
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

echo Gerando executavel portable...
echo.

call npx electron-builder --config electron-builder.yml --win portable
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
  color 0C
  echo A geracao do portable terminou com erro.
  echo Codigo: %EXIT_CODE%
) else (
  color 0A
  echo Portable gerado com sucesso.
  echo.
  echo Verifique a pasta de saida configurada no electron-builder.yml.
)

echo.
pause
exit /b %EXIT_CODE%
