from app.schemas.pedido import ItemPedidoCreate
from app.constants import PRECO_POR_SABOR


def calcular_total(itens: list[ItemPedidoCreate]) -> float:
    """
    Calcula o valor total do pedido.
    Para "Meio-a-meio", usa o preço do próprio sabor (R$50),
    independente dos sub-sabores escolhidos.
    """
    total = 0.0
    for item in itens:
        preco_unitario = PRECO_POR_SABOR[item.sabor]
        total += preco_unitario * item.quantidade
    return round(total, 2)
