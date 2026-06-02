from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserRead(UserBase):
    id: int
    role: str
    created_at: datetime
    otp_code: str | None = None

    model_config = {"from_attributes": True}
