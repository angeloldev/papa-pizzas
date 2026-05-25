"""
Executar uma vez para inicializar o banco de dados:
  cd backend
  source .venv/bin/activate
  python -m app.seed
"""
from passlib.context import CryptContext
from app.database import Base, engine, SessionLocal
from app.models import Admin

# Importar todos os models garante que o Base os conheça antes do create_all
import app.models  # noqa: F401

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMINS_INICIAIS = [
    {"nome": "Angelo Cordova",  "email": "angelo@papapizzas.com",  "senha": "admin123"},
    {"nome": "Admin 2",         "email": "admin2@papapizzas.com",  "senha": "admin123"},
    {"nome": "Admin 3",         "email": "admin3@papapizzas.com",  "senha": "admin123"},
    {"nome": "Admin 4",         "email": "admin4@papapizzas.com",  "senha": "admin123"},
]


def seed():
    print("Criando tabelas...")
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas!")

    db = SessionLocal()
    try:
        for dados in ADMINS_INICIAIS:
            existe = db.query(Admin).filter(Admin.email == dados["email"]).first()
            if not existe:
                admin = Admin(
                    nome=dados["nome"],
                    email=dados["email"],
                    senha_hash=pwd_context.hash(dados["senha"]),
                )
                db.add(admin)
                print(f"  Admin criado: {dados['email']}")
            else:
                print(f"  Admin já existe: {dados['email']} (pulado)")
        db.commit()
        print("Seed concluído!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
