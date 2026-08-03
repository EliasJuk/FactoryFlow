@echo off
setlocal EnableExtensions
chcp 65001 >nul

cd /d "%~dp0"

title FactoryFlow - Central de Testes
color 07

for /F "delims=#" %%e in ('"prompt #$E# & for %%e in (1) do rem"') do set "ESC=%%e"

set "CYAN=%ESC%[96m"
set "GREEN=%ESC%[92m"
set "MAGENTA=%ESC%[95m"
set "YELLOW=%ESC%[93m"
set "RED=%ESC%[91m"
set "WHITE=%ESC%[97m"
set "GRAY=%ESC%[90m"
set "RESET=%ESC%[0m"

:menu
cls

echo %CYAN%============================================================%RESET%
echo %CYAN%                FACTORYFLOW - CENTRAL DE TESTES%RESET%
echo %CYAN%============================================================%RESET%
echo.
echo %WHITE%Selecione o grupo de testes que deseja executar:%RESET%
echo.
echo %GRAY%------------------------------------------------------------%RESET%
echo   %GREEN%[1]%RESET% %WHITE%Testes de instalacao e primeiro acesso%RESET%
echo   %MAGENTA%[2]%RESET% %WHITE%Testes de sincronizacao%RESET%
echo   %YELLOW%[3]%RESET% %WHITE%Testes do banco%RESET%
echo %GRAY%------------------------------------------------------------%RESET%
echo   %RED%[0]%RESET% %WHITE%Sair%RESET%
echo.
echo %CYAN%============================================================%RESET%

set "opcao="
set /p "opcao=%WHITE%Escolha uma opcao: %RESET%"

if "%opcao%"=="1" goto testes_instalacao
if "%opcao%"=="2" goto testes_sincronizacao
if "%opcao%"=="3" goto testes_banco
if "%opcao%"=="0" goto fim

echo.
echo %RED%Opcao invalida. Digite 0, 1, 2 ou 3.%RESET%
echo.
pause
goto menu

:testes_instalacao
cls

if not exist "%~dp0first-access\run-test-first-access.bat" (
    echo %RED%============================================================%RESET%
    echo %RED%                  ARQUIVO NAO ENCONTRADO%RESET%
    echo %RED%============================================================%RESET%
    echo.
    echo %WHITE%O menu de primeiro acesso nao foi encontrado:%RESET%
    echo.
    echo %YELLOW%%~dp0first-access\run-test-first-access.bat%RESET%
    echo.
    pause
    goto menu
)

call "%~dp0first-access\run-test-first-access.bat"
goto menu

:testes_sincronizacao
cls

if not exist "%~dp0sync\run-tests-sync.bat" (
    echo %RED%============================================================%RESET%
    echo %RED%                  ARQUIVO NAO ENCONTRADO%RESET%
    echo %RED%============================================================%RESET%
    echo.
    echo %WHITE%O menu de sincronizacao nao foi encontrado:%RESET%
    echo.
    echo %YELLOW%%~dp0sync\run-tests-sync.bat%RESET%
    echo.
    pause
    goto menu
)

call "%~dp0sync\run-tests-sync.bat"
goto menu

:testes_banco
cls

if not exist "%~dp0database\run-tests-database.bat" (
    echo %YELLOW%============================================================%RESET%
    echo %YELLOW%                 TESTES DO BANCO DE DADOS%RESET%
    echo %YELLOW%============================================================%RESET%
    echo.
    echo %WHITE%O menu de testes do banco ainda nao foi criado.%RESET%
    echo.
    echo %WHITE%Caminho esperado:%RESET%
    echo.
    echo %YELLOW%%~dp0database\run-tests-database.bat%RESET%
    echo.
    echo %GRAY%Esta opcao sera implementada posteriormente.%RESET%
    echo.
    pause
    goto menu
)

call "%~dp0database\run-tests-database.bat"
goto menu

:fim
cls

echo %RED%============================================================%RESET%
echo %RED%                CENTRAL DE TESTES ENCERRADA%RESET%
echo %RED%============================================================%RESET%
echo.

endlocal
exit /b 0
