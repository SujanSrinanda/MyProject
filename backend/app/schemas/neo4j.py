from typing import Optional, Dict, Any, List
from backend.app.core.compat import BaseModel

class Neo4jConfigRequest(BaseModel):
    uri: str
    username: Optional[str] = "neo4j"
    password: str
    database: Optional[str] = "neo4j"

class Neo4jVerifyRequest(BaseModel):
    uri: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    database: Optional[str] = None

class Neo4jStatusResponse(BaseModel):
    configured: bool
    uri: Optional[str] = None
    database: str
