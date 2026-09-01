import json
import sqlite3
from typing import Optional, Dict, Any, List
from datetime import datetime
from backend.app.db.database import db_manager

def map_row_to_transaction(row: sqlite3.Row) -> Dict[str, Any]:
    reasons = []
    if row["reasons_json"]:
        try:
            reasons = json.loads(row["reasons_json"]) if isinstance(row["reasons_json"], str) else row["reasons_json"]
        except Exception:
            reasons = []

    tech_details = None
    if row["technical_details_json"]:
        try:
            tech_details = json.loads(row["technical_details_json"]) if isinstance(row["technical_details_json"], str) else row["technical_details_json"]
        except Exception:
            tech_details = None

    return {
        "id": str(row["id"]),
        "userId": str(row["user_id"]),
        "recipientName": str(row["recipient_name"]),
        "recipientPhone": str(row["recipient_phone"]) if row["recipient_phone"] else None,
        "amount": float(row["amount"]),
        "note": str(row["note"]) if row["note"] else None,
        "category": str(row["category"]),
        "type": str(row["type"]),
        "status": str(row["status"]),
        "decision": str(row["decision"]),
        "safetyScore": int(row["safety_score"]),
        "riskLevel": str(row["risk_level"]),
        "reasons": reasons,
        "technicalDetails": tech_details,
        "timestamp": str(row["timestamp"]),
        "isNewRecipient": bool(row["is_new_recipient"]) if row["is_new_recipient"] is not None else None,
    }

class TransactionRepository:
    def find_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        rows = db_manager.fetch_all(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC;",
            (user_id,)
        )
        return [map_row_to_transaction(r) for r in rows]

    def find_by_id_and_user_id(self, tx_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one(
            "SELECT * FROM transactions WHERE id = ? AND user_id = ? LIMIT 1;",
            (tx_id, user_id)
        )
        return map_row_to_transaction(row) if row else None

    def find_by_id(self, tx_id: str) -> Optional[Dict[str, Any]]:
        row = db_manager.fetch_one("SELECT * FROM transactions WHERE id = ? LIMIT 1;", (tx_id,))
        return map_row_to_transaction(row) if row else None

    def create(self, tx: Dict[str, Any]) -> Dict[str, Any]:
        now = tx.get("timestamp", datetime.utcnow().isoformat())
        reasons_json = json.dumps(tx["reasons"]) if tx.get("reasons") is not None else None
        tech_json = json.dumps(tx["technicalDetails"]) if tx.get("technicalDetails") is not None else None

        db_manager.execute(
            """INSERT INTO transactions (id, user_id, recipient_name, recipient_phone, amount, note, category, type, status, decision, safety_score, risk_level, reasons_json, technical_details_json, is_new_recipient, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
            (
                tx["id"],
                tx["userId"],
                tx["recipientName"],
                tx.get("recipientPhone"),
                float(tx["amount"]),
                tx.get("note"),
                tx.get("category", "Other"),
                tx.get("type", "PHONE"),
                tx["status"],
                tx["decision"],
                int(tx["safetyScore"]),
                tx["riskLevel"],
                reasons_json,
                tech_json,
                1 if tx.get("isNewRecipient") else 0,
                now,
            )
        )
        return tx

    def delete(self, tx_id: str, user_id: str) -> bool:
        existing = self.find_by_id_and_user_id(tx_id, user_id)
        if not existing:
            return False
        db_manager.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?;", (tx_id, user_id))
        return True

transaction_repository = TransactionRepository()
