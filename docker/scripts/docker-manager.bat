@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0.."
title Gerenciador PostgreSQL

:menu
cls
echo ============================================================
echo ==================== Gerenciador Docker ====================
echo ============================================================
echo.

call :status_resumo

echo.
echo   [1] Iniciar
echo   [2] Parar
echo   [3] Reiniciar
echo   [4] Status detalhado
echo   [5] Logs
echo   [6] Testar conexao
echo   [7] Remover container (mantem os dados)
echo   [8] Remover container E DADOS (perigoso)
echo   [0] Sair
echo.

set "OPCAO="
set /p OPCAO=Escolha uma opcao: 

if "%OPCAO%"=="1" goto start
if "%OPCAO%"=="2" goto stop
if "%OPCAO%"=="3" goto restart
if "%OPCAO%"=="4" goto status
if "%OPCAO%"=="5" goto logs
if "%OPCAO%"=="6" goto test
if "%OPCAO%"=="7" goto remove
if "%OPCAO%"=="8" goto remove_data
if "%OPCAO%"=="0" goto fim

echo.
echo Opcao invalida.
pause
goto menu


:status_resumo
set "STATUS_CONTAINER="

for /f "usebackq tokens=*" %%S in (`docker inspect -f "{{.State.Status}}" factoryflow-postgres 2^>nul`) do (
  set "STATUS_CONTAINER=%%S"
)

if /I "!STATUS_CONTAINER!"=="running" (
  echo   Status atual: RODANDO
  exit /b
)

if /I "!STATUS_CONTAINER!"=="restarting" (
  echo   Status atual: REINICIANDO COM ERRO
  exit /b
)

if /I "!STATUS_CONTAINER!"=="exited" (
  echo   Status atual: PARADO COM ERRO
  exit /b
)

if /I "!STATUS_CONTAINER!"=="created" (
  echo   Status atual: CRIADO, MAS NAO INICIADO
  exit /b
)

if /I "!STATUS_CONTAINER!"=="paused" (
  echo   Status atual: PAUSADO
  exit /b
)

if not defined STATUS_CONTAINER (
  echo   Status atual: NAO CRIADO
  exit /b
)

echo   Status atual: !STATUS_CONTAINER!
exit /b


:checar_docker
docker info >nul 2>&1

if errorlevel 1 (
  echo.
  echo [ERRO] O Docker nao esta disponivel.
  echo Verifique se o Docker Desktop esta aberto.
  pause
  exit /b 1
)

exit /b 0


:checar_pre_requisitos
call :checar_docker
if errorlevel 1 exit /b 1

if not exist "compose.yaml" (
  echo.
  echo [ERRO] Arquivo compose.yaml nao encontrado.
  echo Pasta atual:
  cd
  pause
  exit /b 1
)

if not exist ".env" (
  echo.
  echo [ERRO] Arquivo .env nao encontrado.
  echo Copie .env.example para .env e ajuste os valores.
  pause
  exit /b 1
)

if not exist "secrets\postgres_password.txt" (
  echo.
  echo [ERRO] Senha nao configurada.
  echo Copie:
  echo secrets\postgres_password.example.txt
  echo para:
  echo secrets\postgres_password.txt
  echo.
  echo Depois troque o conteudo por uma senha forte.
  pause
  exit /b 1
)

for %%A in ("secrets\postgres_password.txt") do (
  if %%~zA EQU 0 (
    echo.
    echo [ERRO] O arquivo postgres_password.txt esta vazio.
    pause
    exit /b 1
  )
)

exit /b 0


:start
call :checar_pre_requisitos
if errorlevel 1 goto menu

echo.
echo Iniciando PostgreSQL...
echo.

docker compose up -d

if errorlevel 1 (
  echo.
  echo [ERRO] Nao foi possivel iniciar o PostgreSQL.
  echo.
  echo Ultimos logs:
  docker compose logs --tail 50 postgres
  echo.
  pause
  goto menu
)

echo.
echo PostgreSQL solicitado com sucesso.
echo Aguardando alguns segundos...
timeout /t 5 /nobreak >nul

echo.
docker compose ps

echo.
set "STATUS_CONTAINER="

for /f "usebackq tokens=*" %%S in (`docker inspect -f "{{.State.Status}}" factoryflow-postgres 2^>nul`) do (
  set "STATUS_CONTAINER=%%S"
)

if /I "!STATUS_CONTAINER!"=="restarting" (
  echo.
  echo [ERRO] O PostgreSQL entrou em reinicializacao continua.
  echo.
  echo Ultimos logs:
  docker compose logs --tail 100 postgres
)

pause
goto menu


:stop
call :checar_docker
if errorlevel 1 goto menu

echo.
echo Parando PostgreSQL...
docker compose stop postgres

if errorlevel 1 (
  echo.
  echo [ERRO] Nao foi possivel parar o PostgreSQL.
) else (
  echo.
  echo PostgreSQL parado.
)

pause
goto menu


:restart
call :checar_pre_requisitos
if errorlevel 1 goto menu

echo.
echo Reiniciando PostgreSQL...
docker compose restart postgres

if errorlevel 1 (
  echo.
  echo [ERRO] Nao foi possivel reiniciar o PostgreSQL.
  pause
  goto menu
)

timeout /t 3 /nobreak >nul

echo.
docker compose ps
pause
goto menu


:status
call :checar_docker
if errorlevel 1 goto menu

echo.
echo Status do Docker Compose:
echo.
docker compose ps -a

echo.
echo Estado interno do container:
docker inspect ^
  --format "Status: {{.State.Status}} | Rodando: {{.State.Running}} | Reiniciando: {{.State.Restarting}} | Codigo de saida: {{.State.ExitCode}} | Erro: {{.State.Error}}" ^
  factoryflow-postgres 2>nul

echo.
pause
goto menu


:logs
call :checar_docker
if errorlevel 1 goto menu

echo.
echo Ultimos logs do PostgreSQL:
echo.
docker compose logs --tail 100 postgres

echo.
echo [1] Acompanhar logs em tempo real
echo [0] Voltar ao menu
echo.

set "LOG_OPCAO="
set /p LOG_OPCAO=Escolha uma opcao: 

if "%LOG_OPCAO%"=="1" (
  echo.
  echo Pressione Ctrl+C para sair dos logs.
  echo.
  docker compose logs -f postgres
)

goto menu


:test
call :checar_pre_requisitos
if errorlevel 1 goto menu

set "POSTGRES_DB="
set "POSTGRES_USER="

for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
  if /I "%%A"=="POSTGRES_DB" set "POSTGRES_DB=%%B"
  if /I "%%A"=="POSTGRES_USER" set "POSTGRES_USER=%%B"
)

if not defined POSTGRES_DB (
  echo.
  echo [ERRO] POSTGRES_DB nao foi encontrado no arquivo .env.
  pause
  goto menu
)

if not defined POSTGRES_USER (
  echo.
  echo [ERRO] POSTGRES_USER nao foi encontrado no arquivo .env.
  pause
  goto menu
)

set "STATUS_CONTAINER="

for /f "usebackq tokens=*" %%S in (`docker inspect -f "{{.State.Status}}" factoryflow-postgres 2^>nul`) do (
  set "STATUS_CONTAINER=%%S"
)

if /I not "!STATUS_CONTAINER!"=="running" (
  echo.
  echo [ERRO] O container nao esta rodando.
  echo Status atual: !STATUS_CONTAINER!
  echo.
  echo Consulte a opcao [5] Logs.
  pause
  goto menu
)

echo.
echo Testando conexao...
echo Banco: !POSTGRES_DB!
echo Usuario: !POSTGRES_USER!
echo.

docker compose exec -T postgres pg_isready -U "!POSTGRES_USER!" -d "!POSTGRES_DB!"

if errorlevel 1 (
  echo.
  echo [ERRO] O PostgreSQL ainda nao esta aceitando conexoes.
) else (
  echo.
  echo [OK] PostgreSQL pronto para receber conexoes.
)

pause
goto menu


:remove
call :checar_docker
if errorlevel 1 goto menu

echo.
echo ATENCAO:
echo Este comando remove o container e a rede do Compose.
echo O volume com os dados sera preservado.
echo.

set "CONFIRMAR="
set /p CONFIRMAR=Digite REMOVER para continuar: 

if /I not "%CONFIRMAR%"=="REMOVER" (
  echo.
  echo Operacao cancelada.
  pause
  goto menu
)

echo.
docker compose down

if errorlevel 1 (
  echo.
  echo [ERRO] Nao foi possivel remover o container.
) else (
  echo.
  echo Container removido. Os dados foram preservados.
)

pause
goto menu


:remove_data
call :checar_docker
if errorlevel 1 goto menu

echo.
echo ============================================================
echo PERIGO: ESTE COMANDO APAGA O CONTAINER E TODOS OS DADOS
echo ============================================================
echo.
echo O volume factoryflow_postgres_data sera removido.
echo Esta operacao nao pode ser desfeita.
echo.

set "CONFIRMAR="
set /p CONFIRMAR=Digite APAGAR-TUDO para continuar: 

if /I not "%CONFIRMAR%"=="APAGAR-TUDO" (
  echo.
  echo Operacao cancelada.
  pause
  goto menu
)

echo.
docker compose down -v

if errorlevel 1 (
  echo.
  echo [ERRO] Nao foi possivel remover o ambiente.
) else (
  echo.
  echo Container e volume removidos.
)

pause
goto menu


:fim
endlocal
exit /b 0