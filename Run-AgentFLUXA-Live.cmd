@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

rem Single-file launcher: runs the AgentFLUXA terminal client locally,
rem talking to the live API at https://agentfluxa.com/api.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required but was not found on PATH.
  echo Install it from https://nodejs.org and re-run this script.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies, this only happens once...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

set "API_URL=https://agentfluxa.com/api"

set "PROVIDER=%~1"
if "%PROVIDER%"=="" set /p PROVIDER=Provider [openai/gemini/openrouter/copilot] (default: openai):
if "%PROVIDER%"=="" set "PROVIDER=openai"

set "MODEL=%~2"
if "%MODEL%"=="" set /p MODEL=Model (optional, press Enter for default):

echo.
echo AgentFLUXA Terminal (live API: %API_URL%)
echo Provider: %PROVIDER%
if not "%MODEL%"=="" echo Model: %MODEL%
echo.

if "%MODEL%"=="" (
  node cli\src\index.js --url "%API_URL%" --provider "%PROVIDER%"
) else (
  node cli\src\index.js --url "%API_URL%" --provider "%PROVIDER%" --model "%MODEL%"
)

if errorlevel 1 (
  echo.
  echo AgentFLUXA closed with an error.
  pause
)
