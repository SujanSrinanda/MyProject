from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
from backend.app.services.budget_service import budget_service
from backend.app.middleware.auth_middleware import get_current_user

budget_router = APIRouter()

@budget_router.get("")
@budget_router.get("/")
async def get_budget(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await budget_service.get_budget(current_user["id"])
    return data

@budget_router.post("")
@budget_router.post("/")
async def update_budget_post(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await budget_service.update_budget(current_user["id"], payload)
    return data

@budget_router.put("")
@budget_router.put("/")
async def update_budget_put(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await budget_service.update_budget(current_user["id"], payload)
    return data

@budget_router.get("/categories")
async def get_categories(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await budget_service.get_categories(current_user["id"])
    return data
