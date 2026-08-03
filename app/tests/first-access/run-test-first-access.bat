@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "APP_ROOT=%%~fI"

cd /d "%APP_ROOT%"

title FactoryFlow - Testes de Primeiro Acesso
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
echo %CYAN%         FACTORYFLOW - TESTES DE PRIMEIRO ACESSO%RESET%
echo %CYAN%============================================================%RESET%
echo.
echo %CYAN%[ INSTANCIA ISOLADA ]%RESET%
echo %GRAY%------------------------------------------------------------%RESET%
echo   %GREEN%[1]%RESET% %WHITE%Novo PC limpo%RESET%
echo       %GRAY%Remove a instancia anterior e inicia o primeiro acesso.%RESET%
echo.
echo   %MAGENTA%[2]%RESET% %WHITE%Iniciar PC existente%RESET%
echo       %GRAY%Mantem o banco e a configuracao isolados atuais.%RESET%
echo.
echo %YELLOW%[ MANUTENCAO DO AMBIENTE ]%RESET%
echo %GRAY%------------------------------------------------------------%RESET%
echo   %YELLOW%[3]%RESET% %WHITE%Resetar PC de teste%RESET%
echo       %GRAY%Remove o banco, a configuracao e as credenciais isoladas.%RESET%
echo.
echo %RED%[ ENCERRAR ]%RESET%
echo %GRAY%------------------------------------------------------------%RESET%
echo   %RED%[0]%RESET% %WHITE%Voltar ao menu principal de testes%RESET%
echo.
echo %CYAN%============================================================%RESET%
echo %GRAY%Ambiente: %APP_ROOT%\tests\first-access\pc-new%RESET%
echo %CYAN%============================================================%RESET%

set "opcao="
set /p "opcao=%WHITE%Escolha uma opcao: %RESET%"

if "%opcao%"=="1" goto novo_pc
if "%opcao%"=="2" goto iniciar_pc
if "%opcao%"=="3" goto resetar_pc
if "%opcao%"=="0" goto fim

echo.
echo %RED%Opcao invalida. Digite 0, 1, 2 ou 3.%RESET%
echo.
pause
goto menu

:novo_pc
cls

echo %GREEN%============================================================%RESET%
echo %GREEN%                    NOVO PC LIMPO%RESET%
echo %GREEN%============================================================%RESET%
echo.
echo %WHITE%O FactoryFlow sera iniciado em uma instancia isolada.%RESET%
echo %GRAY%O ambiente normal nao sera alterado.%RESET%
echo.

call npm.cmd run test:first-access:fresh
set "codigo=%errorlevel%"

if not "%codigo%"=="0" (
    echo.
    echo %RED%O teste foi encerrado com erro. Codigo: %codigo%%RESET%
    echo.
    pause
)

goto menu

:iniciar_pc
cls

echo %MAGENTA%============================================================%RESET%
echo %MAGENTA%                 INICIAR PC EXISTENTE%RESET%
echo %MAGENTA%============================================================%RESET%
echo.

call npm.cmd run test:first-access:start
set "codigo=%errorlevel%"

if not "%codigo%"=="0" (
    echo.
    echo %RED%O teste foi encerrado com erro. Codigo: %codigo%%RESET%
    echo.
    pause
)

goto menu

:resetar_pc
cls

echo %YELLOW%============================================================%RESET%
echo %YELLOW%                  RESETAR PC DE TESTE%RESET%
echo %YELLOW%============================================================%RESET%
echo.
echo %WHITE%Feche o FactoryFlow, o DevTools e qualquer cliente SQLite%RESET%
echo %WHITE%antes de continuar.%RESET%
echo.

set "confirmacao="
set /p "confirmacao=%YELLOW%Digite RESETAR para remover a instancia: %RESET%"

if /I not "%confirmacao%"=="RESETAR" (
    echo.
    echo %GRAY%Operacao cancelada.%RESET%
    echo.
    pause
    goto menu
)

call npm.cmd run test:first-access:reset
set "codigo=%errorlevel%"

if not "%codigo%"=="0" (
    echo.
    echo %RED%Nao foi possivel resetar a instancia. Codigo: %codigo%%RESET%
    echo %GRAY%Confirme se o FactoryFlow e o Database Client estao fechados.%RESET%
    echo.
    pause
) else (
    echo.
    echo %GREEN%Instancia isolada removida com sucesso.%RESET%
    echo.
    pause
)

goto menu

:fim
cls
endlocal
exit /b 0
