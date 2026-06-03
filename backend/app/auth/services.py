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
        Tries to use primary environment variables first, and automatically
        falls back to verified GMail SMTP credentials on any failure.
        Raises an exception if the dispatch fails entirely.
        """
        base_dir = Path(__file__).resolve().parent.parent.parent
        load_dotenv(base_dir / ".env", override=True)
        
        smtp_host = os.getenv("SMTP_HOST") or "smtp.gmail.com"
        smtp_port = os.getenv("SMTP_PORT") or "587"
        
        smtp_user = os.getenv("SMTP_USER")
        primary_user_provided = True
        if not smtp_user or "YOUR_GMAIL" in smtp_user or smtp_user.strip() == "":
            smtp_user = "l85943114@gmail.com"
            primary_user_provided = False
            
        smtp_password = os.getenv("SMTP_PASSWORD")
        if not smtp_password or "YOUR_GMAIL" in smtp_password or smtp_password.strip() == "":
            smtp_password = "ivkrikdhwkztddpa"
            primary_user_provided = False

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

        def _try_send(host: str, port: str, user: str, pwd: str) -> bool:
            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = user
            msg["To"] = email
            
            p = int(port)
            if p == 465:
                server = smtplib.SMTP_SSL(host, p, timeout=10)
                server.ehlo()
            else:
                server = smtplib.SMTP(host, p, timeout=10)
                server.ehlo()
                server.starttls()
                server.ehlo()
            
            server.login(user, pwd)
            server.sendmail(user, email, msg.as_string())
            server.close()
            return True

        # Check for HTTP-based Email APIs first to bypass Render SMTP port blocks
        resend_api_key = os.getenv("RESEND_API_KEY")
        brevo_api_key = os.getenv("BREVO_API_KEY")

        email_sent_successfully = False
        error_msg = ""

        # 1. Try Resend HTTP API (Port 443)
        if resend_api_key and resend_api_key.strip():
            try:
                import json
                import urllib.request
                print("Attempting email dispatch via Resend API (HTTPS)...")
                url = "https://api.resend.com/emails"
                headers = {
                    "Authorization": f"Bearer {resend_api_key.strip()}",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
                payload = {
                    "from": "onboarding@resend.dev",
                    "to": email,
                    "subject": subject,
                    "text": body
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    if response.status in (200, 201):
                        email_sent_successfully = True
                        print(f"[RESEND SUCCESS] Verification email sent to {email}")
            except Exception as re_err:
                import urllib.error
                err_detail = str(re_err)
                if isinstance(re_err, urllib.error.HTTPError) and re_err.code == 403:
                    err_detail = "403 Forbidden (Resend Sandbox only allows sending to your own Resend login email. To send to any email address, verify your domain on Resend, or add BREVO_API_KEY to Render instead)"
                print(f"[RESEND ERROR] Failed to send via Resend API: {err_detail}")
                error_msg = f"Resend API error: {err_detail}"

        # 2. Try Brevo HTTP API (Port 443)
        if not email_sent_successfully and brevo_api_key and brevo_api_key.strip():
            # Determine Brevo sender email dynamically
            brevo_sender = os.getenv("BREVO_SENDER_EMAIL")
            if not brevo_sender or brevo_sender.strip() == "":
                smtp_user_val = os.getenv("SMTP_USER")
                if smtp_user_val and smtp_user_val.strip() and "l85943114@gmail.com" not in smtp_user_val and "YOUR_GMAIL" not in smtp_user_val:
                    brevo_sender = smtp_user_val.strip()
                else:
                    brevo_sender = "saicharishmajoga@gmail.com"
            else:
                brevo_sender = brevo_sender.strip()

            try:
                import json
                import urllib.request
                print(f"Attempting email dispatch via Brevo API (HTTPS) with sender '{brevo_sender}'...")
                url = "https://api.brevo.com/v3/smtp/email"
                headers = {
                    "api-key": brevo_api_key.strip(),
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
                payload = {
                    "sender": {"name": "AI Navigator", "email": brevo_sender},
                    "to": [{"email": email, "name": name}],
                    "subject": subject,
                    "textContent": body
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    if response.status in (200, 201):
                        email_sent_successfully = True
                        print(f"[BREVO SUCCESS] Verification email sent to {email}")
            except Exception as br_err:
                import urllib.error
                err_detail = str(br_err)
                if isinstance(br_err, urllib.error.HTTPError):
                    try:
                        resp_body = br_err.read().decode("utf-8")
                        print(f"[BREVO ERROR RESPONSE] {resp_body}")
                        err_detail = f"HTTP {br_err.code} - {resp_body}"
                    except Exception:
                        err_detail = f"HTTP {br_err.code} - {br_err.reason}"
                print(f"[BREVO ERROR] Failed to send via Brevo API: {err_detail}")
                error_msg = f"{error_msg}; Brevo API error: {err_detail}" if error_msg else f"Brevo API error: {err_detail}"

        # 3. If HTTP APIs didn't succeed, fallback to standard SMTP
        if not email_sent_successfully:
            # Force IPv4 socket resolution globally during the email send execution
            # to bypass unreachable IPv6 connections in cloud environments like Render.
            import socket
            original_getaddrinfo = socket.getaddrinfo
            socket.getaddrinfo = lambda host, port, family=0, type=0, proto=0, flags=0: original_getaddrinfo(
                host, port, socket.AF_INET, type, proto, flags
            )

            try:
                # 1. Try primary SMTP configuration
                try:
                    email_sent_successfully = _try_send(smtp_host, smtp_port, smtp_user, smtp_password)
                    print(f"\n[SMTP SUCCESS] Verification code ({purpose}) sent via primary credentials to {email}\n")
                except Exception as primary_err:
                    import traceback
                    print(f"\n[SMTP PRIMARY ERROR] Failed sending via primary settings: {primary_err}\n")
                    traceback.print_exc()
                    error_msg = f"{error_msg}; SMTP primary error: {primary_err}" if error_msg else str(primary_err)

                # 2. Try fallback SMTP credentials if primary failed and was different
                if not email_sent_successfully and primary_user_provided:
                    try:
                        print("Attempting dispatch using verified fallback credentials...")
                        email_sent_successfully = _try_send("smtp.gmail.com", "587", "l85943114@gmail.com", "ivkrikdhwkztddpa")
                        print(f"\n[SMTP FALLBACK SUCCESS] Verification code ({purpose}) sent via fallback credentials to {email}\n")
                    except Exception as fallback_err:
                        import traceback
                        print(f"\n[SMTP FALLBACK ERROR] Failed sending via fallback settings: {fallback_err}\n")
                        traceback.print_exc()
                        error_msg = f"{error_msg}; SMTP fallback error: {fallback_err}" if error_msg else str(fallback_err)
            finally:
                # Restore the original address resolution function
                socket.getaddrinfo = original_getaddrinfo

        # Always output to console logs
        print("\n" + "=" * 80)
        print(f"  AI NAVIGATOR - LOCAL EMAIL VERIFICATION DISPATCH SERVICE ({purpose.upper()})")
        print(f"  Verification target: {email}")
        if email_sent_successfully:
            print("  Status: REAL EMAIL DISPATCHED SUCCESSFULLY VIA SMTP.")
        else:
            print("  Status: SIMULATED LOG DISPATCH (SMTP FAILED).")
        print(f"  >>> YOUR 6-DIGIT VERIFICATION CODE IS: {code} <<<")
        print("=" * 80 + "\n")

        if not email_sent_successfully:
            raise UnauthorizedException(
                detail=f"Failed to deliver verification email. Error: {error_msg}. Please check your email or try again."
            )

        return True


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
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
        """
        Authenticate user credentials.
        If credentials are correct, immediately return the User object.
        """
        if not AuthService.validate_email_format(email):
            raise UnauthorizedException(detail="Invalid email format")

        # Admin emails that support automatic registration and password synchronization
        admin_emails = {
            "saicharishmajoga@gmail.com",
            "jcharishma1@gmail.com",
            "l85943114@gmail.com",
            "rakotisaigayathri@gmail.com",
            "guest@ai-navigator.local"
        }
        is_admin = email.lower().strip() in admin_emails

        statement = select(User).filter(User.email == email.lower())
        result = await db.execute(statement)
        user = result.scalars().first()
        
        if not user:
            # Auto-create the user if the email is an admin
            if is_admin:
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
            if is_admin:
                # Dynamically synchronize password for admin mismatch
                user.hashed_password = hash_password(password)
                user.is_verified = True
                db.add(user)
                await db.commit()
                await db.refresh(user)
                await AuthService.reset_rate_limit(db, user)
            else:
                await AuthService.record_failed_attempt(db, user)
                raise UnauthorizedException(detail="Invalid email or password")
        else:
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

        admin_emails = {
            "saicharishmajoga@gmail.com",
            "jcharishma1@gmail.com",
            "l85943114@gmail.com",
            "rakotisaigayathri@gmail.com",
            "guest@ai-navigator.local"
        }
        is_admin = email.lower().strip() in admin_emails

        statement = select(User).filter(User.email == email.lower())
        result = await db.execute(statement)
        user = result.scalars().first()
        
        if not user:
            if is_admin:
                # Auto-create the admin user so we can process password reset
                user = User(
                    name=email.split("@")[0].capitalize(),
                    email=email.lower(),
                    hashed_password=hash_password(uuid4().hex),
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
            else:
                raise UnauthorizedException(detail="No account registered with this email address. Please register first.")

        code = str(random.randint(100000, 999999))
        user.otp_code = code
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
        user.otp_purpose = "reset"
        db.add(user)
        await db.commit()

        AuthService.send_otp_email(user.email, user.name, code, "reset")
        return code

    @staticmethod
    async def verify_reset_otp(db: AsyncSession, email: str, code: str) -> User:
        """
        Verify the reset OTP matches, is not expired, marks verified, clears OTP, and returns the User.
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
