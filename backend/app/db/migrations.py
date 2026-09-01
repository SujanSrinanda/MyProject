import os
import json
import sqlite3
from datetime import datetime
from typing import Dict, Any
from backend.app.db.database import db_manager

def run_migrations() -> Dict[str, Any]:
    """Runs pending SQLite database migrations and ensures schema integrity."""
    conn = db_manager.get_connection()
    try:
        # Create schema_migrations table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at TEXT NOT NULL
            );
        """)

        # Check applied migrations
        cur = conn.cursor()
        cur.execute("SELECT version FROM schema_migrations ORDER BY version ASC;")
        applied = {row[0] for row in cur.fetchall()}

        if 1 not in applied:
            schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
            with open(schema_path, "r", encoding="utf-8") as f:
                raw_sql = f.read()

            clean_sql = "\n".join(
                line.split("--")[0] for line in raw_sql.splitlines() if line.strip()
            )
            statements = [s.strip() for s in clean_sql.split(";") if s.strip()]

            for stmt in statements:
                conn.execute(stmt)

            conn.execute(
                "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);",
                (1, "001_initial_schema", datetime.utcnow().isoformat())
            )
            print("[SQLite Migration] Applied 001_initial_schema successfully.")

        if 2 not in applied:
            try:
                conn.execute("ALTER TABLE users ADD COLUMN balance REAL NOT NULL DEFAULT 45000.0;")
            except Exception:
                pass
            conn.execute(
                "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);",
                (2, "002_add_user_balance", datetime.utcnow().isoformat())
            )
            print("[SQLite Migration] Applied 002_add_user_balance successfully.")

        if 3 not in applied:
            try:
                conn.execute("ALTER TABLE users ADD COLUMN pin_hash TEXT;")
            except Exception:
                pass
            try:
                conn.execute("ALTER TABLE users ADD COLUMN pin_salt TEXT;")
            except Exception:
                pass
            conn.execute(
                "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);",
                (3, "003_add_user_pin_hash", datetime.utcnow().isoformat())
            )
            print("[SQLite Migration] Applied 003_add_user_pin_hash successfully.")

        # Check if users table is empty; if so, seed from JSON or built-in demo fixtures
        cur.execute("SELECT COUNT(*) FROM users;")
        user_count = cur.fetchone()[0]

        if user_count == 0:
            json_path = os.path.abspath("data/sentinelfin_db.json")
            if os.path.exists(json_path):
                print("[Database] Empty SQLite database detected. Auto-migrating from sentinelfin_db.json...")
                seed_from_json(json_path)
            else:
                print("[Database] Empty SQLite database detected. Seeding built-in demo accounts...")
                seed_default_demo_data()
        else:
            # Ensure demo accounts exist even if DB has custom users
            ensure_demo_accounts_exist()

        print("[Database] SQLite database initialized and ready.")
        return {"status": "ok", "user_count": user_count}
    finally:
        conn.close()

def ensure_demo_accounts_exist() -> None:
    from backend.app.core.security import hash_password
    conn = db_manager.get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT email FROM users WHERE LOWER(email) IN ('demo@sentinelfin.com', 'suj@gmail.com');")
        existing_emails = {row[0].lower() for row in cur.fetchall()}
        
        now_iso = datetime.utcnow().isoformat()
        
        if "demo@sentinelfin.com" not in existing_emails:
            pw_hash, pw_salt = hash_password("password123")
            pin_hash, pin_salt = hash_password("3376")
            conn.execute(
                """INSERT OR IGNORE INTO users (id, full_name, email, phone, password_hash, password_salt, pin_hash, pin_salt, email_verified, phone_verified, onboarding_completed, city, created_at, last_login)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                ("usr-demo-01", "Demo Sentinel User", "demo@sentinelfin.com", "+919876543210", pw_hash, pw_salt, pin_hash, pin_salt, 1, 1, 1, "Bangalore, India", now_iso, now_iso)
            )
            conn.execute(
                """INSERT OR IGNORE INTO financial_profiles (user_id, income_range, spending_target, savings_goal, currency, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?);""",
                ("usr-demo-01", "₹50,000–₹1,00,000", 35000.0, 15000.0, "INR ₹", now_iso)
            )
            conn.execute(
                """INSERT OR IGNORE INTO security_profiles (user_id, security_alerts_enabled, new_device_alerts, transaction_alerts, protection_level, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?);""",
                ("usr-demo-01", 1, 1, 1, "High Protection", now_iso)
            )
            conn.execute(
                """INSERT OR IGNORE INTO budgets (user_id, monthly_limit, updated_at)
                   VALUES (?, ?, ?);""",
                ("usr-demo-01", 45000.0, now_iso)
            )

        if "suj@gmail.com" not in existing_emails:
            pw_hash, pw_salt = hash_password("password123")
            pin_hash, pin_salt = hash_password("3376")
            conn.execute(
                """INSERT OR IGNORE INTO users (id, full_name, email, phone, password_hash, password_salt, pin_hash, pin_salt, email_verified, phone_verified, onboarding_completed, city, created_at, last_login)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                ("usr-suj-02", "Sujith Sentinel", "suj@gmail.com", "+919113093314", pw_hash, pw_salt, pin_hash, pin_salt, 1, 1, 1, "Bengaluru, India", now_iso, now_iso)
            )
            conn.execute(
                """INSERT OR IGNORE INTO financial_profiles (user_id, income_range, spending_target, savings_goal, currency, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?);""",
                ("usr-suj-02", "₹1,00,000–₹2,00,000", 50000.0, 25000.0, "INR ₹", now_iso)
            )
            conn.execute(
                """INSERT OR IGNORE INTO security_profiles (user_id, security_alerts_enabled, new_device_alerts, transaction_alerts, protection_level, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?);""",
                ("usr-suj-02", 1, 1, 1, "High Protection", now_iso)
            )
            conn.execute(
                """INSERT OR IGNORE INTO budgets (user_id, monthly_limit, updated_at)
                   VALUES (?, ?, ?);""",
                ("usr-suj-02", 60000.0, now_iso)
            )

        # Ensure demo accounts have PIN initialized if missing
        cur.execute("SELECT id, pin_hash FROM users WHERE LOWER(email) IN ('demo@sentinelfin.com', 'suj@gmail.com');")
        for row in cur.fetchall():
            if not row["pin_hash"]:
                p_hash, p_salt = hash_password("3376")
                conn.execute("UPDATE users SET pin_hash = ?, pin_salt = ? WHERE id = ?;", (p_hash, p_salt, row["id"]))
    finally:
        conn.close()

def seed_default_demo_data() -> None:
    ensure_demo_accounts_exist()

def seed_from_json(json_path: str) -> None:
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    with db_manager.transaction() as conn:
        # 1. Users
        for u in data.get("users", []):
            conn.execute(
                """INSERT INTO users (id, full_name, email, phone, password_hash, password_salt, email_verified, phone_verified, onboarding_completed, city, profile_photo, created_at, last_login)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                (
                    u.get("id"),
                    u.get("fullName", ""),
                    u.get("email", "").lower(),
                    u.get("phone", ""),
                    u.get("passwordHash", ""),
                    u.get("passwordSalt", ""),
                    1 if u.get("emailVerified") else 0,
                    1 if u.get("phoneVerified") else 0,
                    1 if u.get("onboardingCompleted") else 0,
                    u.get("city"),
                    u.get("profilePhoto"),
                    u.get("createdAt", datetime.utcnow().isoformat()),
                    u.get("lastLogin", datetime.utcnow().isoformat()),
                )
            )

        # 2. Financial Profiles
        for fp in data.get("financialProfiles", []):
            conn.execute(
                """INSERT INTO financial_profiles (user_id, income_range, spending_target, savings_goal, currency, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?);""",
                (
                    fp.get("userId"),
                    fp.get("incomeRange", "₹50,000–₹1,00,000"),
                    float(fp.get("spendingTarget", 30000)),
                    float(fp.get("savingsGoal", 10000)),
                    fp.get("currency", "INR ₹"),
                    datetime.utcnow().isoformat(),
                )
            )

        # 3. Security Profiles
        for sp in data.get("securityProfiles", []):
            conn.execute(
                """INSERT INTO security_profiles (user_id, security_alerts_enabled, new_device_alerts, transaction_alerts, protection_level, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?);""",
                (
                    sp.get("userId"),
                    1 if sp.get("securityAlertsEnabled", True) else 0,
                    1 if sp.get("newDeviceAlerts", True) else 0,
                    1 if sp.get("transactionAlerts", True) else 0,
                    sp.get("protectionLevel", "High Protection"),
                    datetime.utcnow().isoformat(),
                )
            )

        # 4. Budgets & Categories
        for b in data.get("budgets", []):
            user_id = b.get("userId")
            conn.execute(
                """INSERT INTO budgets (user_id, monthly_limit, updated_at)
                   VALUES (?, ?, ?);""",
                (user_id, float(b.get("monthlyLimit", 45000)), datetime.utcnow().isoformat())
            )
            for cat in b.get("categories", []):
                conn.execute(
                    """INSERT INTO budget_categories (id, user_id, category, limit_amount, created_at)
                       VALUES (?, ?, ?, ?, ?);""",
                    (
                        cat.get("id", f"cat-{user_id}-{cat.get('category')}"),
                        user_id,
                        cat.get("category"),
                        float(cat.get("limit", 5000)),
                        datetime.utcnow().isoformat()
                    )
                )

        # 5. Sessions
        for s in data.get("sessions", []):
            exp = s.get("expiresAt")
            if isinstance(exp, (int, float)):
                exp_str = datetime.utcfromtimestamp(exp / 1000.0 if exp > 1e11 else exp).isoformat()
            else:
                exp_str = str(exp)
            conn.execute(
                """INSERT INTO sessions (token, user_id, created_at, expires_at, last_active)
                   VALUES (?, ?, ?, ?, ?);""",
                (
                    s.get("token"),
                    s.get("userId"),
                    s.get("createdAt", datetime.utcnow().isoformat()),
                    exp_str,
                    s.get("createdAt", datetime.utcnow().isoformat()),
                )
            )

        # 6. OTPs
        for o in data.get("otps", []):
            conn.execute(
                """INSERT INTO otps (target, otp_hash, channel, expires_at, attempts, created_at)
                   VALUES (?, ?, ?, ?, ?, ?);""",
                (
                    o.get("target"),
                    o.get("codeHash") or o.get("otpHash", ""),
                    o.get("channel", "phone"),
                    int(o.get("expiresAt", int(datetime.utcnow().timestamp() * 1000) + 300000)),
                    int(o.get("attempts", 0)),
                    int(o.get("lastSentAt") or o.get("createdAt") or int(datetime.utcnow().timestamp() * 1000)),
                )
            )

        # 7. Transactions
        for t in data.get("transactions", []):
            conn.execute(
                """INSERT INTO transactions (id, user_id, recipient_name, recipient_phone, amount, note, category, type, status, decision, safety_score, risk_level, reasons_json, technical_details_json, is_new_recipient, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                (
                    t.get("id"),
                    t.get("userId"),
                    t.get("recipientName", "Recipient"),
                    t.get("recipientPhone"),
                    float(t.get("amount", 0)),
                    t.get("note"),
                    t.get("category", "Other"),
                    t.get("type", "PHONE"),
                    t.get("status", "COMPLETED"),
                    t.get("decision", "ALLOW"),
                    int(t.get("safetyScore", 90)),
                    t.get("riskLevel", "LOW"),
                    json.dumps(t.get("reasons", [])) if t.get("reasons") else None,
                    json.dumps(t.get("technicalDetails")) if t.get("technicalDetails") else None,
                    1 if t.get("isNewRecipient") else 0,
                    t.get("timestamp", datetime.utcnow().isoformat()),
                )
            )

        # 8. Contacts
        for c in data.get("contacts", []):
            conn.execute(
                """INSERT INTO contacts (id, user_id, name, phone, email, is_favorite, is_new, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?);""",
                (
                    c.get("id"),
                    c.get("userId"),
                    c.get("name"),
                    c.get("phone"),
                    c.get("email"),
                    1 if c.get("isFavorite") else 0,
                    1 if c.get("isNew", True) else 0,
                    c.get("createdAt", datetime.utcnow().isoformat()),
                )
            )

        # 9. Alerts
        for a in data.get("alerts", []):
            conn.execute(
                """INSERT INTO alerts (id, user_id, title, message, severity, is_read, action_taken, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?);""",
                (
                    a.get("id"),
                    a.get("userId"),
                    a.get("title"),
                    a.get("message"),
                    a.get("severity", "medium"),
                    1 if a.get("isRead") else 0,
                    a.get("actionTaken"),
                    a.get("timestamp", datetime.utcnow().isoformat()),
                )
            )

        # 10. Devices
        for d in data.get("devices", []):
            conn.execute(
                """INSERT INTO devices (id, user_id, name, browser, is_current, is_trusted, last_active, location, fingerprint)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                (
                    d.get("id"),
                    d.get("userId"),
                    d.get("name"),
                    d.get("browser"),
                    1 if d.get("isCurrent") else 0,
                    1 if d.get("isTrusted", True) else 0,
                    d.get("lastActive", datetime.utcnow().isoformat()),
                    d.get("location"),
                    d.get("fingerprint"),
                )
            )
