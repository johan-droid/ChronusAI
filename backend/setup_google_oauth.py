#!/usr/bin/env python3
"""
Google OAuth Setup Script
Helps configure Google OAuth credentials and test the integration
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional
import json

def print_banner():
    """Print setup banner"""
    print("=" * 60)
    print("🚀 CHRONOSAI GOOGLE OAUTH SETUP")
    print("=" * 60)
    print()

def check_python_version():
    """Check Python version compatibility"""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    print("✅ Python version check passed")

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        "fastapi",
        "google-api-python-client",
        "google-auth-httplib2",
        "google-auth-oauthlib",
        "httpx",
        "sqlalchemy",
        "pydantic"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\nInstall with: pip install " + " ".join(missing_packages))
        return False
    
    print("✅ All required packages are installed")
    return True

def get_env_file_path() -> Path:
    """Get path to .env file"""
    backend_dir = Path(__file__).parent
    env_file = backend_dir / ".env"
    
    if not env_file.exists():
        # Try to create from example
        env_example = backend_dir / ".env.example"
        if env_example.exists():
            env_file.write_text(env_example.read_text())
            print(f"✅ Created .env file from example")
        else:
            print(f"❌ .env file not found and no .env.example available")
            sys.exit(1)
    
    return env_file

def read_env_file(env_file: Path) -> Dict[str, str]:
    """Read environment variables from .env file"""
    env_vars = {}
    
    try:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")
        sys.exit(1)
    
    return env_vars

def write_env_file(env_file: Path, env_vars: Dict[str, str]):
    """Write environment variables to .env file"""
    try:
        with open(env_file, 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
    except Exception as e:
        print(f"❌ Error writing .env file: {e}")
        sys.exit(1)

def prompt_for_credentials() -> Dict[str, str]:
    """Prompt user for Google OAuth credentials"""
    print("\n📝 Please provide your Google OAuth credentials:")
    print("   (Get these from: https://console.cloud.google.com/apis/credentials)")
    print()
    
    credentials = {}
    
    # Google Client ID
    while True:
        client_id = input("Google Client ID: ").strip()
        if client_id:
            credentials["GOOGLE_CLIENT_ID"] = client_id
            break
        print("❌ Client ID is required")
    
    # Google Client Secret
    while True:
        client_secret = input("Google Client Secret: ").strip()
        if client_secret:
            credentials["GOOGLE_CLIENT_SECRET"] = client_secret
            break
        print("❌ Client Secret is required")
    
    # Redirect URI (with default)
    default_redirect = "http://localhost:8000/api/v1/auth/google/callback"
    redirect_uri = input(f"Redirect URI [{default_redirect}]: ").strip()
    credentials["GOOGLE_REDIRECT_URI"] = redirect_uri or default_redirect
    
    # Frontend URL (with default)
    default_frontend = "http://localhost:5173"
    frontend_url = input(f"Frontend URL [{default_frontend}]: ").strip()
    credentials["FRONTEND_URL"] = frontend_url or default_frontend
    
    return credentials

def validate_credentials(credentials: Dict[str, str]) -> bool:
    """Validate Google OAuth credentials"""
    print("\n🔍 Validating credentials...")
    
    # Basic format validation
    client_id = credentials.get("GOOGLE_CLIENT_ID", "")
    client_secret = credentials.get("GOOGLE_CLIENT_SECRET", "")
    
    if not client_id or len(client_id) < 10:
        print("❌ Invalid Google Client ID format")
        return False
    
    if not client_secret or len(client_secret) < 10:
        print("❌ Invalid Google Client Secret format")
        return False
    
    print("✅ Credentials format validation passed")
    return True

def update_env_file(env_file: Path, credentials: Dict[str, str]):
    """Update .env file with new credentials"""
    env_vars = read_env_file(env_file)
    
    # Update with new credentials
    env_vars.update(credentials)
    
    # Write back to file
    write_env_file(env_file, env_vars)
    print(f"✅ Updated {env_file}")

def test_oauth_setup() -> bool:
    """Test OAuth setup by importing required modules"""
    print("\n🧪 Testing OAuth setup...")
    
    try:
        # Test imports
        from app.core.oauth import get_oauth_provider
        from app.config import settings
        print("✅ OAuth modules imported successfully")
        
        # Test configuration
        if not settings.google_client_id or not settings.google_client_secret:
            print("❌ Google OAuth credentials not configured in settings")
            return False
        
        print("✅ OAuth configuration loaded successfully")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False

def print_next_steps():
    """Print next steps for the user"""
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Start the backend server:")
    print("   cd backend && python -m uvicorn app.main:app --reload")
    print()
    print("2. Start the frontend server:")
    print("   cd frontend && npm run dev")
    print()
    print("3. Test the integration:")
    print("   - Navigate to http://localhost:5173")
    print("   - Click 'Continue with Google'")
    print("   - Complete the OAuth flow")
    print()
    print("4. Test calendar API:")
    print("   - Visit http://localhost:8000/api/docs")
    print("   - Try the /api/v1/calendar/test-connection endpoint")
    print()
    print("📚 For detailed setup guide, see: GOOGLE_OAUTH_SETUP.md")

def print_troubleshooting():
    """Print troubleshooting information"""
    print("\n🔧 Troubleshooting:")
    print("• If you get 'redirect_uri_mismatch':")
    print("  - Check the redirect URI in Google Console")
    print("  - Ensure it matches your backend URL exactly")
    print()
    print("• If you get 'invalid_client':")
    print("  - Verify your Client ID and Secret are correct")
    print("  - Check if the OAuth client is enabled")
    print()
    print("• If you get 'access_denied':")
    print("  - Ensure the user grants the required scopes")
    print("  - Check if the app is published (for production users)")
    print()
    print("📖 Full documentation: GOOGLE_OAUTH_SETUP.md")

def main():
    """Main setup function"""
    print_banner()
    
    # Check prerequisites
    check_python_version()
    
    if not check_dependencies():
        sys.exit(1)
    
    # Get .env file
    env_file = get_env_file_path()
    
    # Check if already configured
    env_vars = read_env_file(env_file)
    if env_vars.get("GOOGLE_CLIENT_ID") and env_vars.get("GOOGLE_CLIENT_SECRET"):
        print("🔍 Google OAuth credentials already configured")
        choice = input("Do you want to reconfigure? (y/N): ").strip().lower()
        if choice != 'y':
            # Test existing configuration
            if test_oauth_setup():
                print_next_steps()
                print_troubleshooting()
                return
            else:
                print("❌ Existing configuration failed, proceeding with reconfiguration")
    
    # Get credentials from user
    credentials = prompt_for_credentials()
    
    # Validate credentials
    if not validate_credentials(credentials):
        print("❌ Credential validation failed")
        sys.exit(1)
    
    # Update .env file
    update_env_file(env_file, credentials)
    
    # Test setup
    if test_oauth_setup():
        print_next_steps()
        print_troubleshooting()
    else:
        print("❌ OAuth setup test failed")
        print("Please check your credentials and try again")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
