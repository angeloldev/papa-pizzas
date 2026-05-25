from datetime import date
from sqlalchemy.orm import Session
from app.models import Pedido
from app.models.pedido import StatusPedido
from app.schemas.pedido import ItemConsolidacao, ConsolidacaoOut, FaturamentoOut


def consolidar_producao(db: Session, data_retirada: date) -> ConsolidacaoOut:
    """
    Retorna a lista de pizzas a produzir para um sábado.
    - Pizzas simples: somadas por sabor
    - Meio-a-meio: cada unidade aparece como 1 pizza com os 2 sabores indicados
      (NÃO divide em 0,5 — o admin precisa saber exatamente o que fazer)
    Considera apenas pedidos Confirmados e Entregues.
    """
    pedidos = (
        db.query(Pedido)
        .filter(
            Pedido.data_retirada == data_retirada,
            Pedido.status.in_([StatusPedido.CONFIRMADO, StatusPedido.ENTREGUE]),
        )
        .all()
    )

    simples: dict[str, int] = {}
    meio_a_meio: dict[str, int] = {}  # key: "Sabor A + Sabor B" (ordenado)

    for pedido in pedidos:
        for item in pedido.itens:
            if item.sabor == "Meio-a-meio" and item.meio_a_meio_sabores:
                chave = " + ".join(sorted(item.meio_a_meio_sabores))
                meio_a_meio[chave] = meio_a_meio.get(chave, 0) + item.quantidade
            else:
                simples[item.sabor] = simples.get(item.sabor, 0) + item.quantidade

    itens: list[ItemConsolidacao] = []
    for sabor, qtd in sorted(simples.items(), key=lambda x: -x[1]):
        itens.append(ItemConsolidacao(tipo="simples", descricao=sabor, quantidade=qtd))
    for desc, qtd in sorted(meio_a_meio.items(), key=lambda x: -x[1]):
        itens.append(ItemConsolidacao(tipo="meio_a_meio", descricao=desc, quantidade=qtd))

    total = sum(simples.values()) + sum(meio_a_meio.values())
    return ConsolidacaoOut(itens=itens, total_pizzas=total)


def calcular_faturamento(db: Session, data_retirada: date) -> FaturamentoOut:
    """Faturamento bruto dos pedidos confirmados/entregues de um sábado."""
    pedidos = (
        db.query(Pedido)
        .filter(
            Pedido.data_retirada == data_retirada,
            Pedido.status.in_([StatusPedido.CONFIRMADO, StatusPedido.ENTREGUE]),
        )
        .all()
    )

    faturamento = sum(p.valor_total for p in pedidos)
    total_pizzas = sum(sum(it.quantidade for it in p.itens) for p in pedidos)

    return FaturamentoOut(
        data_retirada=data_retirada,
        total_pedidos=len(pedidos),
        faturamento_bruto=round(faturamento, 2),
        total_pizzas=total_pizzas,
    )
