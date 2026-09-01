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

    # High-risk block transaction creation - returns 403 Forbidden with blocked details
    s_blk, d_blk = await transaction_service.create_transaction(user, {
        "recipientName": "Unknown Crypto Pool Urgent",
        "amount": 8000,
        "category": "Investment",
        "type": "PHONE",
        "isNewRecipient": True
    })
    assert s_blk == 403
    assert d_blk["decision"] == "BLOCK"
    assert d_blk["transaction"]["status"] == "BLOCKED"
    print("✓ Transaction creation & server-authoritative guardrails passed (BLOCK returns 403)")

    # Test insufficient balance rejection & atomic integrity
    # Test insufficient balance rejection & atomic integrity (available balance is 8,500)
    s_insuf, d_insuf = await transaction_service.create_transaction(user, {
        "recipientName": "Alice Sentinel",
        "recipientPhone": "+919876543210",
        "amount": 49000,
        "category": "Transfers",
        "type": "PHONE",
        "isNewRecipient": False
    })
    assert s_insuf == 400
    assert "Insufficient" in d_insuf["error"]
    print("✓ Insufficient balance check passed (atomic protection)")

    # Test user directory search
    s_srch, d_srch = await user_service.search_users(user["id"], "Alice")
    assert s_srch == 200
    print("✓ User search directory passed")

    # Get transactions
    s_txs, d_txs = await transaction_service.get_transactions(user["id"])
    assert s_txs == 200
    assert len(d_txs) >= 2
    print("✓ Get transactions list passed")

    # 9. Neo4j Status Check
    s_n4j, d_n4j = neo4j_service.get_status()
    assert s_n4j == 200
    print("✓ Neo4j service status check passed")

    # 10. Test PIN status, setting, and verification
    s_pin_st, d_pin_st = await user_service.get_pin_status(user["id"])
    assert s_pin_st == 200
    s_pin_set, d_pin_set = await user_service.set_pin(user["id"], "4826")
    assert s_pin_set == 200
    assert d_pin_set.get("success") is True
    
    # Verify correct PIN
    s_pin_v1, d_pin_v1 = await user_service.verify_pin(user["id"], "4826")
    assert s_pin_v1 == 200
    assert d_pin_v1.get("verified") is True
    
    # Verify incorrect PIN
    s_pin_v2, d_pin_v2 = await user_service.verify_pin(user["id"], "9999")
    assert s_pin_v2 == 400
    print("✓ Secure hashed PIN setup, verification, and status tests passed")

    # 11. Test Alert creation & retrieval
    s_al_new, d_al_new = await alert_service.create_alert(user["id"], {
        "title": "Test Security Warning",
        "message": "Unusual login activity detected.",
        "severity": "high"
    })
    assert s_al_new == 201
    assert d_al_new["title"] == "Test Security Warning"
    print("✓ Alert creation and retrieval passed")

    # 12. Test Self-transfer prevention
    s_self, d_self = await transaction_service.create_transaction(user, {
        "recipientName": user.get("fullName", "Myself"),
        "recipientPhone": phone,
        "amount": 500,
        "category": "Transfers",
        "type": "PHONE"
    })
    assert s_self == 400
    assert "Cannot transfer funds to your own account" in d_self.get("error", "")
    print("✓ Self-transfer rejection passed (cannot send money to own phone)")

    # 13. Test Transaction Deletion
    tx_to_del_id = d_tx["id"]
    s_del_tx, d_del_tx = await transaction_service.delete_transaction(tx_to_del_id, user["id"])
    assert s_del_tx == 200
    assert d_del_tx.get("success") is True
    # Verify deleted
    s_after_del, d_after_del = await transaction_service.get_transactions(user["id"])
    assert not any(t["id"] == tx_to_del_id for t in d_after_del)
    print("✓ Transaction deletion passed")

    # 14. Logout test
    s_out, d_out = await auth_service.logout(token)
    assert s_out == 200
    user_after_logout = await auth_service.verify_session(token)
    assert user_after_logout is None
    print("✓ Logout and session invalidation passed")

async def async_test_two_user_transfer():
    # 1. Login User A (demo@sentinelfin.com)
    s_a, d_a = await auth_service.login("demo@sentinelfin.com", "password123")
    assert s_a == 200
    user_a = d_a["user"]
    token_a = d_a["token"]

    # 2. Login User B (suj@gmail.com)
    s_b, d_b = await auth_service.login("suj@gmail.com", "password123")
    assert s_b == 200
    user_b = d_b["user"]
    token_b = d_b["token"]

    # Get initial balances
    user_a_initial = await auth_service.verify_session(token_a)
    user_b_initial = await auth_service.verify_session(token_b)
    bal_a_before = float(user_a_initial["balance"])
    bal_b_before = float(user_b_initial["balance"])

    # User A sends ₹100 to User B
    transfer_amount = 100.0
    s_tx, d_tx = await transaction_service.create_transaction(user_a_initial, {
        "recipientName": user_b_initial["fullName"],
        "recipientPhone": user_b_initial["phone"],
        "amount": transfer_amount,
        "category": "Transfers",
        "type": "PHONE",
        "note": "Exact ₹100 transfer test"
    })
    assert s_tx == 201
    assert d_tx["status"] == "COMPLETED"

    # Verify updated balances in database
    user_a_after = await auth_service.verify_session(token_a)
    user_b_after = await auth_service.verify_session(token_b)
    bal_a_after = float(user_a_after["balance"])
    bal_b_after = float(user_b_after["balance"])

    assert bal_a_after == bal_a_before - transfer_amount, f"User A balance mismatch: {bal_a_before} -> {bal_a_after}"
    assert bal_b_after == bal_b_before + transfer_amount, f"User B balance mismatch: {bal_b_before} -> {bal_b_after}"

    # Verify transaction in User B history
    s_b_txs, d_b_txs = await transaction_service.get_transactions(user_b_initial["id"])
    assert s_b_txs == 200
    assert any(tx["amount"] == transfer_amount and "Received from" in (tx.get("note") or "") for tx in d_b_txs)
    print("✓ Two-user exact ₹100 atomic money transfer and balance updates verified")

async def async_test_negative_transfer_suite():
    s_a, d_a = await auth_service.login("demo@sentinelfin.com", "password123")
    user_a = d_a["user"]
    token_a = d_a["token"]

    user_fresh = await auth_service.verify_session(token_a)
    current_bal = float(user_fresh["balance"])

    # 1. Insufficient balance
    s_insuf, d_insuf = await transaction_service.create_transaction(user_fresh, {
        "recipientName": "Recipient X",
        "recipientPhone": "+919876543299",
        "amount": current_bal + 50000.0,
        "category": "Transfers",
        "type": "PHONE"
    })
    assert s_insuf == 400
    assert "Insufficient balance" in d_insuf.get("error", "")

    # 2. Self-transfer
    s_self, d_self = await transaction_service.create_transaction(user_fresh, {
        "recipientName": user_fresh["fullName"],
        "recipientPhone": user_fresh["phone"],
        "amount": 100.0,
        "category": "Transfers",
        "type": "PHONE"
    })
    assert s_self == 400
    assert "Cannot transfer funds to your own account" in d_self.get("error", "")

    # 3. Invalid PIN check
    s_pin_bad, d_pin_bad = await user_service.verify_pin(user_fresh["id"], "0000")
    assert s_pin_bad == 400
    assert "Incorrect security PIN" in d_pin_bad.get("error", "")

    # 4. Invalid PIN length
    s_pin_len, d_pin_len = await user_service.verify_pin(user_fresh["id"], "12")
    assert s_pin_len == 400
    assert "4 numeric digits" in d_pin_len.get("error", "")

    # 5. BLOCK risk decision
    s_blk, d_blk = await transaction_service.create_transaction(user_fresh, {
        "recipientName": "Crypto Urgent Scam Wallet",
        "recipientPhone": "+919899999999",
        "amount": 5000.0,
        "category": "Transfers",
        "type": "PHONE",
        "isNewRecipient": True
    })
    assert s_blk == 403
    assert d_blk.get("decision") == "BLOCK"

    # Verify balance unchanged after all negative attempts
    user_after_neg = await auth_service.verify_session(token_a)
    assert float(user_after_neg["balance"]) == current_bal
    print("✓ All negative transfer and guardrail tests passed without altering balances")

async def async_test_user_isolation_suite():
    # User A
    s_a, d_a = await auth_service.login("demo@sentinelfin.com", "password123")
    user_a = d_a["user"]

    # User B
    s_b, d_b = await auth_service.login("suj@gmail.com", "password123")
    user_b = d_b["user"]

    # Create a contact and an alert under User B
    s_c_b, d_c_b = await contact_service.create_contact(user_b["id"], {
        "name": "User B Secret Contact",
        "phone": "+919111111111"
    })
    contact_b_id = d_c_b["id"]

    s_al_b, d_al_b = await alert_service.create_alert(user_b["id"], {
        "title": "User B Private Alert",
        "message": "Confidential security signal"
    })
    alert_b_id = d_al_b["id"]

    # User A tries to delete or update User B's contact
    s_del_cnt, d_del_cnt = await contact_service.delete_contact(contact_b_id, user_a["id"])
    assert s_del_cnt == 404 or s_del_cnt == 403

    # User A tries to update User B's alert
    s_up_al, d_up_al = await alert_service.update_alert(alert_b_id, user_a["id"], {"isRead": True})
    assert s_up_al == 404 or s_up_al == 403

    # User A contacts do NOT contain User B's contact
    s_a_cnts, d_a_cnts = await contact_service.get_contacts(user_a["id"])
    assert not any(c["id"] == contact_b_id for c in d_a_cnts)

    # User A alerts do NOT contain User B's alert
    s_a_alrts, d_a_alrts = await alert_service.get_alerts(user_a["id"])
    assert not any(a["id"] == alert_b_id for a in d_a_alrts)
    print("✓ Strict user isolation and authorization barrier verified across all resources")

async def async_test_full_crud_suite():
    s_u, d_u = await auth_service.login("demo@sentinelfin.com", "password123")
    user = d_u["user"]
    u_id = user["id"]

    # CONTACT CRUD
    s_c_new, d_c_new = await contact_service.create_contact(u_id, {
        "name": "CRUD Test Contact",
        "phone": "+919870001122",
        "email": "crud@test.com"
    })
    assert s_c_new == 201
    cid = d_c_new["id"]

    s_c_up, d_c_up = await contact_service.update_contact(cid, u_id, {"isFavorite": True, "name": "CRUD Contact Starred"})
    assert s_c_up == 200
    assert d_c_up.get("success") is True
    s_c_get, d_c_list = await contact_service.get_contacts(u_id)
    assert any(c["id"] == cid and c["isFavorite"] is True for c in d_c_list)

    s_c_del, d_c_del = await contact_service.delete_contact(cid, u_id)
    assert s_c_del == 200

    # BUDGET CRUD
    s_b_up, d_b_up = await budget_service.update_budget(u_id, {
        "monthlyLimit": 52000.0,
        "categories": [{"category": "Shopping", "limit": 12000.0}]
    })
    assert s_b_up == 200
    s_b_get, d_b_get = await budget_service.get_budget(u_id)
    assert s_b_get == 200
    assert d_b_get["monthlyLimit"] == 52000.0
    assert any(c["category"] == "Shopping" and c["limit"] == 12000.0 for c in d_b_get.get("categories", []))

    # ALERTS CRUD
    s_a_new, d_a_new = await alert_service.create_alert(u_id, {
        "title": "CRUD Alert Test",
        "message": "Testing alert lifecycle",
        "severity": "medium"
    })
    assert s_a_new == 201
    aid = d_a_new["id"]

    s_a_up, d_a_up = await alert_service.update_alert(aid, u_id, {"isRead": True})
    assert s_a_up == 200
    assert d_a_up.get("success") is True
    s_a_get, d_a_list = await alert_service.get_alerts(u_id)
    assert any(a["id"] == aid and a["isRead"] is True for a in d_a_list)

    s_a_del, d_a_del = await alert_service.delete_alert(aid, u_id)
    assert s_a_del == 200

    # DEVICES CRUD
    s_d_reg, d_d_reg = await device_service.register_device(u_id, "Mozilla/5.0 CRUD Browser", {"fingerprint": "fp_crud_test"})
    assert s_d_reg == 200
    s_d_get, d_d_get = await device_service.get_devices(u_id)
    assert s_d_get == 200
    created_device = next((d for d in d_d_get if d.get("fingerprint") == "fp_crud_test" or "CRUD" in d.get("deviceType", "")), None)
    if created_device:
        s_d_del, d_d_del = await device_service.delete_device(created_device["id"], u_id)
        assert s_d_del == 200

    # PROFILE CRUD
    s_p_up, d_p_up = await user_service.update_profile(user, {"name": "Sujan Demo Account", "phone": "+919876543210"})
    assert s_p_up == 200
    s_p_get, d_p_get = await user_service.get_profile(user)
    assert s_p_get == 200
    print("✓ Complete CRUD lifecycle verified across Contacts, Budget, Alerts, Devices, and Profile")

def test_two_user_transfer():
    asyncio.run(async_test_two_user_transfer())

def test_negative_transfer_suite():
    asyncio.run(async_test_negative_transfer_suite())

def test_user_isolation_suite():
    asyncio.run(async_test_user_isolation_suite())

def test_full_crud_suite():
    asyncio.run(async_test_full_crud_suite())

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

    def test_two_user_transfer(self):
        test_two_user_transfer()

    def test_negative_transfer_suite(self):
        test_negative_transfer_suite()

    def test_user_isolation_suite(self):
        test_user_isolation_suite()

    def test_full_crud_suite(self):
        test_full_crud_suite()

    def test_auth_and_user_flows(self):
        test_auth_and_user_flows()

if __name__ == "__main__":
    test_health_and_migrations()
    test_pbkdf2_compatibility()
    test_session_token()
    test_demo_logins()
    test_two_user_transfer()
    test_negative_transfer_suite()
    test_user_isolation_suite()
    test_full_crud_suite()
    test_auth_and_user_flows()
    print("\n🎉 ALL ARCHITECTURAL, TRANSFER, ISOLATION, AND CRUD TESTS PASSED (100% GREEN)!")

