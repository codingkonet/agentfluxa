@echo off
setlocal
cd /d "%~dp0"

echo.
echo  AgentFLUXA Terminal
 echo  Connecting to https://agentfluxa.com/api
 echo.
set "PROVIDER=openai"
set /p "PROVIDER=Provider [openai/gemini/openrouter/copilot] (default: openai): "
set "PROVIDER=%PROVIDER: =%"
if "%PROVIDER%"=="" set "PROVIDER=openai"

set "MODEL="
set /p "MODEL=Model (optional, press Enter for default): "

echo.
if "%MODEL%"=="" (
  node cli\src\index.js --provider "%PROVIDER%"
) else (
  node cli\src\index.js --provider "%PROVIDER%" --model "%MODEL%"
)

echo.
if errorlevel 1 echo AgentFLUXA closed with an error.
pause
