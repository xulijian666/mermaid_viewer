@echo off
chcp 65001 >nul
title Mermaid Flow Pro

cd /d "%~dp0"

echo ========================================
echo    Mermaid Flow Pro Launcher
echo ========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [Error] Node.js not found. Please install Node.js first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo First run detected. Installing dependencies...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [Error] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo Dependencies installed!
    echo.
)

echo Select launch mode:
echo   [1] Frontend only (npm run dev)
echo   [2] Desktop dev mode (npm run tauri:dev)
echo   [3] Exit
echo.
set /p choice=Enter option (1/2/3):

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto tauri_dev
if "%choice%"=="3" exit
echo Invalid option...
pause >nul
exit

:dev
echo.
echo Starting frontend dev server...
echo Visit: http://localhost:5173/
echo.
call npm run dev
goto end

:tauri_dev
echo.
echo Starting desktop dev mode...
echo.
call npm run tauri:dev
goto end

:end
pause