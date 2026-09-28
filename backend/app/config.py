from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    # Full URL overrides the POSTGRES_* parts (e.g. sqlite for local tests)
    database_url: str | None = None
    postgres_user: str = "hamkar"
    postgres_password: str = "hamkar"
    postgres_db: str = "hamkar"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 30  # 30 days
    cors_origins: str = (
        "https://games.kashefteam.org,"
        "http://games.kashefteam.org,"
        "http://127.0.0.1:1234,"
        "http://localhost:1234"
    )

    @property
    def sqlalchemy_url(self) -> str | URL:
        if self.database_url:
            return self.database_url
        # URL.create escapes special characters (@, !, :, /) in the password
        return URL.create(
            "postgresql+psycopg",
            username=self.postgres_user,
            password=self.postgres_password,
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        )


settings = Settings()
