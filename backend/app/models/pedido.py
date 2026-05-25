import enum
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Date, DateTime, Enum, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class StatusPedido(str, enum.Enum):
    AGUARDANDO_PAGAMENTO = "aguardando_pagamento"
    CONFIRMADO = "confirmado"
    ENTREGUE = "entregue"


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    numero_pedido: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    nome_cliente: Mapped[str] = mapped_column(String(150))
    paroquia: Mapped[str] = mapped_column(String(150))
    data_retirada: Mapped[date] = mapped_column(Date)
    status: Mapped[StatusPedido] = mapped_column(
        Enum(StatusPedido), default=StatusPedido.AGUARDANDO_PAGAMENTO
    )
    valor_total: Mapped[float] = mapped_column(Float)
    forma_pagamento: Mapped[str] = mapped_column(String(20), default="pix")
    pix_payload: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    telefone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    regiao_administrativa: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    observacoes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    itens: Mapped[list["ItemPedido"]] = relationship(
        "ItemPedido", back_populates="pedido", cascade="all, delete-orphan"
    )


class ItemPedido(Base):
    __tablename__ = "itens_pedido"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id"))
    sabor: Mapped[str] = mapped_column(String(100))
    quantidade: Mapped[int] = mapped_column(Integer)
    # Apenas para "Meio-a-meio": armazena lista com os 2 sub-sabores
    meio_a_meio_sabores: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    pedido: Mapped["Pedido"] = relationship("Pedido", back_populates="itens")
