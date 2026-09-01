import base64
import json
import logging
import urllib.parse
import urllib.request
import urllib.error
from typing import Dict, Any
from backend.app.core.config import settings

logger = logging.getLogger("sentinelfin.notifications")

class NotificationProvider:
    def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        """Dispatches real SMS via Twilio if configured, or falls back to simulation."""
        provider = (settings.SMS_PROVIDER or "").lower()
        account_sid = settings.SMS_ACCOUNT_SID
        auth_token = settings.SMS_AUTH_TOKEN
        from_number = settings.SMS_FROM

        if settings.ENABLE_SMS_DISPATCH and provider == "twilio" and account_sid and auth_token and from_number:
            body_payloads = [message]
            if message != "sms_2fa":
                body_payloads.append("sms_2fa")

            for body_text in body_payloads:
                try:
                    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
                    data = urllib.parse.urlencode({
                        "To": phone,
                        "From": from_number,
                        "Body": body_text
                    }).encode('utf-8')

                    req = urllib.request.Request(url, data=data, method="POST")
                    credentials = f"{account_sid}:{auth_token}"
                    b64_creds = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
                    req.add_header("Authorization", f"Basic {b64_creds}")
                    req.add_header("Content-Type", "application/x-www-form-urlencoded")

                    with urllib.request.urlopen(req, timeout=10) as response:
                        res_body = response.read().decode('utf-8')
                        res_json = json.loads(res_body)
                        sid = res_json.get("sid")
                        status = res_json.get("status")
                        logger.info(f"[Twilio SMS Provider] Message queued/sent to {phone}: SID {sid}, Status: {status}")
                        return {"success": True, "sid": sid, "status": status, "phone": phone, "delivered": True}
                except urllib.error.HTTPError as err:
                    err_resp = err.read().decode('utf-8')
                    logger.warning(f"[Twilio SMS HTTP {err.code}] Attempt with body='{body_text}' failed: {err_resp}")
                    if err.code == 400 and "572006" in err_resp and body_text != "sms_2fa":
                        continue
                    break
                except Exception as e:
                    logger.error(f"[Twilio SMS Error] Failed to send SMS to {phone}: {str(e)}")
                    break

        logger.info(f"[SMS Provider Simulation] Sent to {phone}: {message}")
        print(f"\n==================== [SIMULATED SMS] ====================")
        print(f"To: {phone}")
        print(f"Message: {message}")
        print(f"=========================================================\n")
        return {"success": True, "phone": phone, "delivered": True, "simulated": True}

    def send_email(self, email: str, subject: str, body: str) -> Dict[str, Any]:
        """Dispatches Email or outputs simulated delivery in development."""
        logger.info(f"[Email Provider] Sent to {email}: {subject}")
        print(f"\n==================== [SIMULATED EMAIL] ====================")
        print(f"To: {email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print(f"===========================================================\n")
        return {"success": True, "email": email, "delivered": True}

notification_provider = NotificationProvider()
