$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$provider = Read-Host 'Provider [openai/gemini/openrouter/copilot] (default: openai)'
if ([string]::IsNullOrWhiteSpace($provider)) {
    $provider = 'openai'
}
$provider = $provider.Trim()
$provider = $provider.ToLowerInvariant()

$model = Read-Host 'Model (optional, press Enter for default)'
$model = $model.Trim()

$arguments = @('cli/src/index.js', '--provider', $provider)
if (-not [string]::IsNullOrWhiteSpace($model)) {
    $arguments += @('--model', $model)
}

& node @arguments

if ($LASTEXITCODE -ne 0) {
    Write-Host 'AgentFLUXA closed with an error.'
    Read-Host 'Press Enter to exit'
}
