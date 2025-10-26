@echo off
title Deploy to Vercel
color 0A
echo.
echo ========================================
echo   DEPLOY TO VERCEL
echo ========================================
echo.
echo Step 1: Install Vercel CLI...
call npm install -g vercel
echo.
echo Step 2: Login to Vercel...
call vercel login
echo.
echo Step 3: Deploy...
call vercel --prod
echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo   Copy the URL and save it
echo ========================================
echo.
pause
