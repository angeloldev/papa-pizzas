from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, field_validator, model_validator
from app.models.pedido import StatusPedido
from app.constants import SABORES_VALIDOS

FormaPagamento = Literal["pix", "retirada"]


class ItemPedidoCreate(BaseModel):
    sabor: str
    quantidade: int
    meio_a_meio_sabores: Optional[list[str]] = None

    @field_validator("sabor")
    @classmethod
    def sabor_valido(cls, v: str) -> str:
        if v not in SABORES_VALIDOS:
            raise ValueError(f"Sabor '{v}' não está no cardápio.")
        return v

    @field_validator("quantidade")
    @classmethod
    def quantidade_positiva(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantidade deve ser ao menos 1.")
        return v

    @model_validator(mode="after")
    def validar_meio_a_meio(self) -> "ItemPedidoCreate":
        if self.sabor == "Meio-a-meio":
            sabores = self.meio_a_meio_sabores or []
            if len(sabores) != 2:
                raise ValueError("Meio-a-meio requer exatamente 2 sub-sabores.")
            invalidos = [s for s in sabores if s not in SABORES_VALIDOS or s == "Meio-a-meio"]
            if invalidos:
                raise ValueError(f"Sub-sabores inválidos: {invalidos}")
        else:
            self.meio_a_meio_sabores = None
        return self


class PedidoCreate(BaseModel):
    nome_cliente: str
    paroquia: str
    regiao_administrativa: Optional[str] = None
    telefone: Optional[str] = None
    data_retirada: date
    itens: list[ItemPedidoCreate]
    forma_pagamento: FormaPagamento = "pix"
    observacoes: Optional[str] = None

    @field_validator("nome_cliente", "paroquia")
    @classmethod
    def nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Campo não pode ser vazio.")
        return v.strip()

    @field_validator("itens")
    @classmethod
    def ao_menos_um_item(cls, v: list) -> list:
        if not v:
            raise ValueError("O pedido deve ter ao menos um item.")
        return v


class ItemPedidoOut(BaseModel):
    sabor: str
    quantidade: int
    meio_a_meio_sabores: Optional[list[str]] = None

    model_config = {"from_attributes": True}


class PedidoOut(BaseModel):
    numero_pedido: str
    nome_cliente: str
    telefone: Optional[str] = None
    regiao_administrativa: Optional[str] = None
    data_retirada: date
    valor_total: float
    forma_pagamento: str
    observacoes: Optional[str] = None
    pix_payload: Optional[str] = None
    pix_qrcode_base64: Optional[str] = None
    status: StatusPedido
    itens: list[ItemPedidoOut]
    created_at: datetime

    model_config = {"from_attributes": True}


class PedidoResumo(BaseModel):
    """Versão compacta para listagem no painel admin."""
    id: int
    numero_pedido: str
    nome_cliente: str
    paroquia: str
    regiao_administrativa: Optional[str] = None
    telefone: Optional[str] = None
    data_retirada: date
    status: StatusPedido
    forma_pagamento: str
    valor_total: float
    observacoes: Optional[str] = None
    itens: list[ItemPedidoOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ItemConsolidacao(BaseModel):
    tipo: str  # "simples" | "meio_a_meio"
    descricao: str
    quantidade: int


class ConsolidacaoOut(BaseModel):
    itens: list[ItemConsolidacao]
    total_pizzas: int


class FaturamentoOut(BaseModel):
    data_retirada: date
    total_pedidos: int
    faturamento_bruto: float
    total_pizzas: int
