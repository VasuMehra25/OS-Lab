@echo off
title OS Lab Launcher
echo ===================================================
echo               Launching OS Lab
echo ===================================================
echo.
echo Opening http://localhost:5173/#/?agentation=false in your browser...
start http://localhost:5173/#/?agentation=false
echo.
echo Ensuring development server is active...
call npm run dev
pause
