# Render CLI Setup Script for PowerShell
Write-Host "Setting up Render CLI for Windows..." -ForegroundColor Green

# Create directory for Render CLI
$renderDir = "$env:USERPROFILE\Render"
if (!(Test-Path $renderDir)) {
    New-Item -ItemType Directory -Path $renderDir -Force
}

Write-Host "Downloading Render CLI..." -ForegroundColor Yellow

# Download with TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
try {
    Invoke-WebRequest -Uri "https://github.com/renderinc/cli/releases/latest/download/render-windows-amd64.exe" -OutFile "$renderDir\render.exe" -ErrorAction Stop
    
    if (Test-Path "$renderDir\render.exe") {
        Write-Host "Render CLI downloaded successfully!" -ForegroundColor Green
        
        # Add to PATH
        Write-Host "Adding Render CLI to PATH..." -ForegroundColor Yellow
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentPath -notlike "*$renderDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$renderDir", "User")
            $env:PATH = "$env:PATH;$renderDir"
        }
        
        Write-Host ""
        Write-Host "Setup complete!" -ForegroundColor Green
        Write-Host "Please restart your terminal and run:" -ForegroundColor Cyan
        Write-Host "render --version" -ForegroundColor White
        Write-Host "render login" -ForegroundColor White
    } else {
        Write-Host "Failed to download Render CLI." -ForegroundColor Red
        Write-Host "Please download manually from: https://github.com/renderinc/cli/releases" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error downloading Render CLI: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please download manually from: https://github.com/renderinc/cli/releases" -ForegroundColor Yellow
}

Write-Host "Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
