import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  getPedidosAdmin,
  atualizarStatus,
  deletarPedido,
  getConsolidacao,
  getFaturamento,
  getDatasBoqueadas,
  bloquearData,
  desbloquearData,
  getDatasDisponiveis,
  type PedidoAdmin,
} from "../../lib/api";
import type { ConsolidacaoOut, FaturamentoOut } from "../../lib/types";

const STATUS_LABELS: Record<string, string> = {
  aguardando_pagamento: "Aguardando",
  confirmado: "Confirmado",
  entregue: "Entregue",
};
const STATUS_COR: Record<string, string> = {
  aguardando_pagamento: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-blue-100 text-blue-700",
  entregue: "bg-green-100 text-green-700",
};
const TODOS_STATUS = [
  "aguardando_pagamento",
  "confirmado",
  "entregue",
] as const;

function fmt(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

type Aba = "pedidos" | "insumos" | "faturamento" | "datas";

export default function Painel() {
  const { nome, logout } = useAuth();
  const navigate = useNavigate();

  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [consolidacao, setConsolidacao] = useState<ConsolidacaoOut | null>(null);
  const [faturamento, setFaturamento] = useState<FaturamentoOut | null>(null);
  const [custo, setCusto] = useState("");
  const [datasBloquedas, setDatasBloquedas] = useState<{ data: string; motivo: string }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>("pedidos");

  // Datas
  const [novaDataBloquear, setNovaDataBloquear] = useState("");
  const [motivoBloqueio, setMotivoBloqueio] = useState("");

  // Pedido em edição de status
  const [editandoStatus, setEditandoStatus] = useState<number | null>(null);
  const [confirmandoDelete, setConfirmandoDelete] = useState<number | null>(null);
  const [expandido, setExpandido] = useState<number | null>(null);

  const carregarDatasAdmin = useCallback(async () => {
    const [db, disponiveis] = await Promise.all([
      getDatasBoqueadas(),
      getDatasDisponiveis(),
    ]);
    setDatasBloquedas(db);
    setDatasDisponiveis(disponiveis);
    setDataSelecionada((prev) => prev || disponiveis[0] || "");
  }, []);

  const carregar = useCallback(async () => {
    if (!dataSelecionada) return;
    setCarregando(true);
    try {
      const [p, c, f] = await Promise.all([
        getPedidosAdmin(dataSelecionada),
        getConsolidacao(dataSelecionada),
        getFaturamento(dataSelecionada),
      ]);
      setPedidos(p);
      setConsolidacao(c);
      setFaturamento(f);
    } finally {
      setCarregando(false);
    }
  }, [dataSelecionada]);

  useEffect(() => { carregarDatasAdmin(); }, [carregarDatasAdmin]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleAtualizarStatus(
    pedido: PedidoAdmin,
    novoStatus: string,
  ) {
    const atualizado = await atualizarStatus(pedido.id, novoStatus);
    setPedidos((prev) =>
      prev.map((p) => (p.id === atualizado.id ? atualizado : p)),
    );
    setEditandoStatus(null);
    const [c, f] = await Promise.all([
      getConsolidacao(dataSelecionada),
      getFaturamento(dataSelecionada),
    ]);
    setConsolidacao(c);
    setFaturamento(f);
  }

  async function handleDeletar(id: number) {
    await deletarPedido(id);
    setPedidos((prev) => prev.filter((p) => p.id !== id));
    setConfirmandoDelete(null);
    const [c, f] = await Promise.all([
      getConsolidacao(dataSelecionada),
      getFaturamento(dataSelecionada),
    ]);
    setConsolidacao(c);
    setFaturamento(f);
  }

  async function handleBloquear() {
    if (!novaDataBloquear) return;
    await bloquearData(novaDataBloquear, motivoBloqueio || undefined);
    setNovaDataBloquear("");
    setMotivoBloqueio("");
    carregarDatasAdmin();
  }

  async function handleDesbloquear(data: string) {
    await desbloquearData(data);
    carregarDatasAdmin();
  }


  const lucro =
    faturamento && custo
      ? faturamento.faturamento_bruto - parseFloat(custo.replace(",", "."))
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#C60C30] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1
            className="font-extrabold text-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            🍕 Painel do Papa
          </h1>
          <p className="text-red-200 text-xs">Olá, {nome}</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/admin/login");
          }}
          className="text-xs text-red-200 hover:text-white transition border border-red-400 rounded-lg px-3 py-1.5"
        >
          Sair
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Seletor de sábado */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Sábado:</span>
          <div className="flex flex-wrap gap-2">
            {datasDisponiveis.map((d) => (
              <button
                key={d}
                onClick={() => setDataSelecionada(d)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
                  dataSelecionada === d
                    ? "bg-[#C60C30] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#C60C30]"
                }`}
              >
                {fmt(d)}
              </button>
            ))}
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-gray-100 w-fit flex-wrap">
          {(
            [
              ["pedidos", "Pedidos"],
              ["insumos", "Produção"],
              ["faturamento", "Faturamento"],
              ["datas", "Datas"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                aba === id
                  ? "bg-[#C60C30] text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {carregando ? (
          <p className="text-sm text-gray-400">Carregando…</p>
        ) : (
          <>
            {/* ── ABA PEDIDOS ── */}
            {aba === "pedidos" && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                {pedidos.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-12">
                    Nenhum pedido para {fmt(dataSelecionada)}.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["", "Pedido", "Cliente", "Paróquia / RA", "Pgto", "Valor", "Status", ""].map((h, i) => (
                          <th key={i} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pedidos.map((p) => (
                        <>
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            {/* Botão expandir */}
                            <td className="px-3 py-3">
                              <button
                                onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                                className="text-gray-400 hover:text-vermelho transition text-base leading-none w-5 text-center"
                                aria-label="Expandir"
                              >
                                {expandido === p.id ? "▾" : "▸"}
                              </button>
                            </td>
                            <td className="px-3 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">
                              {p.numero_pedido}
                            </td>
                            <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">
                              {p.nome_cliente}
                            </td>
                            <td className="px-3 py-3 text-gray-500 text-xs">
                              {p.paroquia}
                              {p.regiao_administrativa && (
                                <span className="block text-gray-400">{p.regiao_administrativa}</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-gray-500 text-xs uppercase">
                              {p.forma_pagamento === "pix" ? "PIX" : "Retirada"}
                            </td>
                            <td className="px-3 py-3 font-semibold text-azul whitespace-nowrap">
                              R$ {p.valor_total.toFixed(2).replace(".", ",")}
                            </td>

                            {/* Status inline */}
                            <td className="px-3 py-3">
                              {editandoStatus === p.id ? (
                                <select autoFocus defaultValue={p.status}
                                  onChange={(e) => handleAtualizarStatus(p, e.target.value)}
                                  onBlur={() => setEditandoStatus(null)}
                                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-vermelho"
                                >
                                  {TODOS_STATUS.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                  ))}
                                </select>
                              ) : (
                                <button onClick={() => setEditandoStatus(p.id)}
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${STATUS_COR[p.status]}`}
                                >
                                  {STATUS_LABELS[p.status]} ✎
                                </button>
                              )}
                            </td>

                            {/* Deletar */}
                            <td className="px-3 py-3">
                              {confirmandoDelete === p.id ? (
                                <div className="flex gap-1">
                                  <button onClick={() => handleDeletar(p.id)}
                                    className="text-xs text-white bg-vermelho px-2 py-1 rounded-lg">Sim</button>
                                  <button onClick={() => setConfirmandoDelete(null)}
                                    className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg">Não</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmandoDelete(p.id)}
                                  className="text-gray-300 hover:text-vermelho transition text-lg leading-none">🗑</button>
                              )}
                            </td>
                          </tr>

                          {/* Linha expandida */}
                          {expandido === p.id && (
                            <tr key={`${p.id}-detail`} className="bg-gray-50/80">
                              <td colSpan={8} className="px-6 py-4">
                                <div className="flex flex-wrap gap-6 text-sm">
                                  {/* Itens */}
                                  <div className="flex-1 min-w-40">
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Pizzas</p>
                                    <ul className="space-y-1">
                                      {p.itens.map((it, i) => (
                                        <li key={i} className="text-gray-700">
                                          <span className="font-semibold">{it.quantidade}×</span>{" "}
                                          {it.sabor}
                                          {it.meio_a_meio_sabores && (
                                            <span className="text-gray-400 text-xs"> ({it.meio_a_meio_sabores.join(" + ")})</span>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Telefone */}
                                  <div className="min-w-35">
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Telefone</p>
                                    <p className="text-gray-700">{p.telefone ?? <span className="text-gray-400 italic">não informado</span>}</p>
                                  </div>

                                  {/* Observações */}
                                  {p.observacoes && (
                                    <div className="flex-1 min-w-50">
                                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Observações</p>
                                      <p className="text-gray-700">{p.observacoes}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── ABA PRODUÇÃO ── */}
            {aba === "insumos" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-700">
                      O que fazer em {fmt(dataSelecionada)}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Apenas pedidos Confirmados e Entregues.
                    </p>
                  </div>
                  {consolidacao && consolidacao.total_pizzas > 0 && (
                    <span className="bg-[#0047A0] text-white text-sm font-bold px-4 py-2 rounded-xl">
                      {consolidacao.total_pizzas} pizzas
                    </span>
                  )}
                </div>

                {!consolidacao || consolidacao.itens.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Nenhum pedido confirmado para esta data.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {consolidacao.itens.map((it, i) => (
                      <li
                        key={i}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                          it.tipo === "meio_a_meio"
                            ? "bg-[#FFD100]/10"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {it.tipo === "meio_a_meio" ? "🍕🍕" : "🍕"}
                          </span>
                          <div>
                            <p className="font-medium text-gray-700">
                              {it.descricao}
                            </p>
                            {it.tipo === "meio_a_meio" && (
                              <p className="text-xs text-gray-400">
                                Meio-a-meio
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-extrabold text-[#0047A0] text-xl">
                          {it.quantidade}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── ABA FATURAMENTO ── */}
            {aba === "faturamento" && (
              <div className="space-y-4">
                {/* Cards de resumo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                      Pedidos confirmados
                    </p>
                    <p className="text-3xl font-extrabold text-gray-800">
                      {faturamento?.total_pedidos ?? 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                      Pizzas vendidas
                    </p>
                    <p className="text-3xl font-extrabold text-gray-800">
                      {faturamento?.total_pizzas ?? 0}
                    </p>
                  </div>
                  <div className="bg-[#0047A0] rounded-2xl p-5 text-center">
                    <p className="text-xs font-semibold text-blue-200 uppercase mb-1">
                      Faturamento bruto
                    </p>
                    <p className="text-3xl font-extrabold text-white">
                      R${" "}
                      {faturamento?.faturamento_bruto
                        .toFixed(2)
                        .replace(".", ",") ?? "0,00"}
                    </p>
                  </div>
                </div>

                {/* Cálculo de lucro */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-700 mb-4">
                    Fluxo de caixa
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Custo total do fim de semana (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={custo}
                        onChange={(e) => setCusto(e.target.value)}
                        placeholder="0,00"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30]"
                      />
                    </div>
                  </div>

                  {lucro !== null && !isNaN(lucro) && (
                    <div
                      className={`rounded-2xl p-5 flex items-center justify-between ${
                        lucro >= 0 ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          Resultado do fim de semana
                        </p>
                        <p className="text-xs text-gray-400">
                          R$ {faturamento?.faturamento_bruto.toFixed(2)} − R${" "}
                          {parseFloat(custo.replace(",", ".")).toFixed(2)}
                        </p>
                      </div>
                      <p
                        className={`text-3xl font-extrabold ${lucro >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {lucro >= 0 ? "+" : ""}R${" "}
                        {lucro.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ABA DATAS ── */}
            {aba === "datas" && (
              <div className="space-y-4">
                {/* Bloquear data */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-700 mb-1">
                    🔒 Bloquear data
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    A data bloqueada não aparece no calendário para os clientes.
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <input
                      type="date"
                      value={novaDataBloquear}
                      onChange={(e) => setNovaDataBloquear(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30]"
                    />
                    <input
                      type="text"
                      placeholder="Motivo (opcional)"
                      value={motivoBloqueio}
                      onChange={(e) => setMotivoBloqueio(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30]"
                    />
                    <button
                      onClick={handleBloquear}
                      className="bg-gray-800 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-black transition"
                    >
                      Bloquear
                    </button>
                  </div>
                  {datasBloquedas.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {datasBloquedas.map((d) => (
                        <li
                          key={d.data}
                          className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                        >
                          <div>
                            <span className="font-semibold text-gray-700">
                              {fmt(d.data)}
                            </span>
                            <span className="text-gray-400 text-xs ml-2">
                              — {d.motivo}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDesbloquear(d.data)}
                            className="text-xs text-[#C60C30] hover:underline font-semibold"
                          >
                            Desbloquear
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {datasBloquedas.length === 0 && (
                    <p className="text-sm text-gray-400 mt-4">
                      Nenhuma data bloqueada.
                    </p>
                  )}
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
