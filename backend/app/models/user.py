from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from ..database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False, default="client")
    is_verified = Column(Boolean, default=False, nullable=True)
    verification_code = Column(String(32), nullable=True)
    otp_code = Column(String(32), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_purpose = Column(String(32), nullable=True)  # "register", "login", "reset"
    login_attempts = Column(Integer, default=0, nullable=True)
    last_attempt_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

