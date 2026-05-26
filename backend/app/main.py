import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — garante que todos os models sejam registrados no Base
from app.routers import pedidos, auth, admin

app = FastAPI(title="Papa Pizzas API", version="0.1.0")

# Em produção, ALLOWED_ORIGINS deve ser definido como variável de ambiente
# contendo a URL do frontend no Vercel. Ex: "https://papa-pizzas.vercel.app"
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8001")
allowed_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
