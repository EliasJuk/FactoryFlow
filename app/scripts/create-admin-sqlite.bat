@echo off
setlocal

rem Vai para a raiz do projeto, partindo da pasta scripts
cd /d "%~dp0.."

color 0B
cls

echo.
echo ============================================================
echo        FACTORYFLOW - CRIAR OU RECUPERAR USUARIO ADMIN
echo ============================================================
echo.

node --version
if errorlevel 1 (
  color 0C
  echo.
  echo ERRO: Node.js nao foi encontrado.
  echo.
  pause
  exit /b 1
)

node --no-warnings "scripts\create-admin-sqlite.cjs" %*

echo.
pause
