import { useState } from "react";
import type { PedidoOut } from "../lib/types";

interface Props {
  pedido: PedidoOut;
  onNovoPedido: () => void;
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

const PASSOS_PIX = [
  { icon: "📱", texto: "Copie o código PIX abaixo ou escaneie o QR Code" },
  { icon: "🏦", texto: "Abra o app do seu banco e cole o código no campo Pix Copia e Cola" },
  { icon: "✅", texto: "Confirme o pagamento e baixe o comprovante" },
  { icon: "💬", texto: 'Clique em "Enviar comprovante" e anexe a imagem na conversa do WhatsApp' },
];

export default function CheckoutPix({ pedido, onNovoPedido }: Props) {
  const [copiado, setCopiado] = useState(false);
  const ehPix = pedido.forma_pagamento === "pix";

  async function copiarPix() {
    if (!pedido.pix_payload) return;
    await navigator.clipboard.writeText(pedido.pix_payload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  function abrirWhatsApp() {
    const numero = import.meta.env.VITE_WHATSAPP_NUMBER ?? "";
    const linhas = [
      `Olá! Sou *${pedido.nome_cliente}* e acabei de fazer o pedido *${pedido.numero_pedido}*.`,
      `📅 Retirada: ${formatarData(pedido.data_retirada)}`,
      `💰 Valor: R$ ${pedido.valor_total.toFixed(2).replace(".", ",")}`,
      pedido.telefone ? `📞 Meu telefone: ${pedido.telefone}` : "",
      "",
      ehPix ? `Segue o comprovante de pagamento! 🍕` : `Vou pagar na retirada. 🍕`,
    ].filter(Boolean);
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(linhas.join("\n"))}`, "_blank");
  }

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full space-y-4">

        {/* Cabeçalho */}
        <div className="text-center mb-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✅
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-1"
            style={{ fontFamily: "var(--font-display)" }}>
            Pedido registrado!
          </h2>
          <p className="text-gray-400 text-sm">
            Pedido <strong className="text-gray-600">{pedido.numero_pedido}</strong> · Retirada em {formatarData(pedido.data_retirada)}
          </p>
        </div>

        {/* Card principal — PIX ou Retirada */}
        {ehPix ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-semibold text-gray-500 mb-1">Total a pagar</p>
            <p className="text-4xl font-extrabold text-[#0047A0] mb-6">
              R$ {pedido.valor_total.toFixed(2).replace(".", ",")}
            </p>

            {/* QR Code */}
            {pedido.pix_qrcode_base64 && (
              <div className="flex justify-center mb-5">
                <div className="p-3 bg-white border border-gray-200 rounded-2xl inline-block">
                  <img
                    src={`data:image/png;base64,${pedido.pix_qrcode_base64}`}
                    alt="QR Code PIX"
                    className="w-44 h-44"
                  />
                </div>
              </div>
            )}

            <button
              onClick={copiarPix}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition ${
                copiado ? "bg-green-500 text-white" : "bg-[#FFD100] text-[#0047A0] hover:brightness-95"
              }`}
            >
              {copiado ? "✓ Código copiado!" : "📋 Copiar código PIX"}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-5xl mb-3">💵</div>
            <p className="font-bold text-gray-800 text-lg mb-1">Pagamento na retirada</p>
            <p className="text-gray-500 text-sm">
              Separe <strong className="text-[#0047A0]">R$ {pedido.valor_total.toFixed(2).replace(".", ",")}</strong> para pagar no dia da retirada, no sábado {formatarData(pedido.data_retirada)}.
            </p>
          </div>
        )}

        {/* Passo a passo (só para PIX) */}
        {ehPix && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-600 mb-4">Como pagar e enviar o comprovante</p>
            <ol className="space-y-3">
              {PASSOS_PIX.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0047A0]/10 text-[#0047A0] text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex items-start gap-2 pt-0.5">
                    <span>{p.icon}</span>
                    <span className="text-sm text-gray-600">{p.texto}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Botão WhatsApp */}
        <button
          onClick={abrirWhatsApp}
          className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-green-600 transition text-base"
        >
          <span className="text-xl">📱</span>
          {ehPix ? "Já paguei! Enviar comprovante" : "Confirmar pedido no WhatsApp"}
        </button>

        {/* Resumo do pedido */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-600 mb-3">Resumo do pedido</p>
          <ul className="space-y-1.5">
            {pedido.itens.map((it, i) => (
              <li key={i} className="flex justify-between text-sm text-gray-600">
                <span>
                  {it.sabor}
                  {it.meio_a_meio_sabores && (
                    <span className="text-gray-400 text-xs"> ({it.meio_a_meio_sabores.join(" + ")})</span>
                  )}
                  {" "}× {it.quantidade}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={onNovoPedido}
          className="w-full text-center text-sm text-gray-400 hover:text-[#C60C30] transition py-2">
          Fazer outro pedido
        </button>
      </div>
    </section>
  );
}
