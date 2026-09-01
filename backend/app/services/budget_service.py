from typing import Dict, Any, Tuple, List, Optional
from backend.app.repositories.budget_repo import budget_repository, BudgetRepository

class BudgetService:
    def __init__(self, budget_repo: BudgetRepository = budget_repository):
        self.budget_repo = budget_repo

    async def get_budget(self, user_id: str) -> Tuple[int, Dict[str, Any]]:
        b = self.budget_repo.find_by_user_id(user_id)
        return 200, b or {"userId": user_id, "monthlyLimit": 45000.0, "categories": []}

    async def update_budget(self, user_id: str, data: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        monthly_limit = data.get("monthlyLimit")
        categories = data.get("categories")

        existing = self.budget_repo.find_by_user_id(user_id) or {
            "userId": user_id,
            "monthlyLimit": 45000.0,
            "categories": [],
        }

        if monthly_limit is not None:
            existing["monthlyLimit"] = float(monthly_limit)
        if categories is not None:
            existing["categories"] = [
                {
                    "id": c.get("id") or f"cat-{user_id}-{c.get('category')}",
                    "userId": user_id,
                    "category": c["category"],
                    "limit": float(c["limit"]),
                }
                for c in categories
            ]

        self.budget_repo.save(existing)
        return 200, {"success": True, "budget": existing}

    async def get_categories(self, user_id: str) -> Tuple[int, List[Dict[str, Any]]]:
        b = self.budget_repo.find_by_user_id(user_id)
        return 200, b["categories"] if b else []

budget_service = BudgetService()
