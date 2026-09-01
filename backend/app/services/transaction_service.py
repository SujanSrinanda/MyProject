import re
import json
import time
from typing import Dict, Any, Tuple, List, Optional
from datetime import datetime

from backend.app.repositories.transaction_repo import transaction_repository, TransactionRepository
from backend.app.repositories.user_repo import user_repository, UserRepository
from backend.app.repositories.alert_repo import alert_repository
from backend.app.db.database import db_manager
from backend.app.providers.gemini_provider import gemini_provider
from backend.app.providers.neo4j_client import neo4j_client
from backend.app.ml.risk_engine import ml_risk_engine

class TransactionService:
    def __init__(
        self,
        tx_repo: TransactionRepository = transaction_repository,
        user_repo: UserRepository = user_repository
    ):
        self.tx_repo = tx_repo
        self.user_repo = user_repo

    async def get_transactions(self, user_id: str) -> Tuple[int, List[Dict[str, Any]]]:
        txs = self.tx_repo.find_by_user_id(user_id)
        return 200, txs

    async def evaluate_transaction(self, payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        recipient_name = payload.get("recipientName", "")
        recipient_phone = payload.get("recipientPhone")
        amount_val = payload.get("amount")
        payment_type = payload.get("paymentType") or payload.get("type") or "UPI"
        note = payload.get("note")
        is_new_recipient = bool(payload.get("isNewRecipient", False))

        if not recipient_name or amount_val is None:
            return 400, {"error": "Missing payment amount or recipient details."}

        try:
            amount = float(amount_val)
        except (ValueError, TypeError):
            return 400, {"error": "Invalid transaction amount."}

        is_suspicious_keyword = bool(re.search(r'unknown|scam|crypto|lottery|unverified|urgent|hacker', recipient_name, re.IGNORECASE))
        now_hour = datetime.utcnow().hour

        # 1. Scikit-Learn ML Risk Engine evaluation
        ml_res = ml_risk_engine.predict(
            amount=amount,
            is_new_recipient=is_new_recipient,
            hour_of_day=now_hour,
            is_suspicious_keyword=is_suspicious_keyword,
            user_avg_amount=2500.0,
            graph_risk_score=0.82 if is_suspicious_keyword else 0.05
        )

        # 2. Hard Security Guardrail Rules override if critical
        if amount >= 50000 or (amount >= 20000 and is_new_recipient) or is_suspicious_keyword:
            ml_res["decision"] = "BLOCK"
            ml_res["riskLevel"] = "CRITICAL"
            ml_res["safetyScore"] = max(12, int(35 - amount / 2000))
            ml_res["userMessage"] = "SentinelFin stopped this payment to protect your money."

        # 3. Gemini AI Explanation enhancement if configured
        try:
            ai_res = await gemini_provider.evaluate_transaction(
                recipient_name=recipient_name,
                amount=amount,
                recipient_phone=recipient_phone,
                payment_type=payment_type,
                note=note,
                is_new_recipient=is_new_recipient,
            )
            if ai_res and ai_res.get("humanReasons"):
                ml_res["humanReasons"] = ai_res["humanReasons"]
                if ai_res.get("userMessage"):
                    ml_res["userMessage"] = ai_res["userMessage"]
        except Exception:
            pass

        return 200, ml_res

    async def create_transaction(self, user: Dict[str, Any], tx_data: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        user_id = user["id"]

        try:
            amount = float(tx_data.get("amount", 0))
        except (ValueError, TypeError):
            return 400, {"error": "Invalid transaction amount."}

        if amount <= 0:
            return 400, {"error": "Transaction amount must be greater than zero."}

        recipient_name = tx_data.get("recipientName", "").strip()
        if not recipient_name:
            return 400, {"error": "Recipient name or identifier is required."}

        recipient_phone = str(tx_data.get("recipientPhone", "")).strip() or None
        is_new_recipient = bool(tx_data.get("isNewRecipient", False))
        payment_type = tx_data.get("type") or "PHONE"
        category = tx_data.get("category") or "Other"
        note = str(tx_data.get("note", "")).strip() or None

        # Check sender balance early
        sender = self.user_repo.find_by_id(user_id)
        if not sender:
            return 404, {"error": "Sender user not found."}
        if float(sender.get("balance", 0.0)) < amount:
            return 400, {"error": f"Insufficient balance. (Available: ₹{float(sender.get('balance', 0.0)):,.2f}, Requested: ₹{amount:,.2f})"}

        # 1. Evaluate risk server-side - FAIL CLOSED IF EVALUATION FAILS
        try:
            eval_status, eval_res = await self.evaluate_transaction({
                "recipientName": recipient_name,
                "recipientPhone": recipient_phone,
                "amount": amount,
                "paymentType": payment_type,
                "note": note,
                "isNewRecipient": is_new_recipient,
            })
        except Exception as eval_err:
            return 503, {"error": f"Risk engine evaluation failure: {str(eval_err)}. Transaction rejected for your protection."}

        if eval_status != 200 or not eval_res:
            return 503, {"error": "Security risk evaluation unavailable. Transaction rejected safely."}

        decision = eval_res.get("decision")
        if decision not in ("ALLOW", "CHALLENGE", "BLOCK"):
            return 503, {"error": "Indeterminate risk decision from security engine. Transaction rejected."}

        safety_score = int(eval_res.get("safetyScore", 0))
        risk_level = str(eval_res.get("riskLevel", "CRITICAL"))
        reasons = eval_res.get("humanReasons", [])
        technical_details = eval_res.get("technicalDetails")

        now_iso = datetime.utcnow().isoformat()
        tx_id = f"tx-{int(time.time() * 1000)}"

        # If transaction is BLOCKED by risk engine:
        if decision == "BLOCK":
            # Record security alert for the blocked transaction attempt
            alert_repository.create({
                "id": f"alt-{int(time.time() * 1000)}",
                "userId": user_id,
                "title": "High-Risk Transfer Blocked",
                "message": f"SentinelFin blocked a transfer of ₹{int(amount):,} to {recipient_name} due to critical risk indicators.",
                "severity": "critical",
                "isRead": False,
                "actionTaken": "Blocked by Zero-Trust ML Risk Engine",
                "timestamp": now_iso
            })

            # Record blocked transaction history entry without modifying any balances
            blocked_tx = {
                "id": tx_id,
                "userId": user_id,
                "recipientName": recipient_name,
                "recipientPhone": recipient_phone,
                "amount": amount,
                "note": note,
                "category": category,
                "type": payment_type,
                "status": "BLOCKED",
                "decision": "BLOCK",
                "safetyScore": safety_score,
                "riskLevel": risk_level,
                "reasons": reasons,
                "technicalDetails": technical_details,
                "timestamp": now_iso,
                "isNewRecipient": is_new_recipient,
            }
            self.tx_repo.create(blocked_tx)
            return 403, {
                "error": "Payment blocked by Zero-Trust Risk Engine due to critical risk indicators.",
                "decision": "BLOCK",
                "transaction": blocked_tx,
                "evaluation": eval_res
            }

        status_str = "CHALLENGED" if decision == "CHALLENGE" else "COMPLETED"

        # 2. ATOMIC SQLite Database Transfer (BEGIN -> VERIFY -> DEDUCT -> CREDIT -> RECORD -> COMMIT / ROLLBACK)
        try:
            with db_manager.transaction() as conn:
                cur = conn.cursor()

                # Step A: Lock & verify sender row and balance
                cur.execute("SELECT id, full_name, email, phone, balance FROM users WHERE id = ?;", (user_id,))
                sender_row = cur.fetchone()
                if not sender_row:
                    raise ValueError("Sender user account not found.")

                sender_balance = float(sender_row["balance"])
                if sender_balance < amount:
                    raise ValueError(f"Insufficient account balance (Available: ₹{sender_balance:,.2f}, Requested: ₹{amount:,.2f}).")

                # Step B: Deduct sender balance atomically
                new_sender_bal = sender_balance - amount
                cur.execute("UPDATE users SET balance = ? WHERE id = ?;", (new_sender_bal, user_id))

                # Step C: Insert sender transaction record
                reasons_json = json.dumps(reasons) if reasons else None
                tech_json = json.dumps(technical_details) if technical_details else None
                cur.execute(
                    """INSERT INTO transactions (id, user_id, recipient_name, recipient_phone, amount, note, category, type, status, decision, safety_score, risk_level, reasons_json, technical_details_json, is_new_recipient, timestamp)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                    (
                        tx_id,
                        user_id,
                        recipient_name,
                        recipient_phone,
                        amount,
                        note,
                        category,
                        payment_type,
                        status_str,
                        decision,
                        safety_score,
                        risk_level,
                        reasons_json,
                        tech_json,
                        1 if is_new_recipient else 0,
                        now_iso
                    )
                )

                # Step D: Locate registered recipient if exists
                recipient_user_row = None
                recipient_user_id = tx_data.get("recipientUserId") or tx_data.get("recipientId")

                if recipient_user_id:
                    cur.execute("SELECT id, full_name, email, phone, balance FROM users WHERE id = ? LIMIT 1;", (recipient_user_id,))
                    recipient_user_row = cur.fetchone()

                if not recipient_user_row and recipient_phone:
                    clean_phone = recipient_phone.strip()
                    cur.execute(
                        "SELECT id, full_name, email, phone, balance FROM users WHERE phone = ? OR phone LIKE ? LIMIT 1;",
                        (clean_phone, f"%{clean_phone[-10:]}%" if len(clean_phone) >= 10 else clean_phone)
                    )
                    recipient_user_row = cur.fetchone()

                if not recipient_user_row and "@" in recipient_name:
                    cur.execute("SELECT id, full_name, email, phone, balance FROM users WHERE email = ? LIMIT 1;", (recipient_name.lower().strip(),))
                    recipient_user_row = cur.fetchone()

                # Prevent transferring to oneself
                if recipient_user_row and recipient_user_row["id"] == user_id:
                    raise ValueError("Cannot transfer funds to your own account.")

                # Step E: Credit recipient if registered user
                if recipient_user_row and recipient_user_row["id"] != user_id:
                    rec_id = recipient_user_row["id"]
                    rec_balance = float(recipient_user_row["balance"])
                    new_rec_bal = rec_balance + amount
                    cur.execute("UPDATE users SET balance = ? WHERE id = ?;", (new_rec_bal, rec_id))

                    rec_tx_id = f"tx-rec-{int(time.time() * 1000)}"
                    cur.execute(
                        """INSERT INTO transactions (id, user_id, recipient_name, recipient_phone, amount, note, category, type, status, decision, safety_score, risk_level, reasons_json, technical_details_json, is_new_recipient, timestamp)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                        (
                            rec_tx_id,
                            rec_id,
                            sender_row["full_name"] or "Sender",
                            sender_row["phone"],
                            amount,
                            f"Received from {sender_row['full_name'] or 'Sender'}",
                            "Income",
                            payment_type,
                            "COMPLETED",
                            "ALLOW",
                            99,
                            "LOW",
                            json.dumps(["Incoming transfer received"]),
                            None,
                            0,
                            now_iso
                        )
                    )
        except ValueError as ve:
            return 400, {"error": str(ve)}
        except Exception as db_err:
            return 500, {"error": f"Database transaction failed: {str(db_err)}. All changes were rolled back."}

        new_tx = {
            "id": tx_id,
            "userId": user_id,
            "recipientName": recipient_name,
            "recipientPhone": recipient_phone,
            "amount": amount,
            "note": note,
            "category": category,
            "type": payment_type,
            "status": status_str,
            "decision": decision,
            "safetyScore": safety_score,
            "riskLevel": risk_level,
            "reasons": reasons,
            "technicalDetails": technical_details,
            "timestamp": now_iso,
            "isNewRecipient": is_new_recipient,
            "senderNewBalance": new_sender_bal,
        }

        # 3. Sync to Neo4j Graph Database asynchronously if configured
        try:
            neo4j_client.store_transaction({
                "id": new_tx["id"],
                "userId": new_tx["userId"],
                "senderName": user.get("fullName") or f"User {user_id}",
                "senderPhone": user.get("phone") or f"phone-{user_id}",
                "recipientName": new_tx["recipientName"],
                "recipientPhone": new_tx["recipientPhone"] or "",
                "amount": new_tx["amount"],
                "note": new_tx["note"] or "",
                "category": new_tx["category"],
                "type": new_tx["type"],
                "status": new_tx["status"],
                "decision": new_tx["decision"],
                "safetyScore": new_tx["safetyScore"],
                "riskLevel": new_tx["riskLevel"],
                "reasons": new_tx["reasons"],
                "timestamp": new_tx["timestamp"],
            })
        except Exception:
            pass

        return 201, new_tx

    async def delete_transaction(self, tx_id: str, user_id: str) -> Tuple[int, Dict[str, Any]]:
        success = self.tx_repo.delete(tx_id, user_id)
        if not success:
            return 404, {"error": "Transaction not found or unauthorized."}
        return 200, {"success": True, "message": "Transaction removed from record."}

transaction_service = TransactionService()
