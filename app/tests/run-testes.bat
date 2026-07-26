@echo off
setlocal EnableExtensions
chcp 65001 >nul

cd /d "%~dp0"

title FactoryFlow - Central de Testes
color 0B

:menu
cls

echo ============================================================
echo                 FACTORYFLOW - CENTRAL DE TESTES
echo ============================================================
echo.
echo Selecione o grupo de testes que deseja executar:
echo.
echo ------------------------------------------------------------
echo   [1] Testes de sincronizacao
echo   [2] Testes do banco
echo ------------------------------------------------------------
echo   [0] Sair
echo.
echo ============================================================

set "opcao="
set /p "opcao=Escolha uma opcao: "

if "%opcao%"=="1" goto testes_sincronizacao
if "%opcao%"=="2" goto testes_banco
if "%opcao%"=="0" goto fim

echo.
echo Opcao invalida. Digite 0, 1 ou 2.
echo.
pause
goto menu

rem ============================================================
rem TESTES DE SINCRONIZACAO
rem ============================================================

:testes_sincronizacao
cls

if not exist "%~dp0sync\run-tests-sync.bat" (
    color 0C

    echo ============================================================
    echo                   ARQUIVO NAO ENCONTRADO
    echo ============================================================
    echo.
    echo O menu de sincronizacao nao foi encontrado:
    echo.
    echo %~dp0sync\run-tests-sync.bat
    echo.
    echo Verifique se o arquivo foi movido para a pasta correta.
    echo.

    pause
    color 0B
    goto menu
)

call "%~dp0sync\run-tests-sync.bat"

color 0B
goto menu

rem ============================================================
rem TESTES DO BANCO
rem ============================================================

:testes_banco
cls

if not exist "%~dp0database\run-tests-database.bat" (
    color 0E

    echo ============================================================
    echo                  TESTES DO BANCO DE DADOS
    echo ============================================================
    echo.
    echo O menu de testes do banco ainda nao foi criado.
    echo.
    echo Caminho esperado:
    echo.
    echo %~dp0database\run-tests-database.bat
    echo.
    echo Esta opcao sera implementada posteriormente.
    echo.

    pause
    color 0B
    goto menu
)

call "%~dp0database\run-tests-database.bat"

color 0B
goto menu

rem ============================================================
rem ENCERRAR
rem ============================================================

:fim
cls
color 07

echo ============================================================
echo                 CENTRAL DE TESTES ENCERRADA
echo ============================================================
echo.

endlocal
exit /b 0