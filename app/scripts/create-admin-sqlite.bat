@echo off
setlocal

rem Este arquivo fica em app\scripts.
rem Volta para app para localizar database\factoryflow.db.
cd /d "%~dp0.."

title FactoryFlow - Recuperar Administrador
color 0B
cls

echo.
echo ============================================================
echo        FACTORYFLOW - CRIAR OU RECUPERAR USUARIO ADMIN
echo ============================================================
echo.

node --version >nul 2>&1
if errorlevel 1 (
  color 0C
  echo ERRO: Node.js nao foi encontrado.
  echo.
  pause
  exit /b 1
)

if not exist "scripts\create-admin-sqlite.cjs" (
  color 0C
  echo ERRO: o arquivo abaixo nao foi encontrado:
  echo %CD%\scripts\create-admin-sqlite.cjs
  echo.
  pause
  exit /b 1
)

node --no-warnings "scripts\create-admin-sqlite.cjs" %*
set "EXIT_CODE=%ERRORLEVEL%"

echo.
pause
exit /b %EXIT_CODE%
