@echo off
setlocal EnableExtensions
cd /d "%~dp0\..\.."

echo.
echo ==========================================
echo   AMEACA BIOLOGICA - VERIFICAR AMBIENTE
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado no PATH.
  echo Instale Node.js 22.12 ou superior e abra este arquivo novamente.
  pause
  exit /b 1
)

for /f "delims=" %%V in ('node --version') do set "NODE_VERSION=%%V"
echo Node.js: %NODE_VERSION%
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)"
if errorlevel 1 (
  echo [ERRO] Este projeto exige Node.js 22.12 ou superior.
  pause
  exit /b 1
)

where pnpm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERRO] pnpm.cmd nao encontrado no PATH.
  echo Habilite o Corepack ou instale a versao indicada no package.json.
  pause
  exit /b 1
)

for /f "delims=" %%V in ('pnpm.cmd --version') do set "PNPM_VERSION=%%V"
echo pnpm: %PNPM_VERSION%
if not "%PNPM_VERSION%"=="11.25.0" (
  echo [AVISO] O projeto declara pnpm 11.25.0. A versao encontrada e diferente.
  echo Use a versao 11.25.0 para evitar diferencas de instalacao.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo [ERRO] package.json nao encontrado. Execute o arquivo dentro da pasta do projeto.
  pause
  exit /b 1
)

echo.
echo [OK] Ambiente basico compativel.
if exist "node_modules" (
  echo [OK] Pasta node_modules encontrada.
) else (
  echo [AVISO] Dependencias ainda nao instaladas. O inicializador fara isso.
)
echo.
if /i not "%~1"=="/silencioso" pause
exit /b 0
