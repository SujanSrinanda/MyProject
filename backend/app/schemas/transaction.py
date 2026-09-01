from typing import Optional, List, Dict, Any
from backend.app.core.compat import BaseModel

class RiskEvaluationRequest(BaseModel):
    recipientName: str
    amount: float
    category: str
    type: str
    recipientPhone: Optional[str] = None
    note: Optional[str] = None
    deviceFingerprint: Optional[str] = None
    location: Optional[str] = None
    isNewRecipient: Optional[bool] = None

class RiskEvaluationResponse(BaseModel):
    decision: str  # 'ALLOW' | 'CHALLENGE' | 'BLOCK'
    safetyScore: int
    riskLevel: str  # 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    reasons: List[str]
    technicalDetails: Optional[Dict[str, Any]] = None

class CreateTransactionRequest(BaseModel):
    recipientName: str
    amount: float
    category: Optional[str] = "Other"
    type: Optional[str] = "PHONE"
    recipientPhone: Optional[str] = None
    note: Optional[str] = None
    deviceFingerprint: Optional[str] = None
    location: Optional[str] = None
    isNewRecipient: Optional[bool] = None
    timestamp: Optional[str] = None
    # Note: Frontend might send status, decision, safetyScore, etc. but server authoritative will evaluate them!
    status: Optional[str] = None
    decision: Optional[str] = None
    safetyScore: Optional[int] = None
    riskLevel: Optional[str] = None
    reasons: Optional[List[str]] = None
    technicalDetails: Optional[Dict[str, Any]] = None
