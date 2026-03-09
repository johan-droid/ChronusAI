import os
os.environ["SECRET_KEY"] = "test_secret_key"
os.environ["ENCRYPTION_KEY"] = "VRmgUf3LVjLaQ_p3Lgws_6abkbAk5W910Ha1Wolead4=" # Valid Fernet key
os.environ["JWT_SECRET_KEY"] = "test_jwt_secret"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["OPENAI_API_KEY"] = "test_openai_key"

import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestOAuthRedirect(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_google_callback_redirect(self):
        # Test that /auth/google/callback redirects to /api/v1/auth/google/callback
        response = self.client.get("/auth/google/callback?code=test_code&state=test_state", follow_redirects=False)
        self.assertEqual(response.status_code, 307)
        self.assertIn("/api/v1/auth/google/callback", response.headers["location"])
        self.assertIn("code=test_code", response.headers["location"])
        self.assertIn("state=test_state", response.headers["location"])

    def test_outlook_callback_redirect(self):
        # Test that /auth/outlook/callback redirects to /api/v1/auth/outlook/callback
        response = self.client.get("/auth/outlook/callback?code=test_code&state=test_state", follow_redirects=False)
        self.assertEqual(response.status_code, 307)
        self.assertIn("/api/v1/auth/outlook/callback", response.headers["location"])

if __name__ == "__main__":
    unittest.main()
