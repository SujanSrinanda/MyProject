from fastapi import APIRouter, Request, Depends, HTTPException, Header, Response, status
from typing import Optional, Dict, Any
from backend.app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    SendOtpRequest,
    VerifyOtpRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from backend.app.services.auth_service import auth_service
from backend.app.middleware.auth_middleware import get_current_user, extract_token_from_header
from backend.app.core.rate_limit import auth_rate_limiter, otp_send_rate_limiter

auth_router = APIRouter()

def get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"

@auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, request: Request, response: Response):
    client_ip = get_client_ip(request)
    allowed, retry_after, msg = auth_rate_limiter.check(client_ip)
    if not allowed:
        response.headers["Retry-After"] = str(retry_after)
        raise HTTPException(status_code=429, detail=msg)

    status_code, data = await auth_service.signup(payload.dict())
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Signup failed"))
    return data

@auth_router.post("/send-otp")
async def send_otp(payload: SendOtpRequest, request: Request, response: Response):
    key = f"{get_client_ip(request)}:{payload.target}"
    allowed, retry_after, msg = otp_send_rate_limiter.check(key)
    if not allowed:
        response.headers["Retry-After"] = str(retry_after)
        raise HTTPException(status_code=429, detail=msg)

    status_code, data = await auth_service.send_otp(payload.channel, payload.target)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to send OTP"))
    return data

@auth_router.post("/verify-otp")
async def verify_otp(payload: VerifyOtpRequest, request: Request, authorization: Optional[str] = Header(None)):
    token = extract_token_from_header(authorization)
    status_code, data = await auth_service.verify_otp(
        payload.channel, payload.target, payload.otp, auth_token=token
    )
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Verification failed"))
    return data

@auth_router.post("/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    client_ip = get_client_ip(request)
    allowed, retry_after, msg = auth_rate_limiter.check(client_ip)
    if not allowed:
        response.headers["Retry-After"] = str(retry_after)
        raise HTTPException(status_code=429, detail=msg)

    user_agent = request.headers.get("user-agent", "Web Browser")
    status_code, data = await auth_service.login(
        payload.identifier,
        payload.password,
        device_fingerprint=payload.deviceFingerprint,
        user_agent=user_agent
    )
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Login failed"))
    return data

@auth_router.get("/me")
async def me(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await auth_service.get_me(current_user)
    return data

@auth_router.post("/logout")
async def logout(
    request: Request,
    authorization: Optional[str] = Header(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    token = extract_token_from_header(authorization) or request.headers.get("x-auth-token") or request.cookies.get("token")
    status_code, data = await auth_service.logout(token)
    return data

@auth_router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, request: Request, response: Response):
    client_ip = get_client_ip(request)
    allowed, retry_after, msg = auth_rate_limiter.check(client_ip)
    if not allowed:
        response.headers["Retry-After"] = str(retry_after)
        raise HTTPException(status_code=429, detail=msg)

    status_code, data = await auth_service.forgot_password(payload.target, payload.channel or "email")
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to process request"))
    return data

@auth_router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, request: Request, response: Response):
    client_ip = get_client_ip(request)
    allowed, retry_after, msg = auth_rate_limiter.check(client_ip)
    if not allowed:
        response.headers["Retry-After"] = str(retry_after)
        raise HTTPException(status_code=429, detail=msg)

    status_code, data = await auth_service.reset_password(payload.target, payload.otp, payload.newPassword)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to reset password"))
    return data
