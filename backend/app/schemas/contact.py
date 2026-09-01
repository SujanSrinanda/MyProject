from typing import Optional
from backend.app.core.compat import BaseModel

class CreateContactRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    isFavorite: Optional[bool] = False
    isNew: Optional[bool] = True

class UpdateContactRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    isFavorite: Optional[bool] = None
    isNew: Optional[bool] = None
