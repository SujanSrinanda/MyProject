import sqlite3
from typing import Optional, Dict, Any
from datetime import datetime
from backend.app.db.database import db_manager

class SessionRepository:
    def find_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one("SELECT * FROM sessions WHERE token = ? LIMIT 1;", (token,))
        if not row:
            return None
        expires_at_val = row["expires_at"]
        try:
            exp_ms = int(expires_at_val)
        except (ValueError, TypeError):
            try:
                exp_ms = int(datetime.fromisoformat(str(expires_at_val)).timestamp() * 1000)
            except Exception:
                exp_ms = 0

        return {
            "token": str(row["token"]),
            "userId": str(row["user_id"]),
            "createdAt": str(row["created_at"]),
            "expiresAt": exp_ms,
        }

    def create(self, session: Dict[str, Any]) -> None:
        exp = session["expiresAt"]
        if isinstance(exp, (int, float)):
            exp_str = datetime.utcfromtimestamp(exp / 1000.0 if exp > 1e11 else exp).isoformat()
        else:
            exp_str = str(exp)

        now = session.get("createdAt", datetime.utcnow().isoformat())
        db_manager.execute(
            """INSERT INTO sessions (token, user_id, created_at, expires_at, last_active)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(token) DO UPDATE SET
                 expires_at = excluded.expires_at,
                 last_active = excluded.last_active;""",
            (session["token"], session["userId"], now, exp_str, now)
        )

    def delete(self, token: str) -> None:
        db_manager.execute("DELETE FROM sessions WHERE token = ?;", (token,))

    def delete_by_user_id(self, user_id: str) -> None:
        db_manager.execute("DELETE FROM sessions WHERE user_id = ?;", (user_id,))

    def delete_expired(self) -> None:
        now_iso = datetime.utcnow().isoformat()
        db_manager.execute("DELETE FROM sessions WHERE expires_at < ?;", (now_iso,))

session_repository = SessionRepository()
