import { useState, useEffect } from "react";
import type { SaborCardapio, PedidoPayload, PedidoOut, ItemPedidoPayload } from "../lib/types";
import { criarPedido } from "../lib/api";
import { REGIOES_DF } from "../lib/regioes";

interface Props {
  sabores: SaborCardapio[];
  datas: string[];
  saborPendente: string | null;
  onSaborPendenteConsumido: () => void;
  onPedidoCriado: (pedido: PedidoOut) => void;
}

interface ItemForm {
  sabor: string;
  quantidade: number;
  sub1: string;
  sub2: string;
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano} (sábado)`;
}

const itemVazio = (): ItemForm => ({ sabor: "", quantidade: 1, sub1: "", sub2: "" });

export default function FormPedido({
  sabores, datas, saborPendente, onSaborPendenteConsumido, onPedidoCriado,
}: Props) {
  const [nome, setNome] = useState("");
  const [paroquia, setParoquia] = useState("");
  const [regiao, setRegiao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([itemVazio()]);
  const [formaPagamento, setFormaPagamento] = useState<"pix" | "retirada">("pix");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoSabor, setAvisoSabor] = useState<string | null>(null);

  const saboresSimples = sabores.filter((s) => !s.meio_a_meio);

  useEffect(() => {
    if (!saborPendente) return;
    setItens((prev) => {
      const vazio = prev.findIndex((it) => !it.sabor);
      if (vazio !== -1) return prev.map((it, i) => i === vazio ? { ...it, sabor: saborPendente } : it);
      return [...prev, { ...itemVazio(), sabor: saborPendente }];
    });
    onSaborPendenteConsumido();
  }, [saborPendente, onSaborPendenteConsumido]);

  function atualizarItem(idx: number, campo: keyof ItemForm, valor: string | number) {
    if (campo === "sabor" && valor && valor !== "Meio-a-meio") {
      const duplicado = itens.some((it, i) => i !== idx && it.sabor === valor);
      if (duplicado) {
        setAvisoSabor(`"${valor}" já está no pedido — aumente a quantidade no item existente.`);
        setTimeout(() => setAvisoSabor(null), 5000);
        return;
      }
    }
    setItens((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const novo = { ...it, [campo]: valor };
        if (campo === "sabor" && valor !== "Meio-a-meio") { novo.sub1 = ""; novo.sub2 = ""; }
        return novo;
      })
    );
  }

  function calcularTotalLocal(): number {
    return itens.reduce((acc, it) => {
      const preco = sabores.find((s) => s.nome === it.sabor)?.preco ?? 0;
      return acc + preco * it.quantidade;
    }, 0);
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setErro(null);

    for (const it of itens) {
      if (!it.sabor) { setErro("Selecione um sabor para todos os itens."); return; }
      if (it.sabor === "Meio-a-meio" && (!it.sub1 || !it.sub2)) {
        setErro("Escolha os 2 sabores do Meio-a-meio."); return;
      }
      if (it.sabor === "Meio-a-meio" && it.sub1 === it.sub2) {
        setErro("Os dois sabores do Meio-a-meio precisam ser diferentes."); return;
      }
    }

    const payload: PedidoPayload = {
      nome_cliente: nome,
      paroquia,
      regiao_administrativa: regiao || undefined,
      telefone: telefone || undefined,
      data_retirada: data,
      forma_pagamento: formaPagamento,
      observacoes: observacoes || undefined,
      itens: itens.map((it): ItemPedidoPayload => ({
        sabor: it.sabor,
        quantidade: it.quantidade,
        ...(it.sabor === "Meio-a-meio" ? { meio_a_meio_sabores: [it.sub1, it.sub2] } : {}),
      })),
    };

    try {
      setEnviando(true);
      const pedido = await criarPedido(payload);
      onPedidoCriado(pedido);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErro(msg ?? "Erro ao enviar pedido. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section id="encomendar" className="relative py-20 px-6 bg-white">
      <div className="max-w-2xl mx-auto relative z-10">
        <h2
          className="text-3xl font-extrabold text-[#C60C30] text-center mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Fazer Pedido
        </h2>
        <p className="text-center text-gray-400 mb-10 text-sm">
          Pedidos aceitos até sexta-feira às 12h para o sábado seguinte
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados pessoais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Seu nome</label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone</label>
              <input type="tel" required value={telefone} onChange={(e) => setTelefone(e.target.value)}
                placeholder="(61) 99999-9999"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30]" />
            </div>
          </div>

          {/* Paróquia e Região */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Paróquia</label>
              <select required value={paroquia} onChange={(e) => setParoquia(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30] bg-white">
                <option value="">Selecione sua paróquia</option>
                <option value="Paróquia Nossa Senhora da Assunção">Paróquia Nossa Senhora da Assunção</option>
                <option value="Santuário Nossa Senhora do Perpétuo Socorro">Santuário Nossa Senhora do Perpétuo Socorro</option>
                <option value="Paróquia Nossa Senhora de Fátima">Paróquia Nossa Senhora de Fátima</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Região Administrativa <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <select value={regiao} onChange={(e) => setRegiao(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30] bg-white">
                <option value="">Selecione a RA</option>
                {REGIOES_DF.map((ra) => (
                  <option key={ra} value={ra}>{ra}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data de retirada</label>
            <select required value={data} onChange={(e) => setData(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30] bg-white">
              <option value="">Selecione um sábado disponível</option>
              {datas.map((d) => <option key={d} value={d}>{formatarData(d)}</option>)}
            </select>

          </div>

          {/* Itens */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">Pizzas</label>

            {avisoSabor && (
              <p className="text-sm text-azul bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-2">
                <span>ℹ️</span> {avisoSabor}
              </p>
            )}

            {itens.map((it, idx) => (
              <div key={idx} className="border border-gray-100 rounded-2xl p-4 bg-gray-50 space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <select required value={it.sabor} onChange={(e) => atualizarItem(idx, "sabor", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30] bg-white">
                      <option value="">Escolha o sabor</option>
                      {sabores.map((s) => (
                        <option key={s.nome} value={s.nome}>
                          {s.nome} — R$ {s.preco.toFixed(2).replace(".", ",")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button type="button" onClick={() => atualizarItem(idx, "quantidade", Math.max(1, it.quantidade - 1))}
                      className="px-3 py-2.5 text-gray-500 hover:bg-gray-100 transition">−</button>
                    <span className="px-3 text-sm font-semibold min-w-[2rem] text-center">{it.quantidade}</span>
                    <button type="button" onClick={() => atualizarItem(idx, "quantidade", it.quantidade + 1)}
                      className="px-3 py-2.5 text-gray-500 hover:bg-gray-100 transition">+</button>
                  </div>
                  {itens.length > 1 && (
                    <button type="button" onClick={() => setItens((p) => p.filter((_, i) => i !== idx))}
                      className="text-gray-300 hover:text-[#C60C30] transition mt-2.5" aria-label="Remover">✕</button>
                  )}
                </div>
                {it.sabor === "Meio-a-meio" && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {(["sub1", "sub2"] as const).map((campo, i) => (
                      <div key={campo}>
                        <label className="text-xs text-gray-400 mb-1 block">{i + 1}º sabor</label>
                        <select required value={it[campo]} onChange={(e) => atualizarItem(idx, campo, e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD100] bg-white">
                          <option value="">Escolha</option>
                          {saboresSimples.map((s) => <option key={s.nome} value={s.nome}>{s.nome}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setItens((p) => [...p, itemVazio()])}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-3 text-sm text-gray-400 hover:border-[#C60C30] hover:text-[#C60C30] transition">
              + Adicionar outra pizza
            </button>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Observações <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: retirar cebola da calabresa, alergia a azeitonas…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30] resize-none" />
          </div>

          {/* Forma de pagamento */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Forma de pagamento</label>
            <div className="grid grid-cols-2 gap-3">
              {(["pix", "retirada"] as const).map((forma) => (
                <button key={forma} type="button" onClick={() => setFormaPagamento(forma)}
                  className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 font-semibold text-sm transition
                    ${formaPagamento === forma
                      ? "border-[#0047A0] bg-[#0047A0]/5 text-[#0047A0]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  <span className="text-2xl">{forma === "pix" ? "📱" : "💵"}</span>
                  {forma === "pix" ? "Pagar via PIX" : "Pagar na retirada"}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          {itens.some((it) => it.sabor) && (
            <div className="flex items-center justify-between bg-[#0047A0]/5 rounded-2xl px-5 py-4">
              <span className="text-sm text-gray-600 font-medium">Total estimado</span>
              <span className="text-xl font-extrabold text-[#0047A0]">
                R$ {calcularTotalLocal().toFixed(2).replace(".", ",")}
              </span>
            </div>
          )}

          {erro && <p className="text-sm text-[#C60C30] bg-red-50 rounded-xl px-4 py-3">{erro}</p>}

          <button type="submit" disabled={enviando}
            className="w-full bg-[#C60C30] text-white font-bold py-4 rounded-2xl text-base hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
            {enviando ? "Enviando pedido…" : "Finalizar pedido →"}
          </button>
        </form>
      </div>
    </section>
  );
}
