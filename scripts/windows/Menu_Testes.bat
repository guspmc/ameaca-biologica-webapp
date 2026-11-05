@echo off
setlocal EnableExtensions
cd /d "%~dp0\..\.."

:menu
cls
echo.
echo ==========================================
echo   AMEACA BIOLOGICA - MENU DE TESTES
echo ==========================================
echo.
echo 1 - Iniciar Ficha Offline
echo 2 - Iniciar Mesa LAN
echo 3 - Iniciar os dois ambientes
echo 4 - Verificar ambiente
echo 5 - Sair
echo.
choice /c 12345 /n /m "Escolha uma opcao: "
if errorlevel 5 goto sair
if errorlevel 4 goto verificar
if errorlevel 3 goto ambos
if errorlevel 2 goto lan
if errorlevel 1 goto ficha

:ficha
start "Ameaca Biologica - Ficha Offline" "%ComSpec%" /d /k call "%~dp0Iniciar_Ficha_Offline.bat"
goto menu

:lan
start "Ameaca Biologica - Mesa LAN" "%ComSpec%" /d /k call "%~dp0Iniciar_Mesa_LAN.bat"
goto menu

:ambos
start "Ameaca Biologica - Ficha Offline" "%ComSpec%" /d /k call "%~dp0Iniciar_Ficha_Offline.bat"
start "Ameaca Biologica - Mesa LAN" "%ComSpec%" /d /k call "%~dp0Iniciar_Mesa_LAN.bat"
goto menu

:verificar
call "%~dp0Verificar_Ambiente.bat"
goto menu

:sair
exit /b 0
