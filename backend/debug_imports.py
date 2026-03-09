import sys
import os

# Add project root to sys.path
sys.path.append(os.getcwd())

print("Testing imports...")

try:
    print("Importing sqlalchemy...")
    import sqlalchemy
    print(f"SQLAlchemy version: {sqlalchemy.__version__}")
except Exception as e:
    print(f"Failed to import sqlalchemy: {e}")

try:
    print("Importing app.config...")
    from app.config import settings
    print(f"Database URL: {settings.database_url}")
except Exception as e:
    print(f"Failed to import app.config: {e}")

try:
    print("Importing app.db.session...")
    from app.db.session import engine
    print(f"Engine URL: {engine.url}")
except Exception as e:
    print(f"Failed to import app.db.session: {e}")

try:
    print("Importing app.models...")
    from app.models import user
    print("Imported user model.")
except Exception as e:
    print(f"Failed to import app.models.user: {e}")
    import traceback
    traceback.print_exc()

print("Done.")
