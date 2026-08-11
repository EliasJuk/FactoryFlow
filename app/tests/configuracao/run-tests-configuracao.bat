@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0..\.."

title FactoryFlow - Testes de Configuracao

echo ============================================================
echo              FACTORYFLOW - TESTES DE CONFIGURACAO
echo ============================================================
echo.
echo [1] SecretStorageService
echo [0] Voltar
echo.

set "opcao="
set /p "opcao=Escolha uma opcao: "

if "%opcao%"=="1" goto secrets
if "%opcao%"=="0" goto fim

echo.
echo Opcao invalida.
pause
goto :eof

:secrets
cls
echo ============================================================
echo              TESTE - SECRET STORAGE
echo ============================================================
echo.

call npm.cmd run test:configuracao:secrets

echo.
pause
goto :eof

:fim
endlocal
exit /b 0