@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul

rem ============================================================
rem CAMINHOS
rem Este arquivo deve ficar em:
rem app\tests\sync\run-tests-sync.bat
rem ============================================================

cd /d "%~dp0"

for %%I in ("%~dp0..\..") do set "PROJECT_ROOT=%%~fI"

set "SYNC_SCRIPTS_DIR=%~dp0scripts"
set "RUN_WITH_POSTGRES=%SYNC_SCRIPTS_DIR%\run-with-postgres-config.ps1"

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
echo(  %MAGENTA%[5]%RESET% Executar teste de setores

echo(

echo(%CYAN%%BOLD%[ INSPECAO DOS BANCOS ]%RESET%
echo(%GRAY%------------------------------------------------------------%RESET%
echo(  %CYAN%[6]%RESET% Inspecionar PC-A
echo(  %CYAN%[7]%RESET% Inspecionar PC-B
echo(  %CYAN%[8]%RESET% Inspecionar PC-A e PC-B
echo(

echo(%YELLOW%%BOLD%[ MANUTENCAO DO AMBIENTE ]%RESET%
echo(%GRAY%------------------------------------------------------------%RESET%
echo(  %YELLOW%[9]%RESET% Resetar ambiente de sincronizacao
echo(

echo(%GREEN%%BOLD%[ FLUXO COMPLETO ]%RESET%
echo(%GRAY%------------------------------------------------------------%RESET%
echo(  %GREEN%[10]%RESET% Abrir PCs, aguardar workers e testar usuarios
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
if "%opcao%"=="5" goto teste_setor
if "%opcao%"=="6" goto inspecionar_pc_a
if "%opcao%"=="7" goto inspecionar_pc_b
if "%opcao%"=="8" goto inspecionar_ambos
if "%opcao%"=="9" goto resetar
if "%opcao%"=="10" goto fluxo_completo
if "%opcao%"=="0" goto fim

echo(
echo(%RED%%BOLD%Opcao invalida.%RESET%
echo(%GRAY%Digite um numero entre 0 e 10.%RESET%
echo(
pause
goto menu

rem ============================================================
rem VALIDAR ARQUIVOS DE CONFIGURACAO
rem ============================================================

:validar_configuracao
if not exist "%RUN_WITH_POSTGRES%" (
    echo(
    echo(%RED%%BOLD%ERRO: carregador do PostgreSQL nao encontrado.%RESET%
    echo(%RUN_WITH_POSTGRES%
    echo(
    exit /b 1
)

if not exist "%~dp0..\config\postgres.json" (
    echo(
    echo(%RED%%BOLD%ERRO: postgres.json nao encontrado.%RESET%
    echo(%~dp0..\config\postgres.json
    echo(
    exit /b 1
)

if not exist "%~dp0..\config\postgres.local.json" (
    echo(
    echo(%RED%%BOLD%ERRO: postgres.local.json nao encontrado.%RESET%
    echo(
    echo Crie o arquivo usando:
    echo %~dp0..\config\postgres.local.example.json
    echo(
    exit /b 1
)

exit /b 0

rem ============================================================
rem EXECUTAR NPM COM A CONFIGURACAO COMPARTILHADA
rem ============================================================

:executar_npm
call :validar_configuracao
if errorlevel 1 exit /b 1

powershell.exe ^
  -NoLogo ^
  -NoProfile ^
  -ExecutionPolicy Bypass ^
  -File "%RUN_WITH_POSTGRES%" ^
  -NpmScript "%~1"

exit /b %ERRORLEVEL%

rem ============================================================
rem ABRIR UMA INSTANCIA INDEPENDENTE
rem
rem O start-pc-a.ps1 ou start-pc-b.ps1 carrega postgres.json
rem e postgres.local.json diretamente.
rem ============================================================

:iniciar_instancia
call :validar_configuracao
if errorlevel 1 exit /b 1

start "%~1" ^
  /D "%PROJECT_ROOT%" ^
  "%ComSpec%" /D /K "npm.cmd run %~2"

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

call :iniciar_instancia "FactoryFlow PC-A" "test:sync:pc-a"

if errorlevel 1 (
    echo(%RED%Nao foi possivel iniciar o PC-A.%RESET%
) else (
    echo(%GREEN%PC-A iniciado em uma nova janela.%RESET%
)

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

call :iniciar_instancia "FactoryFlow PC-B" "test:sync:pc-b"

if errorlevel 1 (
    echo(%RED%Nao foi possivel iniciar o PC-B.%RESET%
) else (
    echo(%GREEN%PC-B iniciado em uma nova janela.%RESET%
)

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

echo(%CYAN%Abrindo PC-A...%RESET%
call :iniciar_instancia "FactoryFlow PC-A" "test:sync:pc-a"
if errorlevel 1 goto erro_abrir_ambos

timeout /t 3 /nobreak >nul

echo(%CYAN%Abrindo PC-B...%RESET%
call :iniciar_instancia "FactoryFlow PC-B" "test:sync:pc-b"
if errorlevel 1 goto erro_abrir_ambos

echo(
echo(%GREEN%%BOLD%As duas instancias foram solicitadas.%RESET%
echo(%YELLOW%Aguarde aproximadamente 40 segundos antes de testar.%RESET%
echo(
pause
goto menu

:erro_abrir_ambos
echo(
echo(%RED%%BOLD%Nao foi possivel abrir as duas instancias.%RESET%
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
rem TESTE DE SETORES
rem ============================================================

:teste_setor
cls

echo(%MAGENTA%%BOLD%============================================================%RESET%
echo(%MAGENTA%%BOLD%           TESTE DE SINCRONIZACAO DE SETORES%RESET%
echo(%MAGENTA%%BOLD%============================================================%RESET%
echo(

echo(%YELLOW%ATENCAO:%RESET%
echo(PC-A e PC-B precisam estar abertos e inicializados.
echo(

call :executar_npm "test:sync:setor"
set "TEST_RESULT=%ERRORLEVEL%"

echo(

if not "%TEST_RESULT%"=="0" (
    echo(%RED%%BOLD%O teste de setores terminou com erro.%RESET%
) else (
    echo(%GREEN%%BOLD%O teste de setores foi finalizado com sucesso.%RESET%
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
echo(%YELLOW%Esta opcao limpa os bancos e perfis locais de testes.%RESET%
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

call :executar_npm "test:sync:reset"
set "RESET_RESULT=%ERRORLEVEL%"

echo(

if not "%RESET_RESULT%"=="0" (
    echo(%RED%%BOLD%Nao foi possivel resetar o ambiente.%RESET%
) else (
    echo(%GREEN%%BOLD%Ambiente local resetado com sucesso.%RESET%
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

echo(%CYAN%[1/4] Abrindo PC-A...%RESET%
call :iniciar_instancia "FactoryFlow PC-A" "test:sync:pc-a"
if errorlevel 1 goto erro_fluxo_completo

timeout /t 3 /nobreak >nul

echo(%CYAN%[2/4] Abrindo PC-B...%RESET%
call :iniciar_instancia "FactoryFlow PC-B" "test:sync:pc-b"
if errorlevel 1 goto erro_fluxo_completo

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

:erro_fluxo_completo
echo(
echo(%RED%%BOLD%Nao foi possivel iniciar o fluxo completo.%RESET%
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
