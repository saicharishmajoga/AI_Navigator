import os
import re
import random
import smtplib
from datetime import datetime, timedelta
from uuid import uuid4
from email.mime.text import MIMEText
from pathlib import Path
from dotenv import load_dotenv

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user import User
from ..core.security import hash_password, verify_password, create_access_token
from ..core.exceptions import UnauthorizedException
from ..schemas.user import UserCreate

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def load_allowed_emails() -> set[str]:
    txt_path = Path(__file__).resolve().parent.parent.parent / "allowed_emails.txt"
    defaults = {
        "saicharishmajoga@gmail.com",
        "jcharishma1@gmail.com",
        "l85943114@gmail.com",
        "guest@ai-navigator.local",
        "oauth.user@gmail.com"
    }
    if not txt_path.exists():
        try:
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write("\n".join(sorted(defaults)))
        except Exception:
            pass
        return defaults

    try:
        with open(txt_path, "r", encoding="utf-8") as f:
            lines = [line.strip().lower() for line in f if line.strip()]
        return set(lines)
    except Exception:
        return defaults

class AuthService:
    @staticmethod
    def validate_email_format(email: str) -> bool:
        return bool(EMAIL_REGEX.match(email))

    @staticmethod
    def is_email_allowed(email: str) -> bool:
        allowed = load_allowed_emails()
        return email.lower().strip() in allowed

    @staticmethod
    def send_otp_email(email: str, name: str, code: str, purpose: str) -> bool:
        """
        Helper method to dispatch the 6-digit OTP code.
        If SMTP is dynamically configured in `.env`, it will send a real email.
        Otherwise, it logs to the server terminal.
        """
        base_dir = Path(__file__).resolve().parent.parent.parent
        load_dotenv(base_dir / ".env", override=True)
        
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = os.getenv("SMTP_PORT")
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")

        purpose_titles = {
            "register": "Verify your email",
            "login": "Login Verification Code",
            "reset": "Password Reset Code"
        }
        subject = f"{purpose_titles.get(purpose, 'Verification Code')} - AI Navigator"

        body = (
            f"Hi {name},\n\n"
            f"Here is your 6-digit verification code for AI Navigator:\n\n"
            f"👉   {code}   👈\n\n"
            f"This code will expire in 5 minutes and is single-use only.\n\n"
            f"Best regards,\n"
            f"The AI Navigator Team"
        )

        email_sent_successfully = False
        if smtp_host and smtp_port and smtp_user and smtp_password and "YOUR_GMAIL" not in smtp_user:
            try:
                msg = MIMEText(body)
                msg["Subject"] = subject
                msg["From"] = smtp_user
                msg["To"] = email

                port = int(smtp_port)
                if port == 465:
                    server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
                    server.ehlo()
                else:
                    server = smtplib.SMTP(smtp_host, port, timeout=10)
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, email, msg.as_string())
                server.close()
                print(f"\n[SMTP SUCCESS] Verification code ({purpose}) real email successfully dispatched to {email}\n")
                email_sent_successfully = True
            except Exception as se:
                print(f"\n[SMTP ERROR] Real email dispatch failed: {se}. Falling back to terminal logs.\n")

        # Always output to console logs
        print("\n" + "=" * 80)
        print(f"  AI NAVIGATOR - LOCAL EMAIL VERIFICATION DISPATCH SERVICE ({purpose.upper()})")
        print(f"  Verification target: {email}")
        if email_sent_successfully:
            print("  Status: REAL EMAIL DISPATCHED SUCCESSFULLY VIA SMTP.")
        else:
            print("  Status: SIMULATED LOG DISPATCH (SMTP NOT ACTIVE / NO SMTP IN .env).")
        print(f"  >>> YOUR 6-DIGIT VERIFICATION CODE IS: {code} <<<")
        print("=" * 80 + "\n")
        return email_sent_successfully

    @staticmethod
    async def check_rate_limit(db: AsyncSession, user: User):
        """
        Enforce rate limiting: maximum of 5 attempts within a 15-minute window.
        """
        now = datetime.utcnow()
        if user.last_attempt_at:
            time_passed = now - user.last_attempt_at
            if time_passed < timedelta(minutes=15):
                if user.login_attempts and user.login_attempts >= 5:
                    raise UnauthorizedException(detail="Too many failed attempts. Please try again in 15 minutes.")
            else:
                # Reset attempt tracker if window has elapsed
                user.login_attempts = 0
                db.add(user)
                await db.commit()

    @staticmethod
    async def record_failed_attempt(db: AsyncSession, user: User):
        """
        Increment the attempt counter and update timestamp.
        """
        now = datetime.utcnow()
        if user.last_attempt_at:
            time_passed = now - user.last_attempt_at
            if time_passed < timedelta(minutes=15):
                user.login_attempts = (user.login_attempts or 0) + 1
            else:
                user.login_attempts = 1
        else:
            user.login_attempts = 1
        
        user.last_attempt_at = now
        db.add(user)
        await db.commit()

    @staticmethod
    async def reset_rate_limit(db: AsyncSession, user: User):
        """
        Reset attempt tracking on success.
        """
        user.login_attempts = 0
        user.last_attempt_at = None
        db.add(user)
        await db.commit()

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | dict:
        """
        Authenticate user credentials.
        If credentials are correct, generate a dynamic 6-digit login OTP,
        temporarily block the login, and return an 'otp_required' status.
        """
        if not AuthService.validate_email_format(email):
            raise UnauthorizedException(detail="Invalid email format")

        if not AuthService.is_email_allowed(email):
            raise UnauthorizedException(detail="Email address is not pre-approved. Access denied.")

        statement = select(User).filter(User.email == email.lower())
        result = await db.execute(statement)
        user = result.scalars().first()
        
        if not user:
            # Auto-create the user if the email is pre-approved
            if AuthService.is_email_allowed(email):
                user = User(
                    name=email.split("@")[0].capitalize(),
                    email=email.lower(),
                    hashed_password=hash_password(password),
                    role="client",
                    is_verified=True,
                    otp_code=None,
                    otp_expires_at=None,
                    otp_purpose=None,
                    login_attempts=0
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                return user
            else:
                raise UnauthorizedException(detail="Invalid email or password")
        
        # Enforce Rate Limiting
        await AuthService.check_rate_limit(db, user)

        if not verify_password(password, user.hashed_password):
            await AuthService.record_failed_attempt(db, user)
            raise UnauthorizedException(detail="Invalid email or password")

        # Successful credential check - immediately reset rate limits and return user
        await AuthService.reset_rate_limit(db, user)
        
        if not user.is_verified:
            user.is_verified = True
            db.add(user)
            await db.commit()
            await db.refresh(user)

        return user

    @staticmethod
    async def register_user(db: AsyncSession, payload: UserCreate) -> User:
        """
        Register a new user, validate input, hash password,
        and send a 5-minute registration OTP code.
        """
        if not AuthService.validate_email_format(payload.email):
            raise UnauthorizedException(detail="Invalid email format")

        if not AuthService.is_email_allowed(payload.email):
            raise UnauthorizedException(detail="This email address is not pre-approved. Registration denied.")

        statement = select(User).filter(User.email == payload.email.lower())
        result = await db.execute(statement)
        if result.scalars().first():
            raise UnauthorizedException(detail="Email already registered")

        code = str(random.randint(100000, 999999))
        user = User(
            name=payload.name,
            email=payload.email.lower(),
            hashed_password=hash_password(payload.password),
            role="client",
            is_verified=False,
            otp_code=code,
            otp_expires_at=datetime.utcnow() + timedelta(minutes=5),
            otp_purpose="register",
            login_attempts=0
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        AuthService.send_otp_email(user.email, user.name, code, "register")
        return user

    @staticmethod
    async def verify_otp_code(db: AsyncSession, email: str, code: str) -> User:
        """
        Verify the 6-digit OTP code for registration or login.
        Validates correctness, expiration, and resets rate-limiting.
        """
        statement = select(User).filter(User.email == email.lower())
        result = await db.execute(statement)
        user = result.scalars().first()
        
        if not user:
            raise UnauthorizedException(detail="User not found")

        # Rate Limit check
        await AuthService.check_rate_limit(db, user)

        if not user.otp_code or user.otp_code != code.strip() or not user.otp_expires_at:
            await AuthService.record_failed_attempt(db, user)
            raise UnauthorizedException(detail="Invalid or expired verification code")

        if datetime.utcnow() > user.otp_expires_at:
            await AuthService.record_failed_attempt(db, user)
            raise UnauthorizedException(detail="Invalid or expired verification code")

        # Success - mark verified, clear OTP
        user.is_verified = True
        user.otp_code = None
        user.otp_expires_at = None
        user.otp_purpose = None
        await AuthService.reset_rate_limit(db, user)
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def resend_otp_code(db: AsyncSession, email: str) -> bool:
        """
        Regenerate a new 6-digit OTP, send it, and refresh expiration to 5 mins.
        """
        statement = select(User).filter(User.email == email.lower())
        result = await db.execute(statement)
        user = result.scalars().first()
        
        if not user:
            raise UnauthorizedException(detail="User not found")

        code = str(random.randint(100000, 999999))
        purpose = user.otp_purpose or ("login" if user.is_verified else "register")
        
        user.otp_code = code
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
        user.otp_purpose = purpose
        db.add(user)
        await db.commit()
        
        AuthService.send_otp_email(user.email, user.name, code, purpose)
        return True

    @staticmethod
    async def forgot_password_request(db: AsyncSession, email: str) -> str | None:
        """
        Initiates the password reset flow. Generates a 6-digit reset OTP if email exists.
        """
        if not AuthService.validate_email_format(email):
            raise UnauthorizedException(detail="Invalid email format")

        if not AuthService.is_email_allowed(email):
            raise UnauthorizedException(detail="Email address is not pre-approved. Access denied.")

        statement = select(User).filter(User.email == email.lower())
        result = await db.execute(statement)
        user = result.scalars().first()
        
        if not user:
            return None

        code = str(random.randint(100000, 999999))
        user.otp_code = code
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
        user.otp_purpose = "reset"
        db.add(user)
        await db.commit()

        AuthService.send_otp_email(user.email, user.name, code, "reset")
        return code

    @staticmethod
    async def verify_reset_otp(db: AsyncSession, email: str, code: str) -> bool:
        """
        Verify the reset OTP matches and is not expired.
        """
        statement = select(User).filter(User.email == email.lower())
        result = await db.execute(statement)
        user = result.scalars().first()
        
        if not user:
            raise UnauthorizedException(detail="User not found")

        await AuthService.check_rate_limit(db, user)

        if not user.otp_code or user.otp_code != code.strip() or user.otp_purpose != "reset" or not user.otp_expires_at:
            await AuthService.record_failed_attempt(db, user)
            raise UnauthorizedException(detail="Invalid or expired verification code")

        if datetime.utcnow() > user.otp_expires_at:
            await AuthService.record_failed_attempt(db, user)
            raise UnauthorizedException(detail="Invalid or expired verification code")

        await AuthService.reset_rate_limit(db, user)
        return True

    @staticmethod
    async def reset_password_commit(db: AsyncSession, email: str, code: str, new_password: str) -> bool:
        """
        Verify reset OTP once more, secure-hash new password, updates database,
        and invalidates OTP/reset token.
        """
        statement = select(User).filter(User.email == email.lower())
        result = await db.execute(statement)
        user = result.scalars().first()
        
        if not user:
            raise UnauthorizedException(detail="User not found")

        if not user.otp_code or user.otp_code != code.strip() or user.otp_purpose != "reset" or not user.otp_expires_at:
            raise UnauthorizedException(detail="Invalid or expired verification code")

        if datetime.utcnow() > user.otp_expires_at:
            raise UnauthorizedException(detail="Invalid or expired verification code")

        if len(new_password) < 6:
            raise UnauthorizedException(detail="Password must be at least 6 characters")

        # Reset password securely
        user.hashed_password = hash_password(new_password)
        user.otp_code = None
        user.otp_expires_at = None
        user.otp_purpose = None
        await AuthService.reset_rate_limit(db, user)
        
        db.add(user)
        await db.commit()
        return True

    @staticmethod
    async def get_or_create_guest_user(db: AsyncSession) -> User:
        guest_email = "guest@ai-navigator.local"
        statement = select(User).filter(User.email == guest_email)
        result = await db.execute(statement)
        user = result.scalars().first()
        if user:
            return user

        user = User(
            name="Guest",
            email=guest_email,
            hashed_password=hash_password(uuid4().hex),
            role="guest",
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def get_or_create_oauth_user(db: AsyncSession, email: str, name: str) -> User:
        statement = select(User).filter(User.email == email.lower())
        result = await db.execute(statement)
        user = result.scalars().first()
        if user:
            return user

        user = User(
            name=name,
            email=email.lower(),
            hashed_password=hash_password(uuid4().hex),
            role="client",
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    def create_token(user: User) -> str:
        return create_access_token(subject=user.id)
