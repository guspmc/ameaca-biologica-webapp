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
echo [1/4] Verificando a porta 4176...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$busy = Get-NetTCPConnection -State Listen -LocalPort 4176 -ErrorAction SilentlyContinue; if ($busy) { Write-Host 'A porta 4176 ja esta ocupada.'; exit 1 }"
if errorlevel 1 (
  echo [ERRO] Feche o processo que estiver usando a porta 4176 ou identifique-o antes de continuar.
  pause
  exit /b 1
)

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
echo [4/4] Iniciando a previa local na porta 4176...
start "Ameaca Biologica - Ficha Offline (4176)" cmd /k pnpm.cmd exec vite preview --host 127.0.0.1 --port 4176 --strictPort
powershell -NoProfile -ExecutionPolicy Bypass -Command "$uri = 'http://127.0.0.1:4176/ameaca-biologica-webapp/'; for ($i = 0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri $uri -Method Head -TimeoutSec 2 -UseBasicParsing; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo [ERRO] A previa nao respondeu em 30 segundos. Confira a janela do servidor.
  pause
  exit /b 1
)

echo.
echo [OK] Ficha Offline pronta.
echo Endereco: http://127.0.0.1:4176/ameaca-biologica-webapp/
echo Mantenha aberta a janela do servidor. Para encerrar, use Ctrl+C nela.
echo.
start "" "http://127.0.0.1:4176/ameaca-biologica-webapp/"
pause
