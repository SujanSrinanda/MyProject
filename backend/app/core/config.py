import os
from backend.app.core.compat import BaseSettings, Field

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development", env="NODE_ENV")
    PORT: int = Field(default=3000, env="PORT")
    DATABASE_PATH: str = Field(default="data/sentinelfin.sqlite", env="DATABASE_PATH")
    AUTH_SECRET: str = Field(default="sentinelfin_dev_secret_key_change_in_production_2026", env="AUTH_SECRET")
    
    # Session & OTP security
    SESSION_EXPIRY_DAYS: int = 7
    OTP_EXPIRY_SECONDS: int = 300  # 5 minutes
    OTP_COOLDOWN_SECONDS: int = 60  # 60 seconds
    OTP_MAX_ATTEMPTS: int = 5
    
    # AI & Graph credentials
    GEMINI_API_KEY: str | None = Field(default=None, env="GEMINI_API_KEY")
    NEO4J_URI: str | None = Field(default=None, env="NEO4J_URI")
    NEO4J_USERNAME: str = Field(default="neo4j", env="NEO4J_USERNAME")
    NEO4J_PASSWORD: str | None = Field(default=None, env="NEO4J_PASSWORD")
    NEO4J_DATABASE: str = Field(default="neo4j", env="NEO4J_DATABASE")

    # Notification configuration
    SMS_PROVIDER: str = Field(default="twilio", env="SMS_PROVIDER")
    SMS_ACCOUNT_SID: str | None = Field(default=None, env="SMS_ACCOUNT_SID")
    SMS_AUTH_TOKEN: str | None = Field(default=None, env="SMS_AUTH_TOKEN")
    SMS_FROM: str | None = Field(default=None, env="SMS_FROM")
    ENABLE_SMS_DISPATCH: bool = Field(default=True, env="ENABLE_SMS_DISPATCH")
    ENABLE_EMAIL_DISPATCH: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

def validate_auth_environment() -> None:
    if settings.ENVIRONMENT == "production":
        insecure_keys = [
            "sentinelfin_dev_secret_key_change_in_production_2026",
            "replace_me_with_a_secure_random_string_at_least_32_chars",
            "default_secret",
            "secret",
        ]
        if not settings.AUTH_SECRET or settings.AUTH_SECRET in insecure_keys or len(settings.AUTH_SECRET) < 32:
            raise RuntimeError(
                "[CRITICAL SECURITY ERROR] In production, AUTH_SECRET must be set to a secure, randomly generated string of at least 32 characters."
            )
