import base64
import hashlib
import hmac
import re
import secrets
import time
from typing import Optional, Tuple, Dict, Any
from backend.app.core.config import settings

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
PHONE_REGEX = re.compile(r'^\+?[1-9]\d{7,14}$')

def validate_email(email: str) -> bool:
    return bool(email and EMAIL_REGEX.match(email.strip()))

def validate_phone(phone: str) -> bool:
    return bool(phone and PHONE_REGEX.match(phone.strip()))

def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    return True, None

def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """
    PBKDF2-HMAC-SHA512 with 210,000 iterations and 64-byte key output.
    Matches Node.js crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex')
    """
    if not salt:
        salt = secrets.token_hex(16)  # 32 characters
    
    hash_hex = hashlib.pbkdf2_hmac(
        'sha512',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        210000,
        dklen=64
    ).hex()
    return hash_hex, salt

def verify_password(password: str, salt: str, password_hash: str) -> bool:
    computed_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(computed_hash, password_hash)

def generate_otp() -> str:
    """Generates a 6-digit cryptographically secure numeric OTP."""
    code = secrets.randbelow(900000) + 100000
    return str(code)

def hash_otp(code: str) -> str:
    """Generates SHA-256 hash of the OTP code."""
    return hashlib.sha256(code.strip().encode('utf-8')).hexdigest()

def verify_otp_hash(code: str, expected_hash: str) -> bool:
    computed_hash = hash_otp(code)
    return secrets.compare_digest(computed_hash, expected_hash)

def generate_session_token(user_id: str) -> str:
    """
    Issues a tamper-proof HMAC-SHA256 signed session token:
    Format: stkn.<base64url(payload)>.<signature>
    """
    now_ms = int(time.time() * 1000)
    random_entropy = secrets.token_hex(16)
    session_payload = f"{user_id}:{now_ms}:{random_entropy}"

    sig = hmac.new(
        settings.AUTH_SECRET.encode('utf-8'),
        session_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    b64_payload = base64.urlsafe_b64encode(session_payload.encode('utf-8')).decode('utf-8').rstrip('=')
    return f"stkn.{b64_payload}.{sig}"

def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies HMAC-SHA256 signature of a session token and extracts payload.
    """
    if not token or not token.startswith("stkn."):
        return None

    parts = token.split(".")
    if len(parts) != 3:
        return None

    _, b64_payload, signature = parts

    # Pad base64url string
    padded = b64_payload + "=" * ((4 - len(b64_payload) % 4) % 4)
    try:
        raw_payload = base64.urlsafe_b64decode(padded.encode('utf-8')).decode('utf-8')
    except Exception:
        return None

    expected_sig = hmac.new(
        settings.AUTH_SECRET.encode('utf-8'),
        raw_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    if not secrets.compare_digest(signature, expected_sig):
        return None

    payload_parts = raw_payload.split(":")
    if len(payload_parts) < 2:
        return None

    user_id = payload_parts[0]
    try:
        created_at_ms = int(payload_parts[1])
    except ValueError:
        return None

    return {
        "userId": user_id,
        "createdAt": created_at_ms
    }
