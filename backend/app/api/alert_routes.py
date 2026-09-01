from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
from backend.app.services.alert_service import alert_service
from backend.app.middleware.auth_middleware import get_current_user

alert_router = APIRouter()

@alert_router.get("")
@alert_router.get("/")
async def get_alerts(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await alert_service.get_alerts(current_user["id"])
    return data

@alert_router.post("", status_code=201)
@alert_router.post("/", status_code=201)
async def create_alert(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await alert_service.create_alert(current_user["id"], payload)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to create alert"))
    return data

@alert_router.put("/{alert_id}")
async def update_alert(
    alert_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await alert_service.update_alert(alert_id, current_user["id"], payload)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to update alert"))
    return data

@alert_router.delete("")
@alert_router.delete("/")
async def clear_alerts(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await alert_service.clear_alerts(current_user["id"])
    return data

@alert_router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await alert_service.delete_alert(alert_id, current_user["id"])
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to delete alert"))
    return data
