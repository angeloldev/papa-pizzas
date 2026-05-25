import uuid
from datetime import date as date_type
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.constants import CARDAPIO
from app.models import Pedido, ItemPedido, DataBloqueada
from app.schemas.pedido import PedidoCreate, PedidoOut
from app.services.datas import datas_disponiveis
from app.services.pricing import calcular_total
from app.services.pix import gerar_pix_copia_cola, gerar_qrcode_base64
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["cliente"])


@router.get("/cardapio")
def get_cardapio():
    return CARDAPIO


@router.get("/datas-disponiveis")
def get_datas_disponiveis(db: Session = Depends(get_db)) -> list[date_type]:
    return datas_disponiveis(db)


@router.get("/avisos")
def get_avisos(db: Session = Depends(get_db)):
    """Retorna datas bloqueadas com seus motivos (público)."""
    bloqueadas = db.query(DataBloqueada).order_by(DataBloqueada.data).all()
    return {
        "bloqueadas": [{"data": str(d.data), "motivo": d.motivo} for d in bloqueadas],
    }


@router.post("/pedidos", response_model=PedidoOut, status_code=status.HTTP_201_CREATED)
def criar_pedido(payload: PedidoCreate, db: Session = Depends(get_db)):
    if payload.data_retirada not in datas_disponiveis(db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data de retirada indisponível ou fora do prazo.",
        )

    valor_total = calcular_total(payload.itens)
    sufixo = uuid.uuid4().hex[:6].upper()
    numero_pedido = f"PP-{payload.data_retirada.strftime('%Y%m%d')}-{sufixo}"

    pix_payload = None
    if payload.forma_pagamento == "pix":
        pix_payload = gerar_pix_copia_cola(
            chave=settings.pix_chave,
            nome_beneficiario=settings.pix_nome_beneficiario,
            cidade=settings.pix_cidade,
            valor=valor_total,
            txid=numero_pedido,
        )

    pedido = Pedido(
        numero_pedido=numero_pedido,
        nome_cliente=payload.nome_cliente,
        paroquia=payload.paroquia,
        regiao_administrativa=payload.regiao_administrativa,
        telefone=payload.telefone,
        data_retirada=payload.data_retirada,
        valor_total=valor_total,
        forma_pagamento=payload.forma_pagamento,
        pix_payload=pix_payload,
        observacoes=payload.observacoes,
    )
    db.add(pedido)
    db.flush()

    for item in payload.itens:
        db.add(ItemPedido(
            pedido_id=pedido.id,
            sabor=item.sabor,
            quantidade=item.quantidade,
            meio_a_meio_sabores=item.meio_a_meio_sabores,
        ))

    db.commit()
    db.refresh(pedido)

    # Gera o QR Code em memória (não persiste no banco)
    qrcode_b64 = gerar_qrcode_base64(pix_payload) if pix_payload else None

    # PedidoOut não tem pix_qrcode_base64 como atributo do model,
    # então construímos o dict manualmente para incluir o campo extra
    return PedidoOut(
        **{c.key: getattr(pedido, c.key) for c in pedido.__table__.columns},
        itens=pedido.itens,
        pix_qrcode_base64=qrcode_b64,
    )
