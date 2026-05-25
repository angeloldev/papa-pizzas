from datetime import date, datetime
from sqlalchemy import Date, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class DataBloqueada(Base):
    __tablename__ = "datas_bloqueadas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    data: Mapped[date] = mapped_column(Date, unique=True, index=True)
    motivo: Mapped[str] = mapped_column(String(255), default="Bloqueado pelo admin")
    bloqueado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
