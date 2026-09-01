from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any, Optional
from backend.app.services.neo4j_service import neo4j_service
from backend.app.middleware.auth_middleware import get_current_user

neo4j_router = APIRouter()

@neo4j_router.get("/status")
async def get_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = neo4j_service.get_status()
    return data

@neo4j_router.post("/verify")
async def verify_connection(
    payload: Optional[Dict[str, Any]] = Body(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await neo4j_service.verify(payload)
    return data

@neo4j_router.post("/config")
async def update_config(
    payload: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    status_code, data = await neo4j_service.update_config(payload)
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=data.get("error", "Neo4j configuration failed"))
    return data

@neo4j_router.get("/graph")
async def get_graph(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await neo4j_service.get_graph(current_user["id"])
    return data

@neo4j_router.get("/logs")
async def get_logs(current_user: Dict[str, Any] = Depends(get_current_user)):
    status_code, data = await neo4j_service.get_logs()
    return data
