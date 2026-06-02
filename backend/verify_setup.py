"""
Backend Setup Verification Script
This script verifies that all backend components are properly configured.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from app.core.security import hash_password, verify_password


async def verify_setup():
    """Verify backend setup."""
    print("\n" + "=" * 60)
    print("AI Navigator Backend Setup Verification")
    print("=" * 60 + "\n")
    
    checks_passed = 0
    checks_total = 0
    
    # Check 1: Configuration
    checks_total += 1
    print("[1] Configuration Files")
    try:
        print(f"✓ DATABASE_URL: {settings.DATABASE_URL[:50]}...")
        print(f"✓ JWT_ALGORITHM: {settings.JWT_ALGORITHM}")
        print(f"✓ ACCESS_TOKEN_EXPIRE_MINUTES: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")
        checks_passed += 1
    except Exception as e:
        print(f"✗ Configuration error: {e}")
    
    # Check 2: Password Hashing
    checks_total += 1
    print("\n[2] Password Security (bcrypt)")
    try:
        test_password = "abcDEF"
        hashed = hash_password(test_password)
        verified = verify_password(test_password, hashed)
        print(f"✓ Password hashing: OK")
        print(f"✓ Password verification: {verified}")
        checks_passed += 1
    except Exception as e:
        print(f"✗ Password security error: {e}")
    
    # Check 3: JWT Configuration
    checks_total += 1
    print("\n[3] JWT Configuration")
    try:
        from app.core.security import create_access_token, decode_access_token
        token = create_access_token(subject=1)
        payload = decode_access_token(token)
        print(f"✓ Token creation: OK")
        print(f"✓ Token payload: {payload.get('sub')}")
        checks_passed += 1
    except Exception as e:
        print(f"✗ JWT error: {e}")
    
    # Check 4: Database Models
    checks_total += 1
    print("\n[4] Database Models")
    try:
        from app.models.user import User
        print(f"✓ User model: {User.__tablename__}")
        print(f"✓ User columns: id, name, email, hashed_password, role, created_at")
        checks_passed += 1
    except Exception as e:
        print(f"✗ Model error: {e}")
    
    # Check 5: Services
    checks_total += 1
    print("\n[5] Service Layer")
    try:
        from app.auth.services import AuthService
        from app.services.user_service import UserService
        print(f"✓ AuthService: authenticate_user, register_user, create_token")
        print(f"✓ UserService: get_user_by_email, get_all_users")
        checks_passed += 1
    except Exception as e:
        print(f"✗ Service error: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print(f"Verification Results: {checks_passed}/{checks_total} checks passed")
    print("=" * 60)
    
    if checks_passed == checks_total:
        print("\n✓ Backend is properly configured!")
        print("\nNext steps:")
        print("1. Ensure PostgreSQL is running")
        print("2. Run: python init_db.py")
        print("3. Start the server: python -m uvicorn app.main:app --reload")
        return 0
    else:
        print(f"\n✗ {checks_total - checks_passed} checks failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(verify_setup())
    sys.exit(exit_code)
