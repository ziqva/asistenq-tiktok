@echo off
setlocal enabledelayedexpansion

title AsistenQ TikTok - Automated Release Tool

echo ==================================================================
echo           AsistenQ TikTok - Automated Release Tool
echo ==================================================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH.
    echo Please install Node.js v16 or higher to run the release tool.
    echo.
    if "%~1"=="" pause
    exit /b 1
)

where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] pnpm is not found in PATH.
    echo Frontend and backend builds may require pnpm.
    echo.
)

node "%~dp0scripts\release.js" %*
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if !EXIT_CODE! equ 0 (
    echo [SUCCESS] Release process completed successfully.
) else (
    echo [ERROR] Release process terminated with error code !EXIT_CODE!.
)

rem Pause if executed without arguments (e.g. double-clicked from Windows Explorer)
if "%~1"=="" (
    echo.
    pause
)

exit /b !EXIT_CODE!
