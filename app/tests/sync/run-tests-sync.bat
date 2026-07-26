@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul

rem ============================================================
rem CAMINHOS
rem Este arquivo deve ficar em: app\tests\sync\run-tests-sync.bat
rem ============================================================

cd /d "%~dp0"

for %%I in ("%~dp0..\..") do set "PROJECT_ROOT=%%~fI"

title FactoryFlow - Testes de Sincronizacao

rem ============================================================
rem CORES ANSI
rem ============================================================

for /F "delims=" %%E in ('echo prompt $E^| %ComSpec% /D /Q') do set "ESC=%%E"

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
rem CONFIGURACAO INICIAL
rem ============================================================

call :configurar_postgres

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
echo(  %RED%[0]%RESET% Voltar ao menu principal de testes
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
rem EXECUTAR SCRIPT NPM NA RAIZ DO PROJETO
rem ============================================================

:executar_npm
pushd "%PROJECT_ROOT%" >nul

call npm.cmd run %~1
set "NPM_RESULT=%ERRORLEVEL%"

popd >nul
exit /b %NPM_RESULT%

rem ============================================================
rem ABRIR UMA INSTANCIA EM JANELA INDEPENDENTE
rem
rem %~1 = titulo da janela
rem %~2 = nome do script npm
rem ============================================================

:iniciar_instancia
start "%~1" /D "%PROJECT_ROOT%" "%ComSpec%" /D /K "set PGHOST=%PGHOST%&&set PGPORT=%PGPORT%&&set PGDATABASE=%PGDATABASE%&&set PGUSER=%PGUSER%&&set PGPASSWORD=%PGPASSWORD%&&npm.cmd run %~2"
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

call :configurar_postgres
call :iniciar_instancia "FactoryFlow PC-A" "test:sync:pc-a"

echo(%GREEN%PC-A iniciado em uma nova janela.%RESET%
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

call :configurar_postgres
call :iniciar_instancia "FactoryFlow PC-B" "test:sync:pc-b"

echo(%GREEN%PC-B iniciado em uma nova janela.%RESET%
echo(
pause
goto menu

rem ============================================================
rem ABRIR PC-A E PC-B
rem ============================================================

:abrir_ambos
cls

echo(%BLUE%%BOLD%============================================================%RESET%
echo(%BLUE%%BOLD%                ABRINDO PC-A E PC-B%RESET%
echo(%BLUE%%BOLD%============================================================%RESET%
echo(

call :configurar_postgres

echo(%CYAN%Abrindo PC-A...%RESET%
call :iniciar_instancia "FactoryFlow PC-A" "test:sync:pc-a"

timeout /t 3 /nobreak >nul

echo(%CYAN%Abrindo PC-B...%RESET%
call :iniciar_instancia "FactoryFlow PC-B" "test:sync:pc-b"

echo(
echo(%GREEN%%BOLD%As duas instancias foram solicitadas.%RESET%
echo(%YELLOW%Aguarde aproximadamente 40 segundos antes de testar.%RESET%
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

call :executar_npm "test:sync:usuario"
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

call :configurar_postgres
call :executar_npm "test:sync:inspect:pc-a"

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

call :configurar_postgres
call :executar_npm "test:sync:inspect:pc-b"

echo(
pause
goto menu

rem ============================================================
rem INSPECIONAR PC-A E PC-B
rem ============================================================

:inspecionar_ambos
cls

echo(%CYAN%%BOLD%============================================================%RESET%
echo(%CYAN%%BOLD%                INSPECAO DO PC-A E PC-B%RESET%
echo(%CYAN%%BOLD%============================================================%RESET%
echo(

call :configurar_postgres
call :executar_npm "test:sync:inspect"

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
echo(%YELLOW%Feche PC-A e PC-B antes de executar o reset.%RESET%
echo(%YELLOW%Esta opcao limpa e recria os bancos locais de testes.%RESET%
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

call :configurar_postgres
call :executar_npm "test:sync:reset"
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
call :iniciar_instancia "FactoryFlow PC-A" "test:sync:pc-a"

timeout /t 3 /nobreak >nul

echo(%CYAN%[2/4] Abrindo PC-B...%RESET%
call :iniciar_instancia "FactoryFlow PC-B" "test:sync:pc-b"

echo(
echo(%YELLOW%[3/4] Aguardando 40 segundos para os workers iniciarem...%RESET%
echo(

timeout /t 40 /nobreak

echo(
echo(%MAGENTA%[4/4] Executando o teste de usuarios...%RESET%
echo(

call :executar_npm "test:sync:usuario"
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
echo(%GREEN%Retornando ao menu principal de testes.%RESET%
echo(

endlocal
exit /b 0
