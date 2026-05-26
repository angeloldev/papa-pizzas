from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # PIX
    pix_chave: str = "angelo@papapizzas.com"  # substitua pela sua chave real no .env
    pix_nome_beneficiario: str = "JMJ Papa Pizzas"
    pix_cidade: str = "SAO PAULO"

    # JWT (usado no Passo 6)
    secret_key: str = Field(default="troque-esta-chave-no-env-antes-de-produzir", alias="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 horas

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", populate_by_name=True)


settings = Settings()
