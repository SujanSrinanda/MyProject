from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
from backend.app.services.user_service import user_service
from backend.app.middleware.auth_middleware import get_current_user

user_router = APIRouter()

@user_router.put("/me/onboarding")
async def submit_onboarding(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await user_service.submit_onboarding(current_user, payload)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to submit onboarding"))
    return data

@user_router.get("/me/profile")
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await user_service.get_profile(current_user)
    return data

@user_router.put("/me/profile")
async def update_profile(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await user_service.update_profile(current_user, payload)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to update profile"))
    return data
