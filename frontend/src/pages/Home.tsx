import { useState, useEffect, useCallback } from "react";
import type { SaborCardapio, PedidoOut } from "../lib/types";
import { getCardapio, getDatasDisponiveis, getAvisos } from "../lib/api";
import type { AvisosDatas } from "../lib/api";

import Header from "../components/Header";
import SobreNos from "../components/SobreNos";
import CardapioSection from "../components/CardapioSection";
import FormPedido from "../components/FormPedido";
import CheckoutPix from "../components/CheckoutPix";

import imgBaixo from "../assets/Imagem-12.png";

type Tela = "inicio" | "checkout";

export default function Home() {
  const [sabores, setSabores] = useState<SaborCardapio[]>([]);
  const [datas, setDatas] = useState<string[]>([]);
  const [avisos, setAvisos] = useState<AvisosDatas>({ bloqueadas: [] });
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [tela, setTela] = useState<Tela>("inicio");
  const [pedidoCriado, setPedidoCriado] = useState<PedidoOut | null>(null);
  const [saborPendente, setSaborPendente] = useState<string | null>(null);

  const carregarDatas = useCallback(async () => {
    const [d, a] = await Promise.all([getDatasDisponiveis(), getAvisos()]);
    setDatas(d);
    setAvisos(a);
  }, []);

  useEffect(() => {
    Promise.all([getCardapio(), getDatasDisponiveis(), getAvisos()])
      .then(([s, d, a]) => { setSabores(s); setDatas(d); setAvisos(a); })
      .catch(() => setErroCarga("Não foi possível conectar ao servidor. Verifique se o backend está rodando."))
      .finally(() => setCarregando(false));
  }, []);

  // Re-busca datas e avisos quando o usuário retorna à aba (admin pode ter bloqueado/aberto)
  useEffect(() => {
    window.addEventListener("focus", carregarDatas);
    return () => window.removeEventListener("focus", carregarDatas);
  }, [carregarDatas]);

  function handlePedidoCriado(pedido: PedidoOut) {
    setPedidoCriado(pedido);
    setTela("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNovoPedido() {
    setPedidoCriado(null);
    setTela("inicio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleSaborPendenteConsumido = useCallback(() => {
    setSaborPendente(null);
  }, []);

  if (tela === "checkout" && pedidoCriado) {
    return <CheckoutPix pedido={pedidoCriado} onNovoPedido={handleNovoPedido} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {carregando && (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          Carregando cardápio…
        </div>
      )}

      {erroCarga && (
        <div className="flex items-center justify-center h-64">
          <p className="text-[#C60C30] text-sm bg-red-50 rounded-xl px-6 py-4 max-w-md text-center">
            {erroCarga}
          </p>
        </div>
      )}

      {!carregando && !erroCarga && (
        <>
          <SobreNos />
          <CardapioSection
            sabores={sabores}
            onAdicionarSabor={setSaborPendente}
          />
          <FormPedido
            sabores={sabores}
            datas={datas}
            saborPendente={saborPendente}
            onSaborPendenteConsumido={handleSaborPendenteConsumido}
            onPedidoCriado={handlePedidoCriado}
          />

          {/* Avisos de datas bloqueadas (futuras) */}
          {avisos.bloqueadas
            .filter((b) => b.data >= new Date().toISOString().slice(0, 10))
            .map((b) => (
              <div key={b.data} className="max-w-2xl mx-auto px-6 pb-4">
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <div>
                    <strong>
                      {b.data.split("-").reverse().join("/")}
                    </strong>{" "}
                    está indisponível para pedidos.
                    {b.motivo && (
                      <span className="text-amber-700"> Motivo: {b.motivo}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </>
      )}

      {/* Papa espiando pela base — fora de qualquer overflow-hidden */}
      <div className="relative bg-white flex justify-center overflow-hidden h-36">
        <img
          src={imgBaixo}
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 w-44 md:w-56 pointer-events-none select-none"
        />
      </div>

      <footer className="bg-gray-50 border-t border-gray-100 text-center py-6 text-xs text-gray-400">
        © 2026 Papa Pizzas · Brasília - DF
      </footer>
    </div>
  );
}
