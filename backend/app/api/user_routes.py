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

@user_router.get("/search")
async def search_users(
    q: str = "",
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await user_service.search_users(current_user["id"], q)
    return data

@user_router.get("/lookup/{identifier}")
async def lookup_user(
    identifier: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await user_service.lookup_user(identifier)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "User not found"))
    return data

@user_router.get("/pin/status")
async def get_pin_status_legacy(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await user_service.get_pin_status(current_user["id"])
    return data

@user_router.get("/me/pin/status")
async def get_pin_status_me(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await user_service.get_pin_status(current_user["id"])
    return data

@user_router.post("/pin/set")
async def set_pin_legacy(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    pin = payload.get("pin", "")
    status_code, data = await user_service.set_pin(current_user["id"], pin)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to update PIN"))
    return data

@user_router.post("/me/pin/set")
async def set_pin_me(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    pin = payload.get("pin", "")
    status_code, data = await user_service.set_pin(current_user["id"], pin)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to update PIN"))
    return data

@user_router.post("/pin/verify")
async def verify_pin_legacy(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    pin = payload.get("pin", "")
    status_code, data = await user_service.verify_pin(current_user["id"], pin)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Incorrect PIN"))
    return data

@user_router.post("/me/pin/verify")
async def verify_pin_me(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    pin = payload.get("pin", "")
    status_code, data = await user_service.verify_pin(current_user["id"], pin)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Incorrect PIN"))
    return data
