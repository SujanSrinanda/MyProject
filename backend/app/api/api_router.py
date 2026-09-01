from fastapi import APIRouter, Depends, Body, HTTPException
from typing import Dict, Any
from backend.app.api.auth_routes import auth_router
from backend.app.api.user_routes import user_router
from backend.app.api.budget_routes import budget_router
from backend.app.api.transaction_routes import transaction_router
from backend.app.api.contact_routes import contact_router
from backend.app.api.alert_routes import alert_router
from backend.app.api.device_routes import device_router
from backend.app.api.neo4j_routes import neo4j_router
from backend.app.services.transaction_service import transaction_service
from backend.app.middleware.auth_middleware import get_current_user

api_router = APIRouter()

@api_router.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "SentinelFin Security Core (Python FastAPI)"}

# Evaluate transaction top-level route alias
@api_router.post("/api/evaluate-transaction")
async def evaluate_transaction_alias(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await transaction_service.evaluate_transaction(payload)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Evaluation failed"))
    return data

# Mount modular sub-routers
api_router.include_router(auth_router, prefix="/api/auth", tags=["auth"])
api_router.include_router(user_router, prefix="/api/users", tags=["users"])
api_router.include_router(budget_router, prefix="/api/budgets", tags=["budgets"])
api_router.include_router(transaction_router, prefix="/api/transactions", tags=["transactions"])
api_router.include_router(contact_router, prefix="/api/contacts", tags=["contacts"])
api_router.include_router(alert_router, prefix="/api/alerts", tags=["alerts"])
api_router.include_router(device_router, prefix="/api/devices", tags=["devices"])
api_router.include_router(neo4j_router, prefix="/api/neo4j", tags=["neo4j"])
