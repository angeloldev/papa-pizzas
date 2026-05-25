from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models import Admin

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha_plana, senha_hash)


def criar_token(data: dict, expira_em: Optional[timedelta] = None) -> str:
    payload = data.copy()
    expira = datetime.utcnow() + (expira_em or timedelta(minutes=settings.access_token_expire_minutes))
    payload.update({"exp": expira})
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Admin:
    """Dependency que extrai e valida o JWT, retornando o admin autenticado."""
    erro_credenciais = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")  # type: ignore[assignment]
        if not email:
            raise erro_credenciais
    except JWTError:
        raise erro_credenciais

    admin = db.query(Admin).filter(Admin.email == email, Admin.ativo == True).first()
    if not admin:
        raise erro_credenciais
    return admin
