# Render CLI Setup Guide

## Option 1: Manual Download (Recommended for Windows)

1. **Download Render CLI:**
   - Go to: https://github.com/renderinc/cli/releases
   - Download the latest `render-windows-amd64.exe` file
   - Save it as `render.exe` in a directory on your PATH

2. **Add to PATH:**
   - Move `render.exe` to a directory like `C:\Program Files\Render\`
   - Add this directory to your Windows PATH environment variable
   - Or place it in a directory already on your PATH (like `C:\Windows\System32`)

3. **Verify Installation:**
   ```bash
   render --version
   ```

## Option 2: Using PowerShell (Download and Install)

```powershell
# Download Render CLI
Invoke-WebRequest -Uri "https://github.com/renderinc/cli/releases/latest/download/render-windows-amd64.exe" -OutFile "$env:USERPROFILE\render.exe"

# Add to PATH (run once)
$renderPath = "$env:USERPROFILE"
if ($env:PATH -notlike "*$renderPath*") {
    [Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";$renderPath", "User")
    $env:PATH = $env:PATH + ";$renderPath"
}

# Test installation
& "$env:USERPROFILE\render.exe" --version
```

## Option 3: Install Go and Build from Source

1. **Install Go:**
   - Download from: https://golang.org/dl/
   - Install Go on Windows

2. **Install Render CLI:**
   ```bash
   go install github.com/renderinc/cli@latest
   ```

## Authentication Setup

After installing Render CLI, authenticate:

```bash
# Login to Render
render login

# This will open a browser to authenticate with Render
# Follow the prompts to complete authentication
```

## Common Commands

```bash
# List your services
render ps

# View service logs
render logs <service-name>

# Deploy changes
render deploy

# View service details
render info <service-name>

# Trigger a new deploy
render trigger <service-name>
```

## Project-Specific Commands

For your ChronosAI project:

```bash
# View backend service
render ps chronosai-backend

# View backend logs
render logs chronosai-backend

# Deploy backend changes
render deploy chronosai-backend

# View frontend service
render ps chronosai-frontend

# Deploy frontend changes
render deploy chronosai-frontend

# View Redis service
render ps chronosai-redis
```

## Troubleshooting

If you encounter issues:

1. **Permission denied:** Run PowerShell as Administrator
2. **Command not found:** Verify the render.exe is in your PATH
3. **Authentication issues:** Run `render login` again
4. **Network issues:** Check your internet connection and firewall

## Environment Variables

Set up environment variables for your project:

```bash
# Set environment variables for deployment
render env set KEY=VALUE chronosai-backend

# View environment variables
render env ls chronosai-backend

# Delete environment variable
render env rm KEY chronosai-backend
```

## Monitoring

Monitor your deployment:

```bash
# View service status
render ps

# View real-time logs
render logs -f chronosai-backend

# View metrics (if available)
render metrics chronosai-backend
```
