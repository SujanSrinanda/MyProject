import time
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from backend.app.core.config import settings
from backend.app.core.security import (
    hash_password,
    verify_password,
    generate_otp,
    hash_otp,
    verify_otp_hash,
    generate_session_token,
    verify_session_token,
    validate_password,
    validate_email,
    validate_phone,
)
from backend.app.repositories.user_repo import user_repository, UserRepository
from backend.app.repositories.session_repo import session_repository, SessionRepository
from backend.app.repositories.otp_repo import otp_repository, OtpRepository
from backend.app.repositories.budget_repo import budget_repository, BudgetRepository
from backend.app.repositories.alert_repo import alert_repository, AlertRepository
from backend.app.repositories.device_repo import device_repository, DeviceRepository
from backend.app.providers.notifications import notification_provider
from backend.app.providers.neo4j_client import neo4j_client

class AuthService:
    def __init__(
        self,
        user_repo: UserRepository = user_repository,
        session_repo: SessionRepository = session_repository,
        otp_repo: OtpRepository = otp_repository,
        budget_repo: BudgetRepository = budget_repository,
        alert_repo: AlertRepository = alert_repository,
        device_repo: DeviceRepository = device_repository,
    ):
        self.user_repo = user_repo
        self.session_repo = session_repo
        self.otp_repo = otp_repo
        self.budget_repo = budget_repo
        self.alert_repo = alert_repo
        self.device_repo = device_repo

    async def generate_and_store_otp(self, target: str, channel: str) -> Dict[str, Any]:
        target = target.strip()
        now_ms = int(time.time() * 1000)

        existing = self.otp_repo.find_by_target(target)
        if existing:
            elapsed_seconds = (now_ms - existing["lastSentAt"]) // 1000
            if elapsed_seconds < settings.OTP_COOLDOWN_SECONDS:
                cooldown_remaining = settings.OTP_COOLDOWN_SECONDS - elapsed_seconds
                return {
                    "success": False,
                    "error": f"Please wait {cooldown_remaining} seconds before requesting a new verification code.",
                    "cooldownRemainingSeconds": cooldown_remaining,
                }

        code = generate_otp()
        code_hash = hash_otp(code)
        expires_at = now_ms + (settings.OTP_EXPIRY_SECONDS * 1000)

        self.otp_repo.save({
            "target": target,
            "channel": channel,
            "codeHash": code_hash,
            "expiresAt": expires_at,
            "attempts": 0,
            "lastSentAt": now_ms,
        })

        return {
            "success": True,
            "result": {
                "otp": code,
                "expiresInSeconds": settings.OTP_EXPIRY_SECONDS,
                "cooldownRemainingSeconds": settings.OTP_COOLDOWN_SECONDS,
            }
        }

    async def verify_otp_code(self, target: str, code: str) -> Dict[str, Any]:
        target = target.strip()
        code = code.strip()

        record = self.otp_repo.find_by_target(target)
        if not record:
            return {"success": False, "error": "No verification code found for this target or code has expired."}

        now_ms = int(time.time() * 1000)
        if now_ms > record["expiresAt"]:
            self.otp_repo.delete(target)
            return {"success": False, "error": "Verification code has expired. Please request a new one."}

        if record["attempts"] >= settings.OTP_MAX_ATTEMPTS:
            self.otp_repo.delete(target)
            return {"success": False, "error": "Too many failed verification attempts. Please request a new code."}

        if not verify_otp_hash(code, record["codeHash"]):
            record["attempts"] += 1
            self.otp_repo.save(record)
            remaining_attempts = settings.OTP_MAX_ATTEMPTS - record["attempts"]
            return {
                "success": False,
                "error": f"Invalid verification code. {remaining_attempts} attempt{'s' if remaining_attempts != 1 else ''} remaining."
            }

        # Successful verification -> clear OTP record
        self.otp_repo.delete(target)
        return {"success": True}

    async def create_session(self, user_id: str) -> str:
        token = generate_session_token(user_id)
        expires_at = int((time.time() + settings.SESSION_EXPIRY_DAYS * 86400) * 1000)
        self.session_repo.create({
            "token": token,
            "userId": user_id,
            "createdAt": datetime.utcnow().isoformat(),
            "expiresAt": expires_at,
        })
        return token

    async def verify_session(self, token: str) -> Optional[Dict[str, Any]]:
        verified_payload = verify_session_token(token)
        if not verified_payload:
            return None

        user_id = verified_payload["userId"]
        stored_session = self.session_repo.find_by_token(token)
        if not stored_session:
            return None

        now_ms = int(time.time() * 1000)
        if now_ms > stored_session["expiresAt"]:
            self.session_repo.delete(token)
            return None

        user = self.user_repo.find_by_id(user_id)
        return user

    async def signup(self, data: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        full_name = data.get("fullName", "").strip()
        email = data.get("email", "").strip().lower()
        phone = data.get("phone", "").strip()
        password = data.get("password", "")

        if not full_name or not email or not phone or not password:
            return 400, {"error": "Full name, email, phone number, and password are required."}

        valid_pw, pw_err = validate_password(password)
        if not valid_pw:
            return 400, {"error": pw_err}

        if self.user_repo.find_by_email(email):
            return 400, {"error": "An account with this email address already exists."}

        if self.user_repo.find_by_phone(phone):
            return 400, {"error": "An account with this phone number already exists."}

        pw_hash, pw_salt = hash_password(password)
        user_id = f"usr-{int(time.time() * 1000)}"
        now_iso = datetime.utcnow().isoformat()

        new_user = {
            "id": user_id,
            "fullName": full_name,
            "email": email,
            "phone": phone,
            "passwordHash": pw_hash,
            "passwordSalt": pw_salt,
            "emailVerified": False,
            "phoneVerified": False,
            "onboardingCompleted": False,
            "createdAt": now_iso,
            "lastLogin": now_iso,
        }

        self.user_repo.create(new_user)

        # Sync to Neo4j if configured
        try:
            neo4j_client.init_constraints()
        except Exception:
            pass

        # Initialize default budget
        self.budget_repo.save({
            "userId": user_id,
            "monthlyLimit": 35000,
            "categories": [
                {"id": f"cat-{user_id}-1", "userId": user_id, "category": "Food & Dining", "limit": 10000},
                {"id": f"cat-{user_id}-2", "userId": user_id, "category": "Transport", "limit": 5000},
                {"id": f"cat-{user_id}-3", "userId": user_id, "category": "Bills & Utilities", "limit": 8000},
                {"id": f"cat-{user_id}-4", "userId": user_id, "category": "Shopping", "limit": 6000},
                {"id": f"cat-{user_id}-5", "userId": user_id, "category": "Entertainment", "limit": 3000},
                {"id": f"cat-{user_id}-6", "userId": user_id, "category": "Other", "limit": 3000},
            ]
        })

        # Initialize default security profile
        self.user_repo.set_security_profile({
            "userId": user_id,
            "securityAlertsEnabled": True,
            "newDeviceAlerts": True,
            "transactionAlerts": True,
            "protectionLevel": "High Protection",
        })

        # Create session
        token = await self.create_session(user_id)

        # Send initial phone verification OTP
        otp_res = await self.generate_and_store_otp(new_user["phone"], "phone")
        if otp_res["success"] and otp_res.get("result"):
            notification_provider.send_sms(
                new_user["phone"],
                f"Your SentinelFin verification code is {otp_res['result']['otp']}. Valid for 5 minutes."
            )

        return 201, {
            "success": True,
            "message": "Account created successfully. Please verify your phone number.",
            "token": token,
            "user": {
                "id": new_user["id"],
                "fullName": new_user["fullName"],
                "email": new_user["email"],
                "phone": new_user["phone"],
                "emailVerified": new_user["emailVerified"],
                "phoneVerified": new_user["phoneVerified"],
                "onboardingCompleted": new_user["onboardingCompleted"],
                "balance": float(new_user.get("balance", 0.0)),
            }
        }

    async def send_otp(self, channel: str, target: str) -> Tuple[int, Dict[str, Any]]:
        channel = channel.lower().strip()
        target = target.strip()

        if not channel or not target or channel not in ("email", "phone"):
            return 400, {"error": "Valid channel (email/phone) and target are required."}

        otp_res = await self.generate_and_store_otp(target, channel)
        if not otp_res["success"]:
            return 429, {"error": otp_res.get("error", "Rate limit exceeded.")}

        otp_code = otp_res["result"]["otp"]
        if channel == "email":
            notification_provider.send_email(
                target,
                "Your SentinelFin Security Code",
                f"Your SentinelFin verification code is {otp_code}. Do not share this code."
            )
        else:
            notification_provider.send_sms(
                target,
                f"Your SentinelFin security code is {otp_code}. Valid for 5 minutes."
            )

        return 200, {
            "success": True,
            "message": f"Verification code sent via {channel.upper()}.",
            "expiresInSeconds": otp_res["result"]["expiresInSeconds"],
            "cooldownRemainingSeconds": otp_res["result"]["cooldownRemainingSeconds"],
        }

    async def verify_otp(self, channel: str, target: str, otp: str, auth_token: Optional[str] = None) -> Tuple[int, Dict[str, Any]]:
        if not target or not otp:
            return 400, {"error": "Target and verification code are required."}

        verify_result = await self.verify_otp_code(target, otp)
        if not verify_result["success"]:
            return 400, {"error": verify_result["error"]}

        user = self.user_repo.find_by_email(target) if channel == "email" else self.user_repo.find_by_phone(target)

        if not user and auth_token:
            user = await self.verify_session(auth_token)

        if user:
            if channel == "email":
                self.user_repo.update(user["id"], {"emailVerified": True})
            else:
                self.user_repo.update(user["id"], {"phoneVerified": True})
            user = self.user_repo.find_by_id(user["id"])

        return 200, {
            "success": True,
            "message": "Verification successful!",
            "user": {
                "id": user["id"],
                "fullName": user["fullName"],
                "email": user["email"],
                "phone": user["phone"],
                "emailVerified": user["emailVerified"],
                "phoneVerified": user["phoneVerified"],
                "onboardingCompleted": user["onboardingCompleted"],
            } if user else None
        }

    async def login(self, identifier: str, password: str, device_fingerprint: Optional[str] = None, user_agent: str = "Web Browser") -> Tuple[int, Dict[str, Any]]:
        identifier = identifier.strip()
        if not identifier or not password:
            return 400, {"error": "Email/Phone and password are required."}

        user = self.user_repo.find_by_email(identifier) or self.user_repo.find_by_phone(identifier)
        if not user:
            return 401, {"error": "Invalid email/phone or password."}

        if not verify_password(password, user["passwordSalt"], user["passwordHash"]):
            return 401, {"error": "Invalid email/phone or password."}

        # Update last login
        self.user_repo.update(user["id"], {"lastLogin": datetime.utcnow().isoformat()})

        # Track Device
        user_devices = self.device_repo.find_by_user_id(user["id"])
        matched = next(
            (d for d in user_devices if (device_fingerprint and d.get("fingerprint") == device_fingerprint) or d.get("browser") == user_agent),
            None
        )

        if not matched:
            new_device = {
                "id": f"dev-{int(time.time() * 1000)}",
                "userId": user["id"],
                "name": "Mobile Device" if "Mobile" in user_agent else "Desktop Browser",
                "browser": user_agent,
                "isCurrent": True,
                "isTrusted": True,
                "lastActive": datetime.utcnow().isoformat(),
                "location": "Bengaluru, KA, India",
                "fingerprint": device_fingerprint,
            }
            self.device_repo.create(new_device)

            self.alert_repo.create({
                "id": f"alt-{int(time.time() * 1000)}",
                "userId": user["id"],
                "title": "New Device Sign-In Detected",
                "message": f"Signed in from {new_device['name']} ({new_device['location']}).",
                "severity": "medium",
                "timestamp": datetime.utcnow().isoformat(),
                "isRead": False,
                "actionTaken": "Device Authorized",
            })

        token = await self.create_session(user["id"])

        return 200, {
            "success": True,
            "message": "Login successful.",
            "token": token,
            "user": {
                "id": user["id"],
                "fullName": user["fullName"],
                "email": user["email"],
                "phone": user["phone"],
                "emailVerified": user["emailVerified"],
                "phoneVerified": user["phoneVerified"],
                "onboardingCompleted": user["onboardingCompleted"],
                "city": user.get("city"),
                "profilePhoto": user.get("profilePhoto"),
                "balance": float(user.get("balance", 0.0)),
            }
        }

    async def get_me(self, user: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        user_id = user["id"]
        # Fetch fresh user record from database to get latest balance
        fresh_user = self.user_repo.find_by_id(user_id) or user
        fin_profile = self.user_repo.get_financial_profile(user_id)
        sec_profile = self.user_repo.get_security_profile(user_id)
        budget = self.budget_repo.find_by_user_id(user_id)

        return 200, {
            "success": True,
            "user": {
                "id": fresh_user["id"],
                "fullName": fresh_user["fullName"],
                "email": fresh_user["email"],
                "phone": fresh_user["phone"],
                "emailVerified": fresh_user["emailVerified"],
                "phoneVerified": fresh_user["phoneVerified"],
                "onboardingCompleted": fresh_user["onboardingCompleted"],
                "city": fresh_user.get("city"),
                "profilePhoto": fresh_user.get("profilePhoto"),
                "balance": float(fresh_user.get("balance", 0.0)),
            },
            "financialProfile": fin_profile or None,
            "securityProfile": sec_profile or None,
            "budget": budget or None,
        }

    async def logout(self, token: Optional[str]) -> Tuple[int, Dict[str, Any]]:
        if token:
            self.session_repo.delete(token)
        return 200, {"success": True, "message": "Logged out successfully."}

    async def forgot_password(self, target: str, channel: str = "email") -> Tuple[int, Dict[str, Any]]:
        target = target.strip()
        if not target:
            return 400, {"error": "Email or phone number is required."}

        user = self.user_repo.find_by_email(target) if channel == "email" else self.user_repo.find_by_phone(target)
        if not user:
            # Obfuscate for security to prevent user enumeration
            return 200, {"success": True, "message": "If an account exists, a reset code was sent."}

        otp_res = await self.generate_and_store_otp(target, channel)
        if otp_res["success"] and otp_res.get("result"):
            code = otp_res["result"]["otp"]
            if channel == "email":
                notification_provider.send_email(target, "SentinelFin Password Reset Code", f"Your reset code is {code}")
            else:
                notification_provider.send_sms(target, f"Your SentinelFin reset code is {code}")

        return 200, {"success": True, "message": "A password reset code has been sent."}

    async def reset_password(self, target: str, otp: str, new_password: str) -> Tuple[int, Dict[str, Any]]:
        target = target.strip()
        otp = otp.strip()

        if not target or not otp or not new_password:
            return 400, {"error": "Target, verification code, and new password are required."}

        valid_pw, pw_err = validate_password(new_password)
        if not valid_pw:
            return 400, {"error": pw_err}

        verify_res = await self.verify_otp_code(target, otp)
        if not verify_res["success"]:
            return 400, {"error": verify_res["error"]}

        user = self.user_repo.find_by_email(target) or self.user_repo.find_by_phone(target)
        if not user:
            return 404, {"error": "User account not found."}

        new_hash, new_salt = hash_password(new_password)
        self.user_repo.update(user["id"], {"passwordHash": new_hash, "passwordSalt": new_salt})

        # Revoke all existing sessions for security
        self.session_repo.delete_by_user_id(user["id"])

        return 200, {"success": True, "message": "Password reset successfully. You can now log in."}

auth_service = AuthService()
