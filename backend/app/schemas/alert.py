from typing import Optional
from backend.app.core.compat import BaseModel

class UpdateAlertRequest(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    severity: Optional[str] = None
    isRead: Optional[bool] = None
    actionTaken: Optional[str] = None
