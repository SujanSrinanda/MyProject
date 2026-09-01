from typing import Optional, List
from backend.app.core.compat import BaseModel

class CategoryBudget(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    category: str
    limit: float

class UpdateBudgetRequest(BaseModel):
    monthlyLimit: Optional[float] = None
    categories: Optional[List[CategoryBudget]] = None

class UserBudgetResponse(BaseModel):
    userId: str
    monthlyLimit: float
    categories: List[CategoryBudget]
