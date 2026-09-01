from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status, Header, Depends
from backend.app.services.auth_service import auth_service

def extract_token_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    if authorization.startswith("Bearer "):
        return authorization[7:].strip()
    return authorization.strip()

async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    token = extract_token_from_header(authorization)
    if not token:
        # Check custom header x-auth-token or cookies
        token = request.headers.get("x-auth-token") or request.cookies.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing or malformed."
        )

    user = await auth_service.verify_session(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid. Please log in again."
        )

    return user

async def get_optional_user(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Optional[Dict[str, Any]]:
    token = extract_token_from_header(authorization)
    if not token:
        token = request.headers.get("x-auth-token") or request.cookies.get("token")

    if not token:
        return None

    try:
        user = await auth_service.verify_session(token)
        return user
    except Exception:
        return None
