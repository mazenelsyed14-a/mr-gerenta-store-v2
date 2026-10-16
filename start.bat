@echo off
title mr.gerenta Store Server
echo ===================================================
echo   Starting mr.gerenta Luxury Store Server...
echo ===================================================
cd backend
if not exist node_modules (
  echo Installing dependencies...
  npm install
)
echo Starting Node.js server...
node server.js
pause
