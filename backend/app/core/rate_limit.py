import time
from typing import Dict, Tuple

class RateLimiter:
    def __init__(self, window_seconds: int, max_requests: int, message: str):
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self.message = message
        self.clients: Dict[str, list[float]] = {}

    def check(self, key: str) -> Tuple[bool, int, str]:
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old timestamps
        timestamps = self.clients.get(key, [])
        valid_timestamps = [t for t in timestamps if t > window_start]
        self.clients[key] = valid_timestamps

        if len(valid_timestamps) >= self.max_requests:
            oldest = valid_timestamps[0]
            retry_after = max(1, int(oldest + self.window_seconds - now))
            return False, retry_after, self.message

        self.clients[key].append(now)
        return True, 0, ""

auth_rate_limiter = RateLimiter(
    window_seconds=60,
    max_requests=10,
    message="Too many authentication attempts. Please try again in a minute."
)

otp_send_rate_limiter = RateLimiter(
    window_seconds=60,
    max_requests=3,
    message="Too many OTP requests. Please wait a minute before requesting another code."
)
