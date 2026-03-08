#!/usr/bin/env python3
"""
Google OAuth 2.0 Setup Script for ChronosAI
This script helps you set up Google OAuth 2.0 credentials for the ChronosAI application.
"""

import os
import json
import secrets
import webbrowser
from urllib.parse import urlencode, urlparse, parse_qs

# Configuration
GOOGLE_OAUTH_CONFIG = {
    "web": {
        "auth_uri": "http://localhost:8000/api/v1/auth/google/callback",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
        "redirect_uris": ["http://localhost:8000/api/v1/auth/google/callback"],
        "javascript_origins": ["http://localhost:5173", "http://localhost:8000"],
        "access_type": "offline",
        "response_type": "code",
        "scope": [
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile"
        ]
    }
}

def print_header():
    """Print setup header."""
    print("=" * 60)
    print("🔧 ChronosAI - Google OAuth 2.0 Setup")
    print("=" * 60)
    print()

def print_instructions():
    """Print step-by-step instructions."""
    print("📋 Follow these steps to set up Google OAuth 2.0 for ChronosAI:")
    print()
    print("1. 🌐 Go to Google Cloud Console:")
    print("   https://console.cloud.google.com/")
    print()
    print("2. 📱 Create a new project or select an existing one")
    print()
    print("3. 🔍 Enable the following APIs:")
    print("   • Google Calendar API")
    print("   • Google+ API")
    print("   • People API")
    print()
    print("4. ⚙️  Configure OAuth consent screen:")
    print("   • Application type: Web application")
    print("   • Application name: ChronosAI")
    print("   • Authorized domains: chronusai.onrender.com")
    print("   • Developer contact information: your-email@example.com")
    print()
    print("5. 🔑 Create credentials:")
    print("   • OAuth client ID")
    print("   • Web application")
    print("   • Authorized redirect URIs:")
    print("     - http://localhost:8000/api/v1/auth/google/callback")
    print("     - https://chronusai.onrender.com/api/v1/auth/google/callback")
    print()
    print("6. 📝 Download the credentials JSON file")
    print("7. 📄 Save it as 'google-oauth-credentials.json' in the backend directory")
    print()
    print("8. ⚙️  Update your backend environment variables:")
    print("   GOOGLE_CLIENT_ID=your_client_id")
    print("   GOOGLE_CLIENT_SECRET=your_client_secret")
    print("   GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback")
    print()

def check_existing_credentials():
    """Check if credentials already exist."""
    backend_dir = "backend"
    credentials_file = os.path.join(backend_dir, "google-oauth-credentials.json")
    
    if os.path.exists(credentials_file):
        print("✅ Google OAuth credentials already exist!")
        print(f"   Location: {credentials_file}")
        return True
    return False

def create_env_file():
    """Create or update .env.local file with Google OAuth variables."""
    backend_dir = "backend"
    env_file = os.path.join(backend_dir, ".env.local")
    
    env_content = """# Database Configuration
DATABASE_URL=postgresql://user:password@localhost/chronosai

# AI Configuration
OPENAI_API_KEY=your_openai_api_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Application Configuration
SECRET_KEY=your_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here

# Frontend URL (for development)
FRONTEND_URL=http://localhost:5173

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:8000
"""
    
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print(f"✅ Created .env.local file in {backend_dir}")
    print("   Please update the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET values")

def test_oauth_config():
    """Test the OAuth configuration."""
    print("\n🧪 Testing OAuth Configuration...")
    
    # Check if environment variables are set
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    if not google_client_id or google_client_id == "your_google_client_id_here":
        print("❌ Google OAuth credentials not properly configured!")
        print("   Please update the .env.local file with your actual credentials")
        return False
    
    if not google_client_secret or google_client_secret == "your_google_client_secret_here":
        print("❌ Google OAuth client secret not properly configured!")
        print("   Please update the .env.local file with your actual client secret")
        return False
    
    print("✅ OAuth configuration appears to be properly set up!")
    return True

def main():
    """Main setup function."""
    print_header()
    
    if check_existing_credentials():
        choice = input("Do you want to continue anyway? (y/n): ").lower()
        if choice != 'y':
            print("Setup cancelled.")
            return
    
    print_instructions()
    
    # Create .env.local file
    create_env_file()
    
    # Test configuration
    test_oauth_config()
    
    print("\n🎉 Setup complete!")
    print("📚 Next steps:")
    print("   1. Restart the backend server")
    print("   2. Navigate to http://localhost:8000/api/v1/auth/google/login")
    print("   3. Complete the OAuth flow")
    print("   4. Test the Google Calendar integration")
    print()
    print("🔗 For more help, visit:")
    print("   • https://developers.google.com/calendar/api/quickstart/python")
    print("   • https://developers.google.com/identity/protocols/oauth2/web-server")

if __name__ == "__main__":
    main()
