@echo off
setlocal EnableExtensions
chcp 65001 >nul
title FactoryFlow - Testes de Sincronizacao
cd /d "%~dp0"

:menu
cls
echo ============================================================
echo              FACTORYFLOW - TESTES DE SINCRONIZACAO
echo ============================================================
echo.
echo [1] Abrir PC-A
echo [2] Abrir PC-B
echo [3] Abrir PC-A e PC-B
echo [4] Executar teste de usuarios
echo [5] Inspecionar PC-A
echo [6] Inspecionar PC-B
echo [7] Inspecionar PC-A e PC-B
echo [8] Resetar ambiente de sincronizacao
echo [9] Fluxo completo: abrir PCs e testar usuarios
echo [0] Sair
echo.
set /p opcao=Escolha uma opcao: 

if "%opcao%"=="1" goto abrir_pc_a
if "%opcao%"=="2" goto abrir_pc_b
if "%opcao%"=="3" goto abrir_ambos
if "%opcao%"=="4" goto teste_usuario
if "%opcao%"=="5" goto inspecionar_pc_a
if "%opcao%"=="6" goto inspecionar_pc_b
if "%opcao%"=="7" goto inspecionar_ambos
if "%opcao%"=="8" goto resetar
if "%opcao%"=="9" goto fluxo_completo
if "%opcao%"=="0" goto fim

echo.
echo Opcao invalida.
pause
goto menu

:abrir_pc_a
start "FactoryFlow PC-A" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-a"
echo PC-A iniciado.
pause
goto menu

:abrir_pc_b
start "FactoryFlow PC-B" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-b"
echo PC-B iniciado.
pause
goto menu

:abrir_ambos
start "FactoryFlow PC-A" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-a"
timeout /t 2 /nobreak >nul
start "FactoryFlow PC-B" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-b"
echo As duas instancias foram abertas.
echo Aguarde cerca de 35 segundos antes de testar.
pause
goto menu

:configurar_postgres
set "PGHOST=127.0.0.1"
set "PGPORT=5433"
set "PGDATABASE=postgres"
set "PGUSER=postgres"
set "PGPASSWORD=admin123"
exit /b

:teste_usuario
call :configurar_postgres
echo.
echo PC-A e PC-B precisam estar abertos.
call npm.cmd run test:sync:usuario
pause
goto menu

:inspecionar_pc_a
call npm.cmd run test:sync:inspect:pc-a
pause
goto menu

:inspecionar_pc_b
call npm.cmd run test:sync:inspect:pc-b
pause
goto menu

:inspecionar_ambos
call npm.cmd run test:sync:inspect
pause
goto menu

:resetar
echo.
echo ATENCAO: esta opcao limpa e recria o ambiente de testes.
choice /c SN /n /m "Deseja continuar? [S/N]: "
if errorlevel 2 goto menu
call npm.cmd run test:sync:reset
pause
goto menu

:fluxo_completo
call :configurar_postgres
start "FactoryFlow PC-A" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-a"
timeout /t 2 /nobreak >nul
start "FactoryFlow PC-B" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-b"
echo Aguardando 40 segundos para os workers iniciarem...
timeout /t 40 /nobreak
call npm.cmd run test:sync:usuario
pause
goto menu

:fim
endlocal
exit /b 0
