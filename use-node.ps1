# Helper script to use Node version from .nvmrc on Windows
$version = Get-Content .nvmrc -Raw
$version = $version.Trim()
Write-Host "Switching to Node $version..."
nvm use $version
