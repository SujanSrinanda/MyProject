from typing import Optional, Dict, Any, List
from backend.app.core.compat import BaseModel

class PersonalInfo(BaseModel):
    fullName: Optional[str] = None
    city: Optional[str] = None
    profilePhoto: Optional[str] = None

class FinancialProfileSchema(BaseModel):
    incomeRange: Optional[str] = None
    spendingTarget: Optional[float] = None
    savingsGoal: Optional[float] = None
    currency: Optional[str] = None

class SecurityPreferencesSchema(BaseModel):
    securityAlertsEnabled: Optional[bool] = None
    newDeviceAlerts: Optional[bool] = None
    transactionAlerts: Optional[bool] = None
    protectionLevel: Optional[str] = None

class CategoryLimit(BaseModel):
    category: str
    limit: float

class BudgetSetupSchema(BaseModel):
    monthlyLimit: Optional[float] = None
    categories: Optional[List[CategoryLimit]] = None

class OnboardingRequest(BaseModel):
    personalInfo: Optional[Dict[str, Any]] = None
    financialProfile: Optional[Dict[str, Any]] = None
    budgetSetup: Optional[Dict[str, Any]] = None
    securityPreferences: Optional[Dict[str, Any]] = None

class UpdateProfileRequest(BaseModel):
    fullName: Optional[str] = None
    city: Optional[str] = None
    profilePhoto: Optional[str] = None
    financialProfile: Optional[Dict[str, Any]] = None
    securityProfile: Optional[Dict[str, Any]] = None
