from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
import app.models  # noqa: F401 — garante que todos os models sejam registrados no Base
from app.routers import pedidos, auth, admin

# Cria as tabelas ao iniciar (idempotente — não apaga dados existentes)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Papa Pizzas API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pedidos.router)
app.include_router(auth.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "Bem-vindo à Papa Pizzas API! 🍕"}


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Papa Pizzas API no ar! 🍕"}
