"""
PostgreSQL Database Setup Script
This script sets up the PostgreSQL database for AI Navigator.

Prerequisites:
- PostgreSQL 13+ installed and running
- psql command-line tool available

Usage:
1. Windows with PowerShell:
   python init_db.py

2. Windows with CMD:
   python init_db.py

3. Linux/Mac:
   python init_db.py

The script will:
1. Create the database (ai_navigator) if it doesn't exist
2. Create all required tables
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database.session import init_db, AsyncSessionLocal, engine
from app.services.user_service import UserService
from app.core.config import settings


async def setup_database():
    """Initialize the database schema."""
    print("=" * 60)
    print("AI Navigator Database Setup")
    print("=" * 60)
    
    try:
        # Create tables
        print("\n[1/3] Creating database tables...")
        import app.models
        await init_db()
        print("✓ Tables created successfully")
        
        # Verify connection
        print("\n[2/2] Verifying database connection...")
        print(f"✓ Database URL: {settings.DATABASE_URL.replace(settings.DATABASE_URL.split('@')[0].split('/')[-1], '****')}")
        
        print("\n" + "=" * 60)
        print("✓ Database setup completed successfully!")
        print("=" * 60)
        print("\nYou can now:")
        print("1. Start the backend server:")
        print("   cd backend")
        print("   .venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000")
        
    except Exception as e:
        print(f"\n✗ Error during setup: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure PostgreSQL is running")
        print("2. Verify DATABASE_URL in .env file")
        print("3. Check that the database user has permissions")
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(setup_database())
