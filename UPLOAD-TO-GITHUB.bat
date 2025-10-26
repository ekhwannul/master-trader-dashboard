@echo off
title Upload to GitHub
color 0A
echo.
echo ========================================
echo   UPLOAD TO GITHUB
echo ========================================
echo.
echo Step 1: Initialize Git...
git init
echo.
echo Step 2: Add all files...
git add .
echo.
echo Step 3: Commit...
git commit -m "Initial commit - Master Trader Dashboard"
echo.
echo Step 4: Create repo di GitHub dulu!
echo.
echo Go to: https://github.com/new
echo Repo name: master-trader-dashboard
echo Set to: PRIVATE
echo.
pause
echo.
echo Step 5: Enter your GitHub repo URL:
set /p REPO_URL="Paste URL here: "
echo.
echo Step 6: Add remote...
git remote add origin %REPO_URL%
echo.
echo Step 7: Push to GitHub...
git branch -M main
git push -u origin main
echo.
echo ========================================
echo   DONE! Check GitHub repo
echo ========================================
pause
