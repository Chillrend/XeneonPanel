@echo off
setlocal enabledelayedexpansion
title Xeneon Windows 11 Companion Agent Builder

:: Automatically elevate to Administrator if located inside Program Files
echo "%~dp0" | findstr /I "Program Files" >nul
if not errorlevel 1 (
    net session >nul 2>&1
    if errorlevel 1 (
        echo [NOTICE] Running inside Program Files requires Administrator privileges.
        echo Requesting Administrator elevation...
        powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
        exit /b
    )
)

cd /d "%~dp0"

:: Stop any currently running instance so executable is not locked
taskkill /f /im xeneon-agent.exe >nul 2>&1

echo ========================================================
echo   Building Xeneon Companion Agent for Windows 11 (.exe)
echo ========================================================
echo Location: %~dp0
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ and check "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking & installing dependencies...
python -m pip install --upgrade pip --no-warn-script-location
python -m pip install -r requirements.txt --no-warn-script-location

echo.
echo [2/3] Compiling standalone xeneon-agent.exe with PyInstaller...
python -m PyInstaller --onefile --noconsole --name xeneon-agent --clean agent.py

if not exist "dist\xeneon-agent.exe" (
    echo.
    echo [ERROR] PyInstaller compilation failed! Check output above.
    pause
    exit /b 1
)

echo.
echo [3/3] Finalizing setup...
:: Place xeneon-agent.exe in current folder alongside config.json and run_silent.vbs
copy /y "dist\xeneon-agent.exe" ".\xeneon-agent.exe" >nul

:: Also copy to repo dist/agent if running from project repository
if exist "..\package.json" (
    if not exist "..\dist\agent" mkdir "..\dist\agent"
    copy /y ".\xeneon-agent.exe" "..\dist\agent\xeneon-agent.exe" >nul
    copy /y "config.json" "..\dist\agent\config.json" >nul
    copy /y "run_silent.vbs" "..\dist\agent\run_silent.vbs" >nul
)

:: Clean up temporary build artifacts
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"
if exist "xeneon-agent.spec" del /q "xeneon-agent.spec"

echo.
echo ========================================================
echo   Build Successful!
echo   Executable: %~dp0xeneon-agent.exe
echo   Config:     %~dp0config.json
echo   Silent Run: %~dp0run_silent.vbs
echo ========================================================
echo.
echo You can now run xeneon-agent.exe or use run_silent.vbs in shell:startup
echo.
pause
