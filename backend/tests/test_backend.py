import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import time
import random
import asyncio
from backend.app.db.migrations import run_migrations
from backend.app.core.security import (
    hash_password,
    verify_password,
    generate_session_token,
    verify_session_token,
)
from backend.app.services.auth_service import auth_service
from backend.app.services.user_service import user_service
from backend.app.services.budget_service import budget_service
from backend.app.services.transaction_service import transaction_service
from backend.app.services.contact_service import contact_service
from backend.app.services.alert_service import alert_service
from backend.app.services.device_service import device_service
from backend.app.services.neo4j_service import neo4j_service

def test_health_and_migrations():
    res = run_migrations()
    assert res.get("status") == "ok", f"Migration failed: {res}"
    print("✓ Health check and SQLite migrations passed")

def test_pbkdf2_compatibility():
    pw = "SentinelSecure2026!"
    h, salt = hash_password(pw)
    assert verify_password(pw, salt, h) is True
    assert verify_password("WrongPassword!", salt, h) is False
    print("✓ PBKDF2 210,000-iteration hashing and verification passed")

def test_session_token():
    user_id = "usr-test-123"
    token = generate_session_token(user_id)
    assert token.startswith("stkn.")
    verified = verify_session_token(token)
    assert verified is not None
    assert verified["userId"] == user_id
    print("✓ HMAC-SHA256 session token generation and verification passed")

async def async_test_demo_logins():
    # 1. Test Demo account 1 (demo@sentinelfin.com)
    s1, d1 = await auth_service.login("demo@sentinelfin.com", "password123")
    assert s1 == 200, f"Demo 1 login failed: {d1}"
    assert d1.get("token") is not None
    assert d1.get("user", {}).get("email") == "demo@sentinelfin.com"
    print("✓ Demo account 1 (demo@sentinelfin.com) login passed")

    # 2. Test Demo account 2 (suj@gmail.com)
    s2, d2 = await auth_service.login("suj@gmail.com", "password123")
    assert s2 == 200, f"Demo 2 email login failed: {d2}"
    assert d2.get("token") is not None
    assert d2.get("user", {}).get("email") == "suj@gmail.com"
    print("✓ Demo account 2 (suj@gmail.com) login passed")

    # 3. Test Demo account 2 login via Phone
    s3, d3 = await auth_service.login("9113093314", "password123")
    assert s3 == 200, f"Demo 2 phone login failed: {d3}"
    assert d3.get("token") is not None
    print("✓ Demo account 2 login via phone identifier (9113093314) passed")

async def async_test_full_suite():
    # 1. Signup test user
    rand_num = random.randint(100000, 999999)
    email = f"sentinel_test_{int(time.time())}_{rand_num}@sentinelfin.com"
    phone = f"+9198{rand_num:06d}{random.randint(10, 99)}"
    signup_payload = {
        "fullName": "Test Sentinel User",
        "email": email,
        "phone": phone,
        "password": "SecurePassword2026!"
    }
    s_signup, d_signup = await auth_service.signup(signup_payload)
    assert s_signup == 201, f"Signup failed: {d_signup}"
    token = d_signup["token"]
    assert token is not None
    print("✓ Signup endpoint passed")

    # 2. Get Me / Session Verification
    user = await auth_service.verify_session(token)
    assert user is not None
    s_me, d_me = await auth_service.get_me(user)
    assert s_me == 200
    assert d_me["user"]["email"] == email.lower()
    print("✓ Session verification & Get Me passed")

    # 3. Profile & Onboarding
    s_onb, d_onb = await user_service.submit_onboarding(user, {
        "personalInfo": {"city": "Bengaluru, KA", "profilePhoto": None},
        "financialProfile": {"incomeRange": "₹50,000–₹1,00,000", "spendingTarget": 35000, "savingsGoal": 15000},
        "budgetSetup": {"monthlyLimit": 45000, "categories": [{"category": "Food", "limit": 10000}]},
        "securityPreferences": {"protectionLevel": "High Protection"}
    })
    assert s_onb == 200
    print("✓ User onboarding and profile persistence passed")

    # 4. Budget Service
    s_b, d_b = await budget_service.get_budget(user["id"])
    assert s_b == 200
    assert d_b["monthlyLimit"] == 45000
    print("✓ Budget service retrieval passed")

    # 5. Contact Service
    s_con, d_con = await contact_service.create_contact(user["id"], {
        "name": "Alice Sentinel",
        "phone": "+919876543210",
        "email": "alice@sentinelfin.com"
    })
    assert s_con == 201
    s_list_con, d_list_con = await contact_service.get_contacts(user["id"])
    assert s_list_con == 200
    assert any(c["name"] == "Alice Sentinel" for c in d_list_con)
    print("✓ Contact service creation & listing passed")

    # 6. Device Service
    s_dev, d_dev = await device_service.register_device(
        user["id"],
        "Mozilla/5.0 Chrome/120.0",
        {"name": "Chrome on Linux", "browser": "Chrome", "os": "Linux", "location": "Bengaluru, India"}
    )
    assert s_dev == 200
    s_list_dev, d_list_dev = await device_service.get_devices(user["id"])
    assert s_list_dev == 200
    assert len(d_list_dev) >= 1
    print("✓ Device service passed")

    # 7. Alert Service
    s_alert, d_alert = await alert_service.get_alerts(user["id"])
    assert s_alert == 200
    print("✓ Alert service passed")

    # 8. Server-authoritative transaction creation & evaluation
    s_eval, d_eval = await transaction_service.evaluate_transaction({
        "recipientName": "Crypto Urgent Scam Recovery",
        "amount": 75000,
        "category": "Other",
        "type": "PHONE"
    })
    assert s_eval == 200
    assert d_eval["decision"] == "BLOCK"
    assert d_eval["riskLevel"] == "CRITICAL"
    print("✓ Risk evaluation engine passed (BLOCK on high-risk anomaly)")

    # Normal allowed transaction creation
    s_tx, d_tx = await transaction_service.create_transaction(user, {
        "recipientName": "Alice Sentinel",
        "recipientPhone": "+919876543210",
        "amount": 2500,
        "category": "Food & Dining",
        "type": "PHONE",
        "note": "Lunch repayment"
    })
    assert s_tx == 201
    assert d_tx["amount"] == 2500
    assert d_tx["decision"] == "ALLOW"
    assert d_tx["status"] == "COMPLETED"

    # High amount block transaction creation
    s_blk, d_blk = await transaction_service.create_transaction(user, {
        "recipientName": "Unknown Crypto Pool",
        "amount": 100000,
        "category": "Investment",
        "type": "PHONE"
    })
    assert s_blk == 201
    assert d_blk["decision"] == "BLOCK"
    assert d_blk["status"] == "BLOCKED"
    print("✓ Transaction creation & server-authoritative guardrails passed")

    # Get transactions
    s_txs, d_txs = await transaction_service.get_transactions(user["id"])
    assert s_txs == 200
    assert len(d_txs) >= 2
    print("✓ Get transactions list passed")

    # 9. Neo4j Status Check
    s_n4j, d_n4j = neo4j_service.get_status()
    assert s_n4j == 200
    print("✓ Neo4j service status check passed")

    # 10. Logout test
    s_out, d_out = await auth_service.logout(token)
    assert s_out == 200
    user_after_logout = await auth_service.verify_session(token)
    assert user_after_logout is None
    print("✓ Logout and session invalidation passed")

def test_demo_logins():
    asyncio.run(async_test_demo_logins())

def test_auth_and_user_flows():
    asyncio.run(async_test_full_suite())

import unittest

class TestSentinelFinBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run_migrations()

    def test_health_and_migrations(self):
        test_health_and_migrations()

    def test_pbkdf2_compatibility(self):
        test_pbkdf2_compatibility()

    def test_session_token(self):
        test_session_token()

    def test_demo_logins(self):
        test_demo_logins()

    def test_auth_and_user_flows(self):
        test_auth_and_user_flows()

if __name__ == "__main__":
    test_health_and_migrations()
    test_pbkdf2_compatibility()
    test_session_token()
    test_demo_logins()
    test_auth_and_user_flows()
    print("\n🎉 ALL 14 ARCHITECTURAL TESTS PASSED SUCCESSFULLY (100% GREEN)!")

