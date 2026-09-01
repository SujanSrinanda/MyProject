import sqlite3
from typing import Optional, Dict, Any, List
from datetime import datetime
from backend.app.db.database import db_manager

def map_row_to_device(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "userId": str(row["user_id"]),
        "name": str(row["name"]),
        "browser": str(row["browser"]),
        "isCurrent": bool(row["is_current"]),
        "isTrusted": bool(row["is_trusted"]),
        "lastActive": str(row["last_active"]),
        "location": str(row["location"]) if row["location"] else None,
        "fingerprint": str(row["fingerprint"]) if row["fingerprint"] else None,
    }

class DeviceRepository:
    def find_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        rows = db_manager.fetch_all(
            "SELECT * FROM devices WHERE user_id = ? ORDER BY last_active DESC;",
            (user_id,)
        )
        return [map_row_to_device(r) for r in rows]

    def find_by_id_and_user_id(self, device_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one(
            "SELECT * FROM devices WHERE id = ? AND user_id = ? LIMIT 1;",
            (device_id, user_id)
        )
        return map_row_to_device(row) if row else None

    def find_by_id(self, device_id: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one("SELECT * FROM devices WHERE id = ? LIMIT 1;", (device_id,))
        return map_row_to_device(row) if row else None

    def create(self, device: Dict[str, Any]) -> Dict[str, Any]:
        now = device.get("lastActive", datetime.utcnow().isoformat())
        db_manager.execute(
            """INSERT INTO devices (id, user_id, name, browser, is_current, is_trusted, last_active, location, fingerprint)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);""",
            (
                device["id"],
                device["userId"],
                device["name"],
                device["browser"],
                1 if device.get("isCurrent") else 0,
                1 if device.get("isTrusted", True) else 0,
                now,
                device.get("location"),
                device.get("fingerprint"),
            )
        )
        return device

    def update(self, device_id: str, updates: Dict[str, Any]) -> None:
        existing = self.find_by_id(device_id)
        if not existing:
            return

        merged = {**existing, **updates}
        db_manager.execute(
            """UPDATE devices SET
                  name = ?,
                  browser = ?,
                  is_current = ?,
                  is_trusted = ?,
                  last_active = ?,
                  location = ?,
                  fingerprint = ?
               WHERE id = ?;""",
            (
                merged["name"],
                merged["browser"],
                1 if merged.get("isCurrent") else 0,
                1 if merged.get("isTrusted") else 0,
                merged.get("lastActive", datetime.utcnow().isoformat()),
                merged.get("location"),
                merged.get("fingerprint"),
                device_id,
            )
        )

    def delete(self, device_id: str, user_id: Optional[str] = None) -> bool:
        if user_id:
            existing = self.find_by_id_and_user_id(device_id, user_id)
            if not existing:
                return False
            db_manager.execute("DELETE FROM devices WHERE id = ? AND user_id = ?;", (device_id, user_id))
            return True

        db_manager.execute("DELETE FROM devices WHERE id = ?;", (device_id,))
        return True

    def clear_by_user_id(self, user_id: str) -> None:
        db_manager.execute("DELETE FROM devices WHERE user_id = ?;", (user_id,))

device_repository = DeviceRepository()
