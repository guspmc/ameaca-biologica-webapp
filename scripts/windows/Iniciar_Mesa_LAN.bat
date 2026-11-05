@echo off
setlocal EnableExtensions
cd /d "%~dp0\..\.."

echo.
echo ==========================================
echo   AMEACA BIOLOGICA - MESA LAN
echo ==========================================
echo.

call "%~dp0Verificar_Ambiente.bat"
if errorlevel 1 exit /b 1

echo.
echo [1/3] Conferindo dependencias...
call pnpm.cmd install --frozen-lockfile --ignore-scripts
if errorlevel 1 (
  echo [ERRO] Nao foi possivel preparar as dependencias.
  pause
  exit /b 1
)

echo.
echo [2/3] Verificando portas 4174 e 4175...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$busy = @(4174,4175) | Where-Object { Get-NetTCPConnection -State Listen -LocalPort $_ -ErrorAction SilentlyContinue }; if ($busy.Count -gt 0) { Write-Host ('Porta(s) ocupada(s): ' + ($busy -join ', ')); exit 1 }"
if errorlevel 1 (
  echo [ERRO] Uma das portas necessarias ja esta em uso.
  echo Feche o teste anterior ou identifique o programa que ocupa a porta.
  pause
  exit /b 1
)

echo.
echo [3/3] Iniciando servidor e interface em janelas separadas...
echo.
echo ATENCAO: use somente contas e dados ficticios em uma rede privada confiavel.
echo O prototipo usa HTTP sem TLS. Nao use dados reais ou senhas reutilizadas.
echo.
start "Ameaca Biologica - Servidor LAN (4175)" cmd /k pnpm.cmd run server:local -- --host 127.0.0.1 --port 4175
timeout /t 2 /nobreak >nul
start "Ameaca Biologica - Interface LAN (4174)" cmd /k pnpm.cmd run dev:lan
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:4174/ameaca-biologica-webapp/?servidor=local"

echo.
echo Interface no PC: http://127.0.0.1:4174/ameaca-biologica-webapp/?servidor=local
echo No celular, substitua 127.0.0.1 pelo IP privado deste PC.
echo Mantenha as duas janelas abertas. Para encerrar cada processo, use Ctrl+C na janela correspondente.
echo O banco de teste fica em .ameaca-local e nao deve ser apagado durante os testes.
echo.
pause
exit /b 0
