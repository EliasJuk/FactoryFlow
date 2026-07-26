@echo off
@echo off
setlocal EnableExtensions
chcp 65001 >nul

cd /d "%~dp0"

title FactoryFlow - Testes de Sincronizacao

rem ============================================================
rem CAPTURA SEGURA DO CARACTERE ESC PARA CORES ANSI
rem ============================================================

for /F "delims=" %%E in ('echo prompt $E^| %ComSpec% /Q') do set "ESC=%%E"

set "RESET=%ESC%[0m"
set "BOLD=%ESC%[1m"

set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "BLUE=%ESC%[94m"
set "MAGENTA=%ESC%[95m"
set "CYAN=%ESC%[96m"
set "WHITE=%ESC%[97m"
set "GRAY=%ESC%[90m"

rem ============================================================
rem MENU PRINCIPAL
rem ============================================================

:menu
cls

echo(%CYAN%%BOLD%============================================================%RESET%
echo(%CYAN%%BOLD%          FACTORYFLOW - TESTES DE SINCRONIZACAO%RESET%
echo(%CYAN%%BOLD%============================================================%RESET%
echo(

echo(%BLUE%%BOLD%[ INSTANCIAS DO APLICATIVO ]%RESET%
echo(%GRAY%------------------------------------------------------------%RESET%
echo(  %GREEN%[1]%RESET% Abrir PC-A
echo(  %GREEN%[2]%RESET% Abrir PC-B
echo(  %GREEN%[3]%RESET% Abrir PC-A e PC-B
echo(

echo(%MAGENTA%%BOLD%[ TESTES AUTOMATIZADOS ]%RESET%
echo(%GRAY%------------------------------------------------------------%RESET%
echo(  %MAGENTA%[4]%RESET% Executar teste de usuarios
echo(

echo(%CYAN%%BOLD%[ INSPECAO DOS BANCOS ]%RESET%
echo(%GRAY%------------------------------------------------------------%RESET%
echo(  %CYAN%[5]%RESET% Inspecionar PC-A
echo(  %CYAN%[6]%RESET% Inspecionar PC-B
echo(  %CYAN%[7]%RESET% Inspecionar PC-A e PC-B
echo(

echo(%YELLOW%%BOLD%[ MANUTENCAO DO AMBIENTE ]%RESET%
echo(%GRAY%------------------------------------------------------------%RESET%
echo(  %YELLOW%[8]%RESET% Resetar ambiente de sincronizacao
echo(

echo(%GREEN%%BOLD%[ FLUXO COMPLETO ]%RESET%
echo(%GRAY%------------------------------------------------------------%RESET%
echo(  %GREEN%[9]%RESET% Abrir PCs, aguardar workers e testar usuarios
echo(

echo(%RED%%BOLD%[ ENCERRAR ]%RESET%
echo(%GRAY%------------------------------------------------------------%RESET%
echo(  %RED%[0]%RESET% Fechar o menu
echo(

echo(%CYAN%============================================================%RESET%
echo(

set "opcao="
set /p "opcao=%WHITE%Escolha uma opcao: %RESET%"

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

echo(
echo(%RED%%BOLD%Opcao invalida.%RESET%
echo(%GRAY%Digite um numero entre 0 e 9.%RESET%
echo(
pause
goto menu

rem ============================================================
rem CONFIGURACAO DO POSTGRESQL DE TESTES
rem ============================================================

:configurar_postgres
set "PGHOST=127.0.0.1"
set "PGPORT=5433"
set "PGDATABASE=postgres"
set "PGUSER=postgres"
set "PGPASSWORD=admin123"
exit /b 0

rem ============================================================
rem ABRIR PC-A
rem ============================================================

:abrir_pc_a
cls

echo(%BLUE%%BOLD%============================================================%RESET%
echo(%BLUE%%BOLD%                     ABRINDO PC-A%RESET%
echo(%BLUE%%BOLD%============================================================%RESET%
echo(

start "FactoryFlow PC-A" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-a"

echo(%GREEN%PC-A iniciado.%RESET%
echo(
pause
goto menu

rem ============================================================
rem ABRIR PC-B
rem ============================================================

:abrir_pc_b
cls

echo(%BLUE%%BOLD%============================================================%RESET%
echo(%BLUE%%BOLD%                     ABRINDO PC-B%RESET%
echo(%BLUE%%BOLD%============================================================%RESET%
echo(

start "FactoryFlow PC-B" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-b"

echo(%GREEN%PC-B iniciado.%RESET%
echo(
pause
goto menu

rem ============================================================
rem ABRIR AS DUAS INSTANCIAS
rem ============================================================

:abrir_ambos
cls

echo(%BLUE%%BOLD%============================================================%RESET%
echo(%BLUE%%BOLD%                ABRINDO PC-A E PC-B%RESET%
echo(%BLUE%%BOLD%============================================================%RESET%
echo(

echo(%CYAN%Abrindo PC-A...%RESET%

start "FactoryFlow PC-A" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-a"

timeout /t 2 /nobreak >nul

echo(%CYAN%Abrindo PC-B...%RESET%

start "FactoryFlow PC-B" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-b"

echo(
echo(%GREEN%%BOLD%As duas instancias foram abertas.%RESET%
echo(%YELLOW%Aguarde aproximadamente 35 segundos antes de testar.%RESET%
echo(
pause
goto menu

rem ============================================================
rem TESTE DE USUARIOS
rem ============================================================

:teste_usuario
cls

echo(%MAGENTA%%BOLD%============================================================%RESET%
echo(%MAGENTA%%BOLD%          TESTE DE SINCRONIZACAO DE USUARIOS%RESET%
echo(%MAGENTA%%BOLD%============================================================%RESET%
echo(

call :configurar_postgres

echo(%YELLOW%ATENCAO:%RESET%
echo(PC-A e PC-B precisam estar abertos e inicializados.
echo(

call npm.cmd run test:sync:usuario
set "TEST_RESULT=%ERRORLEVEL%"

echo(

if not "%TEST_RESULT%"=="0" (
    echo(%RED%%BOLD%O teste terminou com erro.%RESET%
) else (
    echo(%GREEN%%BOLD%O teste foi finalizado com sucesso.%RESET%
)

echo(
pause
goto menu

rem ============================================================
rem INSPECIONAR PC-A
rem ============================================================

:inspecionar_pc_a
cls

echo(%CYAN%%BOLD%============================================================%RESET%
echo(%CYAN%%BOLD%                    INSPECAO DO PC-A%RESET%
echo(%CYAN%%BOLD%============================================================%RESET%
echo(

call npm.cmd run test:sync:inspect:pc-a

echo(
pause
goto menu

rem ============================================================
rem INSPECIONAR PC-B
rem ============================================================

:inspecionar_pc_b
cls

echo(%CYAN%%BOLD%============================================================%RESET%
echo(%CYAN%%BOLD%                    INSPECAO DO PC-B%RESET%
echo(%CYAN%%BOLD%============================================================%RESET%
echo(

call npm.cmd run test:sync:inspect:pc-b

echo(
pause
goto menu

rem ============================================================
rem INSPECIONAR AS DUAS INSTANCIAS
rem ============================================================

:inspecionar_ambos
cls

echo(%CYAN%%BOLD%============================================================%RESET%
echo(%CYAN%%BOLD%                INSPECAO DO PC-A E PC-B%RESET%
echo(%CYAN%%BOLD%============================================================%RESET%
echo(

call npm.cmd run test:sync:inspect

echo(
pause
goto menu

rem ============================================================
rem RESETAR AMBIENTE
rem ============================================================

:resetar
cls

echo(%RED%%BOLD%============================================================%RESET%
echo(%RED%%BOLD%             RESET DO AMBIENTE DE SINCRONIZACAO%RESET%
echo(%RED%%BOLD%============================================================%RESET%
echo(

echo(%RED%%BOLD%ATENCAO%RESET%
echo(%YELLOW%Esta opcao limpa e recria o ambiente de testes.%RESET%
echo(%YELLOW%Os bancos locais usados nos testes poderao ser removidos.%RESET%
echo(

choice /c SN /n /m "Deseja continuar? [S/N]: "

if errorlevel 2 (
    echo(
    echo(%GRAY%Operacao cancelada.%RESET%
    timeout /t 2 /nobreak >nul
    goto menu
)

echo(
echo(%CYAN%Resetando o ambiente de sincronizacao...%RESET%
echo(

call npm.cmd run test:sync:reset
set "RESET_RESULT=%ERRORLEVEL%"

echo(

if not "%RESET_RESULT%"=="0" (
    echo(%RED%%BOLD%Nao foi possivel resetar o ambiente.%RESET%
) else (
    echo(%GREEN%%BOLD%Ambiente resetado com sucesso.%RESET%
)

echo(
pause
goto menu

rem ============================================================
rem FLUXO COMPLETO
rem ============================================================

:fluxo_completo
cls

echo(%GREEN%%BOLD%============================================================%RESET%
echo(%GREEN%%BOLD%                    FLUXO COMPLETO%RESET%
echo(%GREEN%%BOLD%============================================================%RESET%
echo(

call :configurar_postgres

echo(%CYAN%[1/4] Abrindo PC-A...%RESET%

start "FactoryFlow PC-A" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-a"

timeout /t 2 /nobreak >nul

echo(%CYAN%[2/4] Abrindo PC-B...%RESET%

start "FactoryFlow PC-B" cmd /k "cd /d ""%~dp0"" && npm.cmd run test:sync:pc-b"

echo(
echo(%YELLOW%[3/4] Aguardando 40 segundos para os workers iniciarem...%RESET%
echo(

timeout /t 40 /nobreak

echo(
echo(%MAGENTA%[4/4] Executando o teste de usuarios...%RESET%
echo(

call npm.cmd run test:sync:usuario
set "FLOW_RESULT=%ERRORLEVEL%"

echo(

if not "%FLOW_RESULT%"=="0" (
    echo(%RED%%BOLD%O fluxo completo terminou com erro.%RESET%
) else (
    echo(%GREEN%%BOLD%O fluxo completo foi finalizado com sucesso.%RESET%
)

echo(
pause
goto menu

rem ============================================================
rem ENCERRAR
rem ============================================================

:fim
cls

echo(%CYAN%%BOLD%============================================================%RESET%
echo(%CYAN%%BOLD%                         SAINDO%RESET%
echo(%CYAN%%BOLD%============================================================%RESET%
echo(
echo(%GREEN%Menu de testes encerrado.%RESET%
echo(

endlocal
exit /b 0