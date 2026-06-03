from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from ..database.session import get_db
from .services import AuthService
from .dependencies import get_current_user
from ..schemas.user import UserCreate, UserRead, UserLogin
from ..schemas.token import Token
from ..models.user import User


class OAuthUser(BaseModel):
    email: EmailStr
    name: str


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    code: str


class ResendOtpRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetOtpRequest(BaseModel):
    email: EmailStr
    code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    password: str = Field(..., min_length=6)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Registers a new user, hashes password, saves as unverified,
    and dispatches a 6-digit OTP code to their email.
    """
    user = await AuthService.register_user(db, payload)
    return user


@router.post("/login")
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Validates user credentials. If correct, temporarily blocks
    full login, generates a login OTP, sends it, and returns the token or status.
    """
    result = await AuthService.authenticate_user(db, payload.email, payload.password)
    if isinstance(result, dict) and result.get("status") == "otp_required":
        return JSONResponse(content=result)
    return {"access_token": AuthService.create_token(result), "token_type": "bearer"}


@router.post("/verify-otp", response_model=Token)
async def verify_otp(payload: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Verifies the 6-digit registration or login OTP code.
    If valid, returns the JWT access token and logs user in successfully.
    """
    user = await AuthService.verify_otp_code(db, payload.email, payload.code)
    return {"access_token": AuthService.create_token(user), "token_type": "bearer"}


@router.post("/resend-otp")
async def resend_otp(payload: ResendOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Regenerates and sends a fresh 6-digit OTP for the given user email.
    """
    await AuthService.resend_otp_code(db, payload.email)
    return {"success": True, "message": "Verification code resent successfully"}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Triggers password reset flow. Sends a 6-digit reset OTP if email exists.
    """
    otp_code = await AuthService.forgot_password_request(db, payload.email)
    return {
        "success": True, 
        "message": "If the email exists, a password reset code has been sent.",
        "otp_code": otp_code
    }


@router.post("/verify-reset-otp", response_model=Token)
async def verify_reset_otp(payload: VerifyResetOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Validates the 6-digit password reset OTP and logs the user in.
    """
    user = await AuthService.verify_reset_otp(db, payload.email, payload.code)
    return {"access_token": AuthService.create_token(user), "token_type": "bearer"}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Resets the user's password using the verified reset OTP and hashes the new password.
    """
    await AuthService.reset_password_commit(db, payload.email, payload.code, payload.password)
    return {"success": True, "message": "Password reset successfully. You can now log in."}


@router.post("/guest", response_model=Token)
async def guest(db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_guest_user(db)
    return {"access_token": AuthService.create_token(user), "token_type": "bearer"}


@router.post("/oauth/google", response_model=Token)
async def google_oauth(payload: OAuthUser, db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_oauth_user(db, payload.email, payload.name)
    return {"access_token": AuthService.create_token(user), "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
