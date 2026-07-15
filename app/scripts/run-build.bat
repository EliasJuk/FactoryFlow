@echo off
setlocal

rem Este arquivo fica em app\scripts.
rem Volta para a pasta app, onde esta o package.json.
cd /d "%~dp0.."

title FactoryFlow - Build
color 0B
cls

echo.
echo ============================================================
echo                     FACTORYFLOW - BUILD
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

call npm run dist
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
  color 0C
  echo O build terminou com erro. Codigo: %EXIT_CODE%
) else (
  color 0A
  echo Build concluido com sucesso.
)

echo.
pause
exit /b %EXIT_CODE%
