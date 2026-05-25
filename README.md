<div align="center">

# 🍕 Papa Pizzas

**Sistema de encomendas online para o projeto JMJ — Brasília, DF**

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)

</div>

---

## Sobre o projeto

Papa Pizzas é um sistema web full-stack para gerenciar encomendas semanais de pizzas de um projeto JMJ paroquial em Brasília. Os clientes fazem pedidos pelo site e pagam via PIX; a equipe gestora acompanha e confirma os pedidos pelo Painel Admin.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.11 · FastAPI · SQLAlchemy 2 · SQLite |
| Autenticação | JWT (python-jose + passlib[bcrypt]) |
| Frontend | React 18 · Vite · TailwindCSS 4 · Axios |
| PIX | Geração interna BR Code / EMVCo (sem API externa) |

## Funcionalidades

**Área do cliente**
- Cardápio com preços e lógica Meio-a-meio
- Calendário restrito a sábados disponíveis (corte: sexta às 12h)
- Pagamento via PIX (QR Code + Copia-e-Cola) ou na retirada
- Botão "Enviar comprovante" abre WhatsApp com template do pedido

**Painel Admin** (`/admin`)
- Listagem e filtro de pedidos por data
- Atualização de status (aguardando → confirmado → entregue)
- Consolidação de insumos por sábado
- Faturamento (total arrecadado vs. a receber)
- Bloqueio manual de datas com motivo

## Executar localmente

### Pré-requisitos
- Python 3.11+
- Node.js 18+ com pnpm

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # edite com sua chave PIX e SECRET_KEY
python -m app.seed               # cria banco e insere admins iniciais
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env             # ajuste VITE_API_URL e VITE_WHATSAPP_NUMBER
pnpm dev
```

## Estrutura do projeto

```
papa_pizzas/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + CORS
│   │   ├── database.py      # engine + sessão
│   │   ├── constants.py     # cardápio fixo
│   │   ├── models/          # SQLAlchemy: Pedido, ItemPedido, Admin, DataBloqueada
│   │   ├── schemas/         # Pydantic: PedidoCreate, PedidoOut…
│   │   ├── routers/         # pedidos.py (público) · admin.py · auth.py
│   │   ├── services/        # pix.py · pricing.py · datas.py · consolidacao.py
│   │   ├── core/            # config.py · security.py (JWT)
│   │   └── seed.py          # popula banco com admins iniciais
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.tsx             # jornada do cliente
    │   │   └── admin/
    │   │       ├── Login.tsx
    │   │       └── Painel.tsx       # Painel do Papa
    │   ├── components/              # Header, CardapioSection, FormPedido…
    │   └── lib/
    │       ├── api.ts               # Axios + interceptor JWT
    │       └── types.ts             # tipos compartilhados
    ├── .env.example
    └── package.json
```

## Regras de negócio

- Pedidos aceitos até **sexta-feira às 12h** para o sábado seguinte
- Admin pode bloquear datas manualmente com motivo (ex: feriado, manutenção)
- PIX gerado no backend — nenhuma chave ou dado sensível exposto no frontend
- Meio-a-meio: até 2 sabores diferentes por pizza, cobrado pelo preço do sabor mais caro

## Licença

Projeto sem fins lucrativos desenvolvido para uso interno da PAPA PIZZAS Brasília.
