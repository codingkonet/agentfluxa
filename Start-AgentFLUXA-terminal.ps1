$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $PSScriptRoot 'Start-AgentFLUXA.ps1'
Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $scriptPath) -WorkingDirectory $PSScriptRoot
