@echo off
setlocal

rem Este arquivo fica em app\scripts.
rem Volta para a pasta app, onde esta o electron-builder.yml.
cd /d "%~dp0../.."

title FactoryFlow - Release
color 0B
cls

echo.
echo ============================================================
echo                    FACTORYFLOW - RELEASE
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

call npx electron-builder --config electron-builder.yml
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
  color 0C
  echo A geracao da release terminou com erro. Codigo: %EXIT_CODE%
) else (
  color 0A
  echo Release gerada com sucesso.
)

color 07
echo.
pause
exit /b %EXIT_CODE%
