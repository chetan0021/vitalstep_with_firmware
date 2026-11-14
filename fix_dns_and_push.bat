@echo off
REM This script fixes DNS and pushes to GitHub

echo.
echo ============================================
echo    DNS Fix and GitHub Push Script
echo ============================================
echo.

REM Check if running as administrator
openfiles >nul 2>&1
if errorlevel 1 (
    echo ERROR: This script must be run as Administrator!
    echo.
    echo Please:
    echo 1. Right-click this file
    echo 2. Select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo Step 1: Flushing DNS cache...
ipconfig /flushdns
echo DNS cache flushed!
echo.

echo Step 2: Registering DNS...
ipconfig /registerdns
echo DNS registered!
echo.

echo Step 3: Testing connectivity to GitHub...
ping -n 1 github.com >nul 2>&1
if errorlevel 1 (
    echo FAILED: Cannot reach github.com
    echo Please check your internet connection
    echo.
    pause
    exit /b 1
) else (
    echo SUCCESS: GitHub is reachable!
    echo.
)

echo Step 4: Configuring git user...
cd c:\Users\Appmaker\Documents\vitalstep_with_firmware-master
git config user.email chetanv.kar@gmail.com
git config user.name chetan0021
echo Git user configured!
echo.

echo Step 5: Pushing to GitHub...
echo A Git Credential Manager window will appear.
echo Please select your GitHub account and authenticate.
echo.
pause

git push origin main -v

echo.
echo ============================================
echo    Push Complete!
echo ============================================
echo.
pause
