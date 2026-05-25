import { useState } from "react";
import imgEsquerda from "../assets/Imagem_11.png";
import type { SaborCardapio } from "../lib/types";

interface Props {
  sabores: SaborCardapio[];
  onAdicionarSabor: (nome: string) => void;
}

export default function CardapioSection({ sabores, onAdicionarSabor }: Props) {
  const [expandido, setExpandido] = useState<string | null>(null);

  function handleCard(nome: string) {
    setExpandido((prev) => (prev === nome ? null : nome));
  }

  function handleAdicionar(e: React.MouseEvent, nome: string) {
    e.stopPropagation();
    onAdicionarSabor(nome);
    document.getElementById("encomendar")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section id="cardapio" className="relative overflow-hidden py-20 px-6 bg-gray-50">
      <img
        src={imgEsquerda}
        alt=""
        aria-hidden="true"
        className="absolute left-0 bottom-0 w-40 md:w-56 lg:w-64 -translate-x-1/4 pointer-events-none select-none"
      />

      <div className="max-w-5xl mx-auto relative">
        <h2
          className="text-3xl font-extrabold text-[#C60C30] text-center mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Nosso Cardápio
        </h2>
        <p className="text-center text-gray-500 mb-10 text-sm">
          Pizzas de 8 pedaços · Retirada aos sábados, após Eucaristias e Missas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sabores.map((s) => {
            const aberto = expandido === s.nome;
            return (
              <div
                key={s.nome}
                onClick={() => handleCard(s.nome)}
                className={`bg-white rounded-2xl border shadow-sm cursor-pointer transition-all duration-200 overflow-hidden
                  ${aberto ? "border-[#C60C30] shadow-md" : "border-gray-100 hover:shadow-md"}`}
              >
                {/* Cabeçalho do card */}
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{s.meio_a_meio ? "🍕🍕" : "🍕"}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{s.nome}</p>
                      {s.meio_a_meio && (
                        <p className="text-xs text-gray-400">Escolha 2 sabores</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0047A0] text-lg">
                      R$ {s.preco.toFixed(2).replace(".", ",")}
                    </span>
                    <span className={`text-gray-400 text-sm transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Painel expansível */}
                {aberto && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {s.ingredientes}
                    </p>
                    <button
                      onClick={(e) => handleAdicionar(e, s.nome)}
                      className="w-full bg-[#C60C30] text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-700 transition"
                    >
                      + Adicionar ao pedido
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
