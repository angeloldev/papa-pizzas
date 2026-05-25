from typing import TypedDict


class Sabor(TypedDict):
    nome: str
    preco: float
    meio_a_meio: bool
    ingredientes: str


CARDAPIO: list[Sabor] = [
    {
        "nome": "Calabresa",
        "preco": 45.0,
        "meio_a_meio": False,
        "ingredientes": "Molho de tomate, mussarela, calabresa fatiada, cebola e orégano.",
    },
    {
        "nome": "Marguerita",
        "preco": 45.0,
        "meio_a_meio": False,
        "ingredientes": "Molho de tomate, mussarela, tomate cereja e manjericão fresco",
    },
    {
        "nome": "Frango c/ Catupiry",
        "preco": 50.0,
        "meio_a_meio": False,
        "ingredientes": "Molho de tomate, mussarela, frango desfiado temperado, requeijão Catupiry e orégano.",
    },
    {
        "nome": "Portuguesa",
        "preco": 50.0,
        "meio_a_meio": False,
        "ingredientes": "Molho de tomate, mussarela, presunto, ovo cozido, cebola, pimentão e orégano.",
    },
    {
        "nome": "4 Queijos",
        "preco": 50.0,
        "meio_a_meio": False,
        "ingredientes": "Molho de tomate, mussarela, provolone, parmesão e gorgonzola.",
    },
    {
        "nome": "Banana c/ Canela",
        "preco": 50.0,
        "meio_a_meio": False,
        "ingredientes": "Creme de leite, mussarela, banana nanica fatiada, canela em pó e açúcar.",
    },
    {
        "nome": "Meio-a-meio",
        "preco": 50.0,
        "meio_a_meio": True,
        "ingredientes": "Você escolhe 2 sabores e dividimos a pizza ao meio. Preço único de R$ 50.",
    },
]

PRECO_POR_SABOR: dict[str, float] = {s["nome"]: s["preco"] for s in CARDAPIO}
SABORES_VALIDOS: set[str] = {s["nome"] for s in CARDAPIO}
