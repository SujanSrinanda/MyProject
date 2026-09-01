import secrets
import sqlite3
from typing import Optional, Dict, Any, List
from datetime import datetime
from backend.app.db.database import db_manager

def map_row_to_alert(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "userId": str(row["user_id"]),
        "title": str(row["title"]),
        "message": str(row["message"]),
        "severity": str(row["severity"]),
        "timestamp": str(row["timestamp"]),
        "isRead": bool(row["is_read"]),
        "actionTaken": str(row["action_taken"]) if row["action_taken"] else None,
    }

class AlertRepository:
    def find_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        rows = db_manager.fetch_all(
            "SELECT * FROM alerts WHERE user_id = ? ORDER BY timestamp DESC;",
            (user_id,)
        )
        return [map_row_to_alert(r) for r in rows]

    def find_by_id_and_user_id(self, alert_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one(
            "SELECT * FROM alerts WHERE id = ? AND user_id = ? LIMIT 1;",
            (alert_id, user_id)
        )
        return map_row_to_alert(row) if row else None

    def create(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        alert_id = alert.get("id") or f"alert_{int(datetime.utcnow().timestamp() * 1000)}_{secrets.token_hex(3)}"
        now = alert.get("timestamp", datetime.utcnow().isoformat())
        is_read = bool(alert.get("isRead", False))
        action_taken = alert.get("actionTaken")

        db_manager.execute(
            """INSERT INTO alerts (id, user_id, title, message, severity, is_read, action_taken, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?);""",
            (
                alert_id,
                alert["userId"],
                alert["title"],
                alert["message"],
                alert.get("severity", "medium"),
                1 if is_read else 0,
                action_taken,
                now,
            )
        )
        return {
            "id": alert_id,
            "userId": alert["userId"],
            "title": alert["title"],
            "message": alert["message"],
            "severity": alert.get("severity", "medium"),
            "isRead": is_read,
            "actionTaken": action_taken,
            "timestamp": now,
        }

    def update(self, alert_id: str, user_id: str, updates: Dict[str, Any]) -> bool:
        existing = self.find_by_id_and_user_id(alert_id, user_id)
        if not existing:
            return False

        merged = {**existing, **updates}
        db_manager.execute(
            """UPDATE alerts SET
                  title = ?,
                  message = ?,
                  severity = ?,
                  is_read = ?,
                  action_taken = ?
               WHERE id = ? AND user_id = ?;""",
            (
                merged["title"],
                merged["message"],
                merged["severity"],
                1 if merged.get("isRead") else 0,
                merged.get("actionTaken"),
                alert_id,
                user_id,
            )
        )
        return True

    def delete(self, alert_id: str, user_id: str) -> bool:
        existing = self.find_by_id_and_user_id(alert_id, user_id)
        if not existing:
            return False

        db_manager.execute("DELETE FROM alerts WHERE id = ? AND user_id = ?;", (alert_id, user_id))
        return True

    def clear_by_user_id(self, user_id: str) -> None:
        db_manager.execute("DELETE FROM alerts WHERE user_id = ?;", (user_id,))

alert_repository = AlertRepository()
