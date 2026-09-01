from typing import Optional
from backend.app.core.compat import BaseModel

class RegisterDeviceRequest(BaseModel):
    name: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    fingerprint: Optional[str] = None
    location: Optional[str] = None
