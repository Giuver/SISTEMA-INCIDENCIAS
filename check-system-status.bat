@echo off
echo ========================================
echo    VERIFICACION DEL SISTEMA
echo ========================================
echo.

echo [1/4] Verificando variables de entorno...
if exist "frontend.env" (
    echo ✅ frontend.env encontrado
    echo Contenido de VITE_API_URL:
    findstr "VITE_API_URL" frontend.env
) else (
    echo ❌ frontend.env no encontrado
)

echo.
echo [2/4] Verificando archivos de configuración...
if exist "backend/server.js" (
    echo ✅ server.js encontrado
) else (
    echo ❌ server.js no encontrado
)

if exist "src/utils/apiService.js" (
    echo ✅ apiService.js encontrado
) else (
    echo ❌ apiService.js no encontrado
)

echo.
echo [3/4] Verificando dependencias...
if exist "package.json" (
    echo ✅ package.json encontrado
) else (
    echo ❌ package.json no encontrado
)

if exist "backend/package.json" (
    echo ✅ backend/package.json encontrado
) else (
    echo ❌ backend/package.json no encontrado
)

echo.
echo [4/4] Información del sistema...
echo Puerto del backend: 5000
echo Puerto del frontend: 5173
echo URL de la API: https://sistema-incidencias-production.up.railway.app
echo.
echo ========================================
echo    VERIFICACION COMPLETADA
echo ========================================
echo.
echo Para iniciar el sistema, ejecuta: start-system.bat
echo.
pause 