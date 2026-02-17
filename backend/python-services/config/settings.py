from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Application settings
    app_name: str = "MSI Agentic Platform - Python Services"
    debug: bool = True

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000

    # Database settings
    db_host: str
    db_port: int = 5432
    db_username: str
    db_password: str
    db_name: str
    database_url: Optional[str] = None

    # API Keys and secrets
    secret_key: str = "your-secret-key-here"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
