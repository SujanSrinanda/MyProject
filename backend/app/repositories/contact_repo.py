import sqlite3
from typing import Optional, Dict, Any, List
from datetime import datetime
from backend.app.db.database import db_manager

def map_row_to_contact(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "userId": str(row["user_id"]),
        "name": str(row["name"]),
        "phone": str(row["phone"]),
        "email": str(row["email"]) if row["email"] else None,
        "isFavorite": bool(row["is_favorite"]),
        "isNew": bool(row["is_new"]),
    }

class ContactRepository:
    def find_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        rows = db_manager.fetch_all(
            "SELECT * FROM contacts WHERE user_id = ? ORDER BY is_favorite DESC, name ASC;",
            (user_id,)
        )
        return [map_row_to_contact(r) for r in rows]

    def find_by_id_and_user_id(self, contact_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one(
            "SELECT * FROM contacts WHERE id = ? AND user_id = ? LIMIT 1;",
            (contact_id, user_id)
        )
        return map_row_to_contact(row) if row else None

    def create(self, contact: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat()
        db_manager.execute(
            """INSERT INTO contacts (id, user_id, name, phone, email, is_favorite, is_new, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?);""",
            (
                contact["id"],
                contact["userId"],
                contact["name"],
                contact["phone"],
                contact.get("email"),
                1 if contact.get("isFavorite") else 0,
                1 if contact.get("isNew", True) else 0,
                now,
            )
        )
        return contact

    def update(self, contact_id: str, user_id: str, updates: Dict[str, Any]) -> bool:
        existing = self.find_by_id_and_user_id(contact_id, user_id)
        if not existing:
            return False

        merged = {**existing, **updates}
        db_manager.execute(
            """UPDATE contacts SET
                  name = ?,
                  phone = ?,
                  email = ?,
                  is_favorite = ?,
                  is_new = ?
               WHERE id = ? AND user_id = ?;""",
            (
                merged["name"],
                merged["phone"],
                merged.get("email"),
                1 if merged.get("isFavorite") else 0,
                1 if merged.get("isNew") else 0,
                contact_id,
                user_id,
            )
        )
        return True

    def delete(self, contact_id: str, user_id: str) -> bool:
        existing = self.find_by_id_and_user_id(contact_id, user_id)
        if not existing:
            return False

        db_manager.execute("DELETE FROM contacts WHERE id = ? AND user_id = ?;", (contact_id, user_id))
        return True

contact_repository = ContactRepository()
