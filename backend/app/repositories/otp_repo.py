import sqlite3
from typing import Optional, Dict, Any
from backend.app.db.database import db_manager

class OtpRepository:
    def find_by_target(self, target: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one("SELECT * FROM otps WHERE target = ? LIMIT 1;", (target,))
        if not row:
            return None
        return {
            "id": f"otp-{row['target']}",
            "target": str(row["target"]),
            "channel": str(row["channel"]),
            "codeHash": str(row["otp_hash"]),
            "expiresAt": int(row["expires_at"]),
            "attempts": int(row["attempts"]),
            "lastSentAt": int(row["created_at"]),
        }

    def save(self, record: Dict[str, Any]) -> None:
        db_manager.execute(
            """INSERT INTO otps (target, otp_hash, channel, expires_at, attempts, created_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(target) DO UPDATE SET
                 otp_hash = excluded.otp_hash,
                 channel = excluded.channel,
                 expires_at = excluded.expires_at,
                 attempts = excluded.attempts,
                 created_at = excluded.created_at;""",
            (
                record["target"],
                record["codeHash"],
                record["channel"],
                record["expiresAt"],
                record["attempts"],
                record["lastSentAt"],
            )
        )

    def delete(self, target: str) -> None:
        db_manager.execute("DELETE FROM otps WHERE target = ?;", (target,))

otp_repository = OtpRepository()
