from typing import Optional, Any
from backend.app.core.compat import BaseModel, EmailStr

class SignupRequest(BaseModel):
    fullName: str
    email: str
    phone: str
    password: str

class LoginRequest(BaseModel):
    identifier: str
    password: str
    deviceFingerprint: Optional[str] = None

class SendOtpRequest(BaseModel):
    channel: str  # 'email' | 'phone'
    target: str

class VerifyOtpRequest(BaseModel):
    channel: str  # 'email' | 'phone'
    target: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    target: str
    channel: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    target: str
    otp: str
    newPassword: str
