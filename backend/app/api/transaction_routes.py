from fastapi import APIRouter, Depends, HTTPException, Body, status
from typing import Dict, Any
from backend.app.services.transaction_service import transaction_service
from backend.app.middleware.auth_middleware import get_current_user

transaction_router = APIRouter()

@transaction_router.get("")
@transaction_router.get("/")
async def get_transactions(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await transaction_service.get_transactions(current_user["id"])
    return data

@transaction_router.post("", status_code=status.HTTP_201_CREATED)
@transaction_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await transaction_service.create_transaction(current_user, payload)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Transaction failed"))
    return data

@transaction_router.post("/evaluate")
async def evaluate_transaction(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await transaction_service.evaluate_transaction(payload)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Evaluation failed"))
    return data
