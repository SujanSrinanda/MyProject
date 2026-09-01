import sqlite3
from typing import Optional, Dict, Any, List
from datetime import datetime
from backend.app.db.database import db_manager

class BudgetRepository:
    def find_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        budget_row = db_manager.fetch_one("SELECT * FROM budgets WHERE user_id = ? LIMIT 1;", (user_id,))
        if not budget_row:
            return None

        cat_rows = db_manager.fetch_all(
            "SELECT * FROM budget_categories WHERE user_id = ? ORDER BY id ASC;",
            (user_id,)
        )

        categories = [
            {
                "id": str(r["id"]),
                "userId": str(r["user_id"]),
                "category": str(r["category"]),
                "limit": float(r["limit_amount"]),
            }
            for r in cat_rows
        ]

        return {
            "userId": str(budget_row["user_id"]),
            "monthlyLimit": float(budget_row["monthly_limit"]),
            "categories": categories,
        }

    def save(self, budget: Dict[str, Any]) -> None:
        user_id = budget["userId"]
        monthly_limit = float(budget.get("monthlyLimit", 45000))
        categories = budget.get("categories", [])
        now = datetime.utcnow().isoformat()

        with db_manager.transaction() as conn:
            conn.execute(
                """INSERT INTO budgets (user_id, monthly_limit, updated_at)
                   VALUES (?, ?, ?)
                   ON CONFLICT(user_id) DO UPDATE SET
                     monthly_limit = excluded.monthly_limit,
                     updated_at = excluded.updated_at;""",
                (user_id, monthly_limit, now)
            )

            conn.execute("DELETE FROM budget_categories WHERE user_id = ?;", (user_id,))

            for cat in categories:
                cat_id = cat.get("id") or f"cat-{user_id}-{cat.get('category')}"
                conn.execute(
                    """INSERT INTO budget_categories (id, user_id, category, limit_amount, created_at)
                       VALUES (?, ?, ?, ?, ?);""",
                    (cat_id, user_id, cat["category"], float(cat["limit"]), now)
                )

budget_repository = BudgetRepository()
