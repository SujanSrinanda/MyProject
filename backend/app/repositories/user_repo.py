import sqlite3
from typing import Optional, Dict, Any
from datetime import datetime
from backend.app.db.database import db_manager

def map_row_to_user(row: sqlite3.Row) -> Dict[str, Any]:
    row_keys = row.keys() if hasattr(row, 'keys') else []
    balance_val = float(row["balance"]) if "balance" in row_keys and row["balance"] is not None else 45000.0
    return {
        "id": str(row["id"]),
        "fullName": str(row["full_name"]),
        "email": str(row["email"]),
        "phone": str(row["phone"]),
        "passwordHash": str(row["password_hash"]),
        "passwordSalt": str(row["password_salt"]),
        "emailVerified": bool(row["email_verified"]),
        "phoneVerified": bool(row["phone_verified"]),
        "onboardingCompleted": bool(row["onboarding_completed"]),
        "city": str(row["city"]) if row["city"] else None,
        "profilePhoto": str(row["profile_photo"]) if row["profile_photo"] else None,
        "balance": balance_val,
        "createdAt": str(row["created_at"]),
        "lastLogin": str(row["last_login"]),
    }

def map_row_to_financial_profile(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "userId": str(row["user_id"]),
        "incomeRange": str(row["income_range"]),
        "spendingTarget": float(row["spending_target"]),
        "savingsGoal": float(row["savings_goal"]),
        "currency": str(row["currency"]),
    }

def map_row_to_security_profile(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "userId": str(row["user_id"]),
        "securityAlertsEnabled": bool(row["security_alerts_enabled"]),
        "newDeviceAlerts": bool(row["new_device_alerts"]),
        "transactionAlerts": bool(row["transaction_alerts"]),
        "protectionLevel": str(row["protection_level"]),
    }

class UserRepository:
    def find_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one("SELECT * FROM users WHERE id = ? LIMIT 1;", (user_id,))
        return map_row_to_user(row) if row else None

    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1;", (email.strip(),))
        return map_row_to_user(row) if row else None

    def find_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        cleaned = phone.strip()
        digits = "".join(c for c in cleaned if c.isdigit())
        row = db_manager.fetch_one(
            """SELECT * FROM users 
               WHERE phone = ? 
                  OR phone = ?
                  OR phone LIKE ?
                  OR phone LIKE ?
               LIMIT 1;""",
            (cleaned, f"+91{cleaned}" if not cleaned.startswith("+") else cleaned, f"%{digits[-10:]}%" if len(digits) >= 10 else cleaned, f"%{cleaned}%")
        )
        return map_row_to_user(row) if row else None

    def create(self, user: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat()
        db_manager.execute(
            """INSERT INTO users (id, full_name, email, phone, password_hash, password_salt, email_verified, phone_verified, onboarding_completed, city, profile_photo, created_at, last_login)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
            (
                user["id"],
                user["fullName"],
                user["email"].lower(),
                user["phone"],
                user["passwordHash"],
                user["passwordSalt"],
                1 if user.get("emailVerified") else 0,
                1 if user.get("phoneVerified") else 0,
                1 if user.get("onboardingCompleted") else 0,
                user.get("city"),
                user.get("profilePhoto"),
                user.get("createdAt", now),
                user.get("lastLogin", now),
            )
        )
        return user

    def update(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        existing = self.find_by_id(user_id)
        if not existing:
            return None

        merged = {**existing, **updates}
        db_manager.execute(
            """UPDATE users SET
                  full_name = ?,
                  email = ?,
                  phone = ?,
                  password_hash = ?,
                  password_salt = ?,
                  email_verified = ?,
                  phone_verified = ?,
                  onboarding_completed = ?,
                  city = ?,
                  profile_photo = ?,
                  last_login = ?
               WHERE id = ?;""",
            (
                merged["fullName"],
                merged["email"].lower(),
                merged["phone"],
                merged["passwordHash"],
                merged["passwordSalt"],
                1 if merged.get("emailVerified") else 0,
                1 if merged.get("phoneVerified") else 0,
                1 if merged.get("onboardingCompleted") else 0,
                merged.get("city"),
                merged.get("profilePhoto"),
                merged.get("lastLogin", datetime.utcnow().isoformat()),
                user_id,
            )
        )
        return merged

    def get_financial_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one("SELECT * FROM financial_profiles WHERE user_id = ? LIMIT 1;", (user_id,))
        return map_row_to_financial_profile(row) if row else None

    def set_financial_profile(self, profile: Dict[str, Any]) -> None:
        db_manager.execute(
            """INSERT INTO financial_profiles (user_id, income_range, spending_target, savings_goal, currency, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET
                 income_range = excluded.income_range,
                 spending_target = excluded.spending_target,
                 savings_goal = excluded.savings_goal,
                 currency = excluded.currency,
                 updated_at = excluded.updated_at;""",
            (
                profile["userId"],
                profile.get("incomeRange", "₹50,000–₹1,00,000"),
                float(profile.get("spendingTarget", 30000)),
                float(profile.get("savingsGoal", 10000)),
                profile.get("currency", "INR ₹"),
                datetime.utcnow().isoformat(),
            )
        )

    def get_security_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one("SELECT * FROM security_profiles WHERE user_id = ? LIMIT 1;", (user_id,))
        return map_row_to_security_profile(row) if row else None

    def set_security_profile(self, profile: Dict[str, Any]) -> None:
        db_manager.execute(
            """INSERT INTO security_profiles (user_id, security_alerts_enabled, new_device_alerts, transaction_alerts, protection_level, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET
                 security_alerts_enabled = excluded.security_alerts_enabled,
                 new_device_alerts = excluded.new_device_alerts,
                 transaction_alerts = excluded.transaction_alerts,
                 protection_level = excluded.protection_level,
                 updated_at = excluded.updated_at;""",
            (
                profile["userId"],
                1 if profile.get("securityAlertsEnabled", True) else 0,
                1 if profile.get("newDeviceAlerts", True) else 0,
                1 if profile.get("transactionAlerts", True) else 0,
                profile.get("protectionLevel", "High Protection"),
                datetime.utcnow().isoformat(),
            )
        )

    def update_balance(self, user_id: str, delta_amount: float) -> float:
        user = self.find_by_id(user_id)
        if not user:
            return 0.0
        current_bal = float(user.get("balance", 45000.0))
        new_bal = max(0.0, current_bal + delta_amount)
        db_manager.execute("UPDATE users SET balance = ? WHERE id = ?;", (new_bal, user_id))
        return new_bal

    def find_by_identifier(self, identifier: str) -> Optional[Dict[str, Any]]:
        clean = identifier.strip()
        if "@" in clean:
            return self.find_by_email(clean)
        by_phone = self.find_by_phone(clean)
        if by_phone:
            return by_phone
        row = db_manager.fetch_one("SELECT * FROM users WHERE LOWER(full_name) = LOWER(?) LIMIT 1;", (clean,))
        return map_row_to_user(row) if row else None

    def search_users(self, query_str: str) -> list[Dict[str, Any]]:
        q = f"%{query_str.strip()}%"
        rows = db_manager.fetch_all(
            "SELECT * FROM users WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ? LIMIT 20;",
            (q, q, q)
        )
        return [map_row_to_user(r) for r in rows]

user_repository = UserRepository()
