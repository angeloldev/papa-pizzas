import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Em produção (Railway), DATABASE_URL aponta para o PostgreSQL provisionado.
# Em desenvolvimento local, usamos SQLite.
SQLALCHEMY_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./papa_pizzas.db",
)

# PostgreSQL enviado pelo Railway às vezes usa o prefixo legado "postgres://"
# mas o SQLAlchemy 2.x exige "postgresql://". Corrigimos automaticamente.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# connect_args é necessário apenas para SQLite (permite múltiplas threads)
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# Dependency para injetar sessão do banco nas rotas FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
