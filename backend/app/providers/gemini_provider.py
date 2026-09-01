import json
import logging
import os
import re
from typing import Dict, Any, Optional
from backend.app.core.config import settings

logger = logging.getLogger("sentinelfin.gemini")

class GeminiProvider:
    def __init__(self):
        self._client = None

    def _get_client(self):
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key or api_key == "MY_GEMINI_API_KEY":
            return None
        if self._client is None:
            try:
                from google import genai
                self._client = genai.Client(api_key=api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini GenAI client: {e}")
                return None
        return self._client

    async def evaluate_transaction(
        self,
        recipient_name: str,
        amount: float,
        recipient_phone: Optional[str] = None,
        payment_type: Optional[str] = "UPI",
        note: Optional[str] = None,
        is_new_recipient: bool = False
    ) -> Optional[Dict[str, Any]]:
        client = self._get_client()
        if not client:
            return None

        prompt = f"""You are SentinelFin's cybersecurity risk evaluation engine. Analyze this financial transaction:
Recipient: {recipient_name} ({recipient_phone or 'N/A'})
Amount: ₹{amount}
Type: {payment_type or 'UPI'}
Note: {note or 'None'}
New Recipient: {'Yes' if is_new_recipient else 'No'}

CRITICAL DECISION POLICY:
- If amount is greater than ₹3,000, set decision to "CHALLENGE" (High value transfer requires Face Biometric verification along with PIN).
- For normal transactions (amount ₹3,000 or less) with no malicious fraud signals, set decision to "ALLOW" (Normal amount: regular 4-digit PIN is sufficient, hide Face ID).
- If obvious fraud, phishing, or scam keywords/patterns, set decision to "BLOCK".
- Generate rich, human-friendly explainable safety insights (safetyScore, userMessage, humanReasons) for BOTH normal and high-amount transactions!

Respond ONLY with raw JSON matching this structure:
{{
  "decision": "ALLOW" or "CHALLENGE" or "BLOCK",
  "safetyScore": integer between 0 and 100,
  "riskLevel": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
  "userMessage": "clear, friendly human summary explaining whether PIN is enough or biometric is required due to high amount",
  "humanReasons": ["array of 3 plain English non-technical insights"],
  "technicalDetails": {{
    "rfScore": float 0.0-1.0,
    "ifScore": float 0.0-1.0,
    "graphRisk": float 0.0-1.0,
    "shapFactors": [{{"factor": "string", "impact": "string", "weight": float}}],
    "riskFusionModel": "SentinelFin AI Core v2",
    "anomaliesDetected": ["string"]
  }}
}}"""

        try:
            model_name = os.environ.get("GEMINI_MODEL", "gemini-3.7-flash")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            raw_text = response.text or ""
            cleaned = re.sub(r'```json|```', '', raw_text).strip()
            data = json.loads(cleaned)
            return data
        except Exception as e:
            logger.warning(f"Gemini API evaluation fallback encountered: {e}")
            return None

gemini_provider = GeminiProvider()
