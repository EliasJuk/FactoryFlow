@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "APP_ROOT=%%~fI"

cd /d "%APP_ROOT%"

title FactoryFlow - Testes do Banco
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
echo %CYAN%              FACTORYFLOW - TESTES DO BANCO%RESET%
echo %CYAN%============================================================%RESET%
echo.
echo %MAGENTA%[ MIGRATIONS ]%RESET%
echo %GRAY%------------------------------------------------------------%RESET%
echo   %GREEN%[1]%RESET% %WHITE%Executar migrations do PostgreSQL de testes%RESET%
echo       %GRAY%Cria e atualiza as tabelas no banco configurado para testes.%RESET%
echo.
echo %RED%[ ENCERRAR ]%RESET%
echo %GRAY%------------------------------------------------------------%RESET%
echo   %RED%[0]%RESET% %WHITE%Voltar ao menu principal de testes%RESET%
echo.
echo %CYAN%============================================================%RESET%

set "opcao="
set /p "opcao=%WHITE%Escolha uma opcao: %RESET%"

if "%opcao%"=="1" goto migrations_postgres
if "%opcao%"=="0" goto fim

echo.
echo %RED%Opcao invalida. Digite 0 ou 1.%RESET%
echo.
pause
goto menu

:migrations_postgres
cls

set "MIGRATION_SCRIPT=%APP_ROOT%\tests\database\migrations\run-postgres-test-migrations.ps1"

if not exist "%MIGRATION_SCRIPT%" (
    echo %RED%============================================================%RESET%
    echo %RED%                  ARQUIVO NAO ENCONTRADO%RESET%
    echo %RED%============================================================%RESET%
    echo.
    echo %WHITE%O executor de migrations nao foi encontrado:%RESET%
    echo.
    echo %YELLOW%%MIGRATION_SCRIPT%%RESET%
    echo.
    pause
    goto menu
)

echo %GREEN%============================================================%RESET%
echo %GREEN%           MIGRATIONS DO POSTGRESQL DE TESTES%RESET%
echo %GREEN%============================================================%RESET%
echo.
echo %WHITE%O FactoryFlow sera aberto temporariamente em modo PostgreSQL.%RESET%
echo %GRAY%Aguarde a inicializacao terminar e feche a janela do aplicativo.%RESET%
echo.
echo %YELLOW%Confirme antes se o arquivo postgres.local.json possui a senha correta.%RESET%
echo.

set "confirmacao="
set /p "confirmacao=%YELLOW%Digite MIGRAR para continuar: %RESET%"

if /I not "%confirmacao%"=="MIGRAR" (
    echo.
    echo %GRAY%Operacao cancelada.%RESET%
    echo.
    pause
    goto menu
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%MIGRATION_SCRIPT%"
set "codigo=%errorlevel%"

if not "%codigo%"=="0" (
    echo.
    echo %RED%As migrations foram encerradas com erro. Codigo: %codigo%%RESET%
    echo.
    pause
) else (
    echo.
    echo %GREEN%Execucao das migrations encerrada.%RESET%
    echo %GRAY%Confirme as tabelas no PostgreSQL antes de continuar.%RESET%
    echo.
    pause
)

goto menu

:fim
cls
endlocal
exit /b 0
