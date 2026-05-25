export interface SaborCardapio {
  nome: string;
  preco: number;
  meio_a_meio: boolean;
  ingredientes: string;
}

export interface ItemPedidoPayload {
  sabor: string;
  quantidade: number;
  meio_a_meio_sabores?: string[];
}

export interface PedidoPayload {
  nome_cliente: string;
  paroquia: string;
  regiao_administrativa?: string;
  telefone?: string;
  data_retirada: string;
  itens: ItemPedidoPayload[];
  forma_pagamento: "pix" | "retirada";
  observacoes?: string;
}

export interface ItemPedidoOut {
  sabor: string;
  quantidade: number;
  meio_a_meio_sabores: string[] | null;
}

export interface PedidoOut {
  numero_pedido: string;
  nome_cliente: string;
  telefone: string | null;
  regiao_administrativa: string | null;
  data_retirada: string;
  valor_total: number;
  forma_pagamento: "pix" | "retirada";
  observacoes: string | null;
  pix_payload: string | null;
  pix_qrcode_base64: string | null;
  status: "aguardando_pagamento" | "confirmado" | "entregue";
  itens: ItemPedidoOut[];
  created_at: string;
}

export interface ItemConsolidacao {
  tipo: "simples" | "meio_a_meio";
  descricao: string;
  quantidade: number;
}

export interface ConsolidacaoOut {
  itens: ItemConsolidacao[];
  total_pizzas: number;
}

export interface FaturamentoOut {
  data_retirada: string;
  total_pedidos: number;
  faturamento_bruto: number;
  total_pizzas: number;
}
