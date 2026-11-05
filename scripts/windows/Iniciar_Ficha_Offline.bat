@echo off
setlocal EnableExtensions
cd /d "%~dp0\..\.."

echo.
echo ==========================================
echo   AMEACA BIOLOGICA - FICHA OFFLINE
echo ==========================================
echo.

call "%~dp0Verificar_Ambiente.bat"
if errorlevel 1 exit /b 1

echo.
echo [1/3] Conferindo e instalando dependencias...
call pnpm.cmd install --frozen-lockfile --ignore-scripts
if errorlevel 1 (
  echo [ERRO] Nao foi possivel preparar as dependencias.
  pause
  exit /b 1
)

echo.
echo [2/3] Validando TypeScript e montando a versao de teste...
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
echo [3/3] Abrindo a previa local na porta 4176...
echo Endereco: http://127.0.0.1:4176/ameaca-biologica-webapp/
echo Para encerrar, volte a esta janela e pressione Ctrl+C.
echo.
start "" "http://127.0.0.1:4176/ameaca-biologica-webapp/"
call pnpm.cmd exec vite preview --host 127.0.0.1 --port 4176 --strictPort
