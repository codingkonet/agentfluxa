@echo off
setlocal
cd /d "%~dp0"

set "PROVIDER=%~1"
if "%PROVIDER%"=="" set "PROVIDER=%AGENTFLUXA_PROVIDER%"
if "%PROVIDER%"=="" set "PROVIDER=openai"

set "MODEL=%~2"
if "%MODEL%"=="" set "MODEL=%AGENTFLUXA_MODEL%"

echo.
echo AgentFLUXA Terminal
if not "%PROVIDER%"=="" echo Provider: %PROVIDER%
if not "%MODEL%"=="" echo Model: %MODEL%
echo.

if "%MODEL%"=="" (
  node cli\src\index.js --provider "%PROVIDER%"
) else (
  node cli\src\index.js --provider "%PROVIDER%" --model "%MODEL%"
)

echo.
if errorlevel 1 (
  echo AgentFLUXA closed with an error.
  pause
)
