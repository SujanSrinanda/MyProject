from fastapi import APIRouter, Depends, HTTPException, Body, status
from typing import Dict, Any
from backend.app.services.contact_service import contact_service
from backend.app.middleware.auth_middleware import get_current_user

contact_router = APIRouter()

@contact_router.get("")
@contact_router.get("/")
async def get_contacts(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await contact_service.get_contacts(current_user["id"])
    return data

@contact_router.post("", status_code=status.HTTP_201_CREATED)
@contact_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_contact(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await contact_service.create_contact(current_user["id"], payload)
    return data

@contact_router.put("/{contact_id}")
async def update_contact(
    contact_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await contact_service.update_contact(contact_id, current_user["id"], payload)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to update contact"))
    return data

@contact_router.delete("/{contact_id}")
async def delete_contact(
    contact_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await contact_service.delete_contact(contact_id, current_user["id"])
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Failed to delete contact"))
    return data
