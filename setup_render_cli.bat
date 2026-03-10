@echo off
echo Setting up Render CLI for Windows...

REM Create a directory for Render CLI
if not exist "%USERPROFILE%\Render" mkdir "%USERPROFILE%\Render"

echo Downloading Render CLI...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/renderinc/cli/releases/latest/download/render-windows-amd64.exe' -OutFile '%USERPROFILE%\Render\render.exe'}"

REM Check if download was successful
if exist "%USERPROFILE%\Render\render.exe" (
    echo Render CLI downloaded successfully!
    
    REM Add to PATH
    echo Adding Render CLI to PATH...
    setx PATH "%PATH%;%USERPROFILE%\Render" /M
    
    echo.
    echo Setup complete! Please restart your terminal and run:
    echo render --version
    echo render login
) else (
    echo Failed to download Render CLI.
    echo Please download manually from: https://github.com/renderinc/cli/releases
)

pause
