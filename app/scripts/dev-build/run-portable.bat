@echo off
setlocal

rem Este arquivo fica em app\scripts.
rem Volta para a pasta app, onde estao package.json e electron-builder.yml.
cd /d "%~dp0../.."

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

echo Limpando builds anteriores...
echo.

if exist "out" (
  rmdir /s /q "out"
)

if exist "dist" (
  rmdir /s /q "dist"
)

if exist "dist-installer" (
  rmdir /s /q "dist-installer"
)

echo Executando typecheck e gerando o build da aplicacao...
echo.

call npm run build
set "BUILD_EXIT_CODE=%ERRORLEVEL%"

if not "%BUILD_EXIT_CODE%"=="0" (
  color 0C
  echo.
  echo ERRO: nao foi possivel gerar o build da aplicacao.
  echo Codigo: %BUILD_EXIT_CODE%
  echo.
  pause
  exit /b %BUILD_EXIT_CODE%
)

if not exist "out\main\index.js" (
  color 0C
  echo.
  echo ERRO: o processo principal nao foi gerado:
  echo %CD%\out\main\index.js
  echo.
  pause
  exit /b 1
)

if not exist "out\preload\index.js" (
  color 0C
  echo.
  echo ERRO: o preload nao foi gerado:
  echo %CD%\out\preload\index.js
  echo.
  pause
  exit /b 1
)

if not exist "out\renderer\index.html" (
  color 0C
  echo.
  echo ERRO: o renderer nao foi gerado:
  echo %CD%\out\renderer\index.html
  echo.
  pause
  exit /b 1
)

echo.
echo Build concluido.
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

color 07
echo.
pause
exit /b %EXIT_CODE%