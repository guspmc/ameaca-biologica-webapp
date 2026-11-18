@echo off
setlocal EnableExtensions
cd /d "%~dp0\..\.."

echo.
echo ==========================================
echo   AMEACA BIOLOGICA - FICHA OFFLINE
echo ==========================================
echo.

call "%~dp0Verificar_Ambiente.bat" /silencioso
if errorlevel 1 exit /b 1

echo.
echo [1/4] Selecionando uma porta local disponivel...
for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$port = 4176; if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) { $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0); try { $listener.Start(); $port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port } finally { $listener.Stop() } }; Write-Output $port"`) do set "PORT_FICHA=%%P"
if not defined PORT_FICHA (
  echo [ERRO] Nao foi possivel selecionar uma porta local.
  pause
  exit /b 1
)
echo Porta selecionada: %PORT_FICHA%
if not "%PORT_FICHA%"=="4176" echo [AVISO] A porta 4176 ja estava ocupada. A Ficha usara uma porta alternativa sem encerrar o processo existente.

echo.
echo [2/4] Preparando dependencias...
call "%~dp0Preparar_Dependencias.bat"
if errorlevel 1 exit /b 1

echo.
echo [3/4] Validando TypeScript e montando a versao de teste...
set "VITE_PWA_TESTE=true"
call pnpm.cmd exec tsc --noEmit
if errorlevel 1 (
  set "VITE_PWA_TESTE="
  echo [ERRO] A verificacao TypeScript falhou.
  pause
  exit /b 1
)
call pnpm.cmd exec vite build --mode teste
set "VITE_PWA_TESTE="
if errorlevel 1 (
  echo [ERRO] A compilacao da Ficha Offline falhou.
  pause
  exit /b 1
)

echo.
echo [4/4] Iniciando a previa local na porta %PORT_FICHA%...
start "Ameaca Biologica - Ficha Offline (%PORT_FICHA%)" cmd /k pnpm.cmd exec vite preview --host 127.0.0.1 --port %PORT_FICHA% --strictPort
set "URL_FICHA=http://127.0.0.1:%PORT_FICHA%/ameaca-biologica-webapp/"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$uri = '%URL_FICHA%'; for ($i = 0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri $uri -Method Head -TimeoutSec 2 -UseBasicParsing; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo [ERRO] A previa nao respondeu em 30 segundos. Confira a janela do servidor.
  pause
  exit /b 1
)

echo.
echo [OK] Ficha Offline pronta.
echo Endereco: %URL_FICHA%
echo Mantenha aberta a janela do servidor. Para encerrar, use Ctrl+C nela.
echo.
start "" "%URL_FICHA%"
pause
