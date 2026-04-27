from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Base de datos
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "cmms_db"
    DB_USER: str = "cmms_user"
    DB_PASSWORD: str = ""

    # JWT
    SECRET_KEY: str = "dev-secret-key-cambiar-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas

    # App
    APP_NAME: str = "CMMS IMCLA-Volcán"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Archivos
    UPLOAD_DIR: str = "/var/www/cmms/uploads"
    MAX_FILE_SIZE_MB: int = 10

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def ORIGINS_LIST(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
