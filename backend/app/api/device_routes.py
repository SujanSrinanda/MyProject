from fastapi import APIRouter, Depends, HTTPException, Body, Request
from typing import Dict, Any
from backend.app.services.device_service import device_service
from backend.app.middleware.auth_middleware import get_current_user

device_router = APIRouter()

@device_router.get("")
@device_router.get("/")
async def get_devices(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await device_service.get_devices(current_user["id"])
    return data

@device_router.post("/register")
async def register_device(
    request: Request,
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_agent = request.headers.get("user-agent", "Web Browser")
    status_code, data = await device_service.register_device(current_user["id"], user_agent, payload)
    return data

@device_router.delete("/{device_id}")
async def delete_device(
    device_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await device_service.delete_device(device_id, current_user["id"])
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to delete device"))
    return data
