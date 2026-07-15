@echo off
setlocal
cd /d "%~dp0"

title FactoryFlow
color 0B

:MENU
cls
echo.
echo ============================================================
echo                         FACTORYFLOW
echo ============================================================
echo.
echo   [1] Run Dev
echo   [2] Gerar build
echo   [3] Gerar release
echo   [4] Gerar portable
echo   [5] Criar ou recuperar administrador SQLite
echo.
echo   [0] Sair
echo.
set /p "OPCAO=Escolha uma opcao: "

if "%OPCAO%"=="1" goto DEV
if "%OPCAO%"=="2" goto BUILD
if "%OPCAO%"=="3" goto RELEASE
if "%OPCAO%"=="4" goto PORTABLE
if "%OPCAO%"=="5" goto ADMIN
if "%OPCAO%"=="0" goto FIM

color 0C
echo.
echo Opcao invalida.
timeout /t 2 >nul
color 0B
goto MENU

:DEV
call "app\scripts\run-dev.bat"
goto MENU

:BUILD
call "app\scripts\run-build.bat"
goto MENU

:RELEASE
call "app\scripts\run-release.bat"
goto MENU

:PORTABLE
call "app\scripts\run-portable.bat"
goto MENU

:ADMIN
call "app\scripts\create-admin-sqlite.bat"
goto MENU

:FIM
exit /b 0
