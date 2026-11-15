@echo off
REM ============================================
REM  Push to GitHub with Git Credential Manager
REM ============================================
REM This script will:
REM 1. Configure git user
REM 2. Try to push to GitHub
REM 3. Show Git Credential Manager if needed
REM ============================================

cd /d c:\Users\Appmaker\Documents\vitalstep_with_firmware-master

echo.
echo ============================================
echo  GitHub Push Script
echo  User: chetanv.kar@gmail.com
echo  Repo: https://github.com/chetan0021/vitalstep_with_firmware
echo ============================================
echo.

REM Fix git ownership issue
echo Configuring git safe directory...
git config --global --add safe.directory C:/Users/Appmaker/Documents/vitalstep_with_firmware-master

REM Configure git user
echo Setting git user configuration...
git config user.email chetanv.kar@gmail.com
git config user.name chetan0021

echo.
echo Checking current status...
git status

echo.
echo ============================================
echo  IMPORTANT: If prompted, a window will pop up
echo  to select your GitHub account
echo ============================================
echo.
echo Press any key to continue with push...
pause

REM Try to push
echo.
echo Pushing to GitHub (main branch)...
echo.

git push -v origin main

REM Check result
if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo  SUCCESS! Code pushed to GitHub
    echo ============================================
    echo.
    echo Your changes are now on:
    echo https://github.com/chetan0021/vitalstep_with_firmware/tree/main
    echo.
    echo Vercel will automatically detect the changes
    echo and redeploy your dashboard.
    echo.
) else (
    echo.
    echo ============================================
    echo  FAILED: Could not push to GitHub
    echo ============================================
    echo.
    echo Error code: %errorlevel%
    echo.
    echo Troubleshooting:
    echo 1. Check your internet connection
    echo 2. Make sure GitHub Credential Manager window appeared
    echo 3. Try running this script again
    echo.
)

echo.
echo Press any key to exit...
pause
