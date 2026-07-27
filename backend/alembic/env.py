import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Importa o Base e todos os models para que o autogenerate funcione
from app.database import Base
import app.models  # noqa: F401 — registra todos os models no Base.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# O Alembic usa o metadata dos nossos models para saber o que criar/alterar
target_metadata = Base.metadata


def get_url() -> str:
    # Em produção (Render), DATABASE_URL vem como variável de ambiente.
    # Em desenvolvimento local, usamos o SQLite padrão.
    return os.environ.get(
        "DATABASE_URL",
        "sqlite:///./papa_pizzas.db",
    )


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
