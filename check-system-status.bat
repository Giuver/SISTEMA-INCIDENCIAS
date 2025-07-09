@echo off
echo ========================================
echo    VERIFICANDO ESTADO DEL SISTEMA
echo ========================================
echo.

echo Deteniendo procesos existentes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo.
echo Iniciando Backend...
start "Backend - Puerto 5000" cmd /k "cd backend && npm run dev"

echo Esperando 8 segundos...
timeout /t 8 /nobreak > nul

echo.
echo Iniciando Frontend...
start "Frontend - Puerto 5173" cmd /k "npm run dev"

echo.
echo ========================================
echo    SISTEMA REINICIADO
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Credenciales de prueba:
echo - Admin: admin@example.com / admin123
echo - Soporte: soporte@example.com / soporte123
echo - Usuario: usuario@example.com / usuario123
echo.
pause 