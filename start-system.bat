@echo off
echo ========================================
echo    SISTEMA DE GESTION DE INCIDENCIAS
echo ========================================
echo.
echo Iniciando el sistema...
echo.

echo [1/3] Iniciando Backend...
start "Backend - Puerto 5000" cmd /k "cd backend && npm run dev"

echo [2/3] Esperando 5 segundos para que el backend inicie...
timeout /t 5 /nobreak > nul

echo [3/3] Iniciando Frontend...
start "Frontend - Puerto 5173" cmd /k "npm run dev"

echo.
echo ========================================
echo    SISTEMA INICIADO CORRECTAMENTE
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
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul 