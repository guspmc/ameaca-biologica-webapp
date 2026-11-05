@echo off
setlocal EnableExtensions
cd /d "%~dp0\..\.."

echo.
echo ==========================================
echo   AMEACA BIOLOGICA - MESA LAN
echo ==========================================
echo.

call "%~dp0Verificar_Ambiente.bat" /silencioso
if errorlevel 1 exit /b 1

echo.
echo [1/4] Verificando as portas 4174 e 4175...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$busy = @(4174,4175) | Where-Object { Get-NetTCPConnection -State Listen -LocalPort $_ -ErrorAction SilentlyContinue }; if ($busy.Count -gt 0) { Write-Host ('Porta(s) ocupada(s): ' + ($busy -join ', ')); exit 1 }"
if errorlevel 1 (
  echo [ERRO] Uma das portas necessarias ja esta em uso.
  echo Feche o teste anterior ou identifique o programa que ocupa a porta.
  pause
  exit /b 1
)

echo.
echo [2/4] Preparando dependencias...
call "%~dp0Preparar_Dependencias.bat"
if errorlevel 1 exit /b 1

echo.
echo [3/4] Iniciando a API SQLite no loopback...
start "Ameaca Biologica - Servidor LAN (4175)" cmd /k pnpm.cmd run server:local -- --host 127.0.0.1 --port 4175
powershell -NoProfile -ExecutionPolicy Bypass -Command "$uri = 'http://127.0.0.1:4175/api/health'; for ($i = 0; $i -lt 30; $i++) { try { $r = Invoke-RestMethod -Uri $uri -TimeoutSec 2; if ($r.ok) { exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo [ERRO] A API nao respondeu em 30 segundos. Confira a janela do servidor.
  pause
  exit /b 1
)

echo Iniciando a interface Vite LAN...
start "Ameaca Biologica - Interface LAN (4174)" cmd /k pnpm.cmd run dev:lan
powershell -NoProfile -ExecutionPolicy Bypass -Command "$uri = 'http://127.0.0.1:4174/api/health'; for ($i = 0; $i -lt 30; $i++) { try { $r = Invoke-RestMethod -Uri $uri -TimeoutSec 2; if ($r.ok) { exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo [ERRO] A interface/proxy nao respondeu em 30 segundos. Confira a janela do Vite.
  pause
  exit /b 1
)

echo.
echo [4/4] Mesa LAN pronta.
echo ATENCAO: use somente contas e dados ficticios em uma rede privada confiavel.
echo O prototipo usa HTTP sem TLS. Nao use dados reais ou senhas reutilizadas.
echo.
echo Interface no PC: http://127.0.0.1:4174/ameaca-biologica-webapp/?servidor=local
echo No celular, substitua 127.0.0.1 pelo IP privado deste PC.
echo Mantenha abertas as janelas da API e do Vite. Encerre cada processo com Ctrl+C na janela correspondente.
echo O banco de teste fica em .ameaca-local e nao deve ser apagado durante os testes.
echo.
start "" "http://127.0.0.1:4174/ameaca-biologica-webapp/?servidor=local"
pause
