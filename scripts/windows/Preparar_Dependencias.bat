@echo off
setlocal EnableExtensions
cd /d "%~dp0\..\.."

call "%~dp0Verificar_Ambiente.bat" /silencioso
if errorlevel 1 exit /b 1

echo.
echo Conferindo dependencias do projeto...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$mutex = [System.Threading.Mutex]::new($false, 'Local\AmeacaBiologicaPnpmInstall'); $owns = $false; try { try { $owns = $mutex.WaitOne([TimeSpan]::FromMinutes(5)) } catch [System.Threading.AbandonedMutexException] { $owns = $true }; if (-not $owns) { Write-Error 'Tempo esgotado aguardando outra preparacao de dependencias.'; exit 2 }; $marker = 'node_modules/.modules.yaml'; $inputs = @('package.json', 'pnpm-lock.yaml'); $needsInstall = -not (Test-Path $marker); if (-not $needsInstall) { $stamp = (Get-Item $marker).LastWriteTimeUtc; $needsInstall = [bool]($inputs | Where-Object { (Get-Item $_).LastWriteTimeUtc -gt $stamp }) }; if ($needsInstall) { Write-Host 'Instalando dependencias com lockfile congelado...'; & pnpm.cmd install --frozen-lockfile --ignore-scripts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } } else { Write-Host 'Dependencias ja estao atualizadas.' } } finally { if ($owns) { $mutex.ReleaseMutex() }; $mutex.Dispose() }"
if errorlevel 1 (
  echo [ERRO] Nao foi possivel preparar as dependencias.
  pause
  exit /b 1
)

exit /b 0
