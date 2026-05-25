from datetime import date as date_type
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Admin, Pedido, DataBloqueada
from app.models.pedido import StatusPedido
from app.schemas.pedido import PedidoResumo, ConsolidacaoOut, FaturamentoOut
from app.core.security import get_current_admin
from app.services.consolidacao import consolidar_producao, calcular_faturamento

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ─── Pedidos ─────────────────────────────────────────────────────────────────

@router.get("/pedidos", response_model=list[PedidoResumo])
def listar_pedidos(
    data: Optional[date_type] = None,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    q = db.query(Pedido)
    if data:
        q = q.filter(Pedido.data_retirada == data)
    return q.order_by(Pedido.created_at.desc()).all()


@router.patch("/pedidos/{pedido_id}/status", response_model=PedidoResumo)
def atualizar_status(
    pedido_id: int,
    novo_status: StatusPedido,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    pedido.status = novo_status
    db.commit()
    db.refresh(pedido)
    return pedido


@router.delete("/pedidos/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_pedido(
    pedido_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    db.delete(pedido)
    db.commit()


# ─── Consolidação e Faturamento ───────────────────────────────────────────────

@router.get("/consolidacao", response_model=ConsolidacaoOut)
def get_consolidacao(
    data: date_type,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    return consolidar_producao(db, data)


@router.get("/faturamento", response_model=FaturamentoOut)
def get_faturamento(
    data: date_type,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    return calcular_faturamento(db, data)


# ─── Datas Bloqueadas ─────────────────────────────────────────────────────────

@router.get("/datas-bloqueadas")
def listar_datas_bloqueadas(
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    return db.query(DataBloqueada).order_by(DataBloqueada.data).all()


@router.post("/datas-bloqueadas", status_code=status.HTTP_201_CREATED)
def bloquear_data(
    data: date_type,
    motivo: str = "Bloqueado pelo admin",
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    if db.query(DataBloqueada).filter(DataBloqueada.data == data).first():
        raise HTTPException(status_code=400, detail="Data já está bloqueada.")
    db.add(DataBloqueada(data=data, motivo=motivo))
    db.commit()
    return {"detail": f"Data {data} bloqueada."}


@router.delete("/datas-bloqueadas/{data}")
def desbloquear_data(
    data: date_type,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    registro = db.query(DataBloqueada).filter(DataBloqueada.data == data).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Data não está bloqueada.")
    db.delete(registro)
    db.commit()
    return {"detail": f"Data {data} desbloqueada."}


