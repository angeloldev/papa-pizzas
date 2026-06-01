import axios from "axios";
import type {
  SaborCardapio, PedidoPayload, PedidoOut,
  ConsolidacaoOut, FaturamentoOut, ItemPedidoOut,
} from "./types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("papa_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      window.location.pathname.startsWith("/admin") &&
      !window.location.pathname.startsWith("/admin/login")
    ) {
      localStorage.removeItem("papa_token");
      localStorage.removeItem("papa_admin_nome");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

// ─── Públicas ─────────────────────────────────────────────────────────────────

export async function getCardapio(): Promise<SaborCardapio[]> {
  const { data } = await api.get<SaborCardapio[]>("/api/cardapio");
  return data;
}

export async function getDatasDisponiveis(): Promise<string[]> {
  const { data } = await api.get<string[]>("/api/datas-disponiveis");
  return data;
}

export async function criarPedido(payload: PedidoPayload): Promise<PedidoOut> {
  const { data } = await api.post<PedidoOut>("/api/pedidos", payload);
  return data;
}

export async function getAvisos(): Promise<AvisosDatas> {
  const { data } = await api.get<AvisosDatas>("/api/avisos");
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, senha: string) {
  const { data } = await api.post<{ access_token: string; nome: string }>(
    "/api/auth/login",
    { email, senha }
  );
  return data;
}

// ─── Admin: pedidos ───────────────────────────────────────────────────────────

export interface PedidoAdmin {
  id: number;
  numero_pedido: string;
  nome_cliente: string;
  paroquia: string;
  regiao_administrativa: string | null;
  telefone: string;
  data_retirada: string;
  status: "aguardando_pagamento" | "confirmado" | "entregue";
  forma_pagamento: string;
  valor_total: number;
  observacoes: string | null;
  itens: ItemPedidoOut[];
  created_at: string;
}

export interface AvisosDatas {
  bloqueadas: { data: string; motivo: string }[];
}

export async function getPedidosAdmin(data?: string): Promise<PedidoAdmin[]> {
  const { data: res } = await api.get<PedidoAdmin[]>("/api/admin/pedidos", {
    params: data ? { data } : {},
  });
  return res;
}

export async function atualizarStatus(id: number, novoStatus: string): Promise<PedidoAdmin> {
  const { data } = await api.patch<PedidoAdmin>(
    `/api/admin/pedidos/${id}/status`,
    null,
    { params: { novo_status: novoStatus } }
  );
  return data;
}

export async function deletarPedido(id: number): Promise<void> {
  await api.delete(`/api/admin/pedidos/${id}`);
}

// ─── Admin: consolidação e faturamento ───────────────────────────────────────

export async function getConsolidacao(data: string): Promise<ConsolidacaoOut> {
  const { data: res } = await api.get<ConsolidacaoOut>("/api/admin/consolidacao", {
    params: { data },
  });
  return res;
}

export async function getFaturamento(data: string): Promise<FaturamentoOut> {
  const { data: res } = await api.get<FaturamentoOut>("/api/admin/faturamento", {
    params: { data },
  });
  return res;
}

// ─── Admin: datas bloqueadas ──────────────────────────────────────────────────

export async function getDatasBoqueadas(): Promise<{ data: string; motivo: string }[]> {
  const { data } = await api.get("/api/admin/datas-bloqueadas");
  return data;
}

export async function bloquearData(data: string, motivo?: string): Promise<void> {
  await api.post("/api/admin/datas-bloqueadas", null, { params: { data, motivo } });
}

export async function desbloquearData(data: string): Promise<void> {
  await api.delete(`/api/admin/datas-bloqueadas/${data}`);
}

