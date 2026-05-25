import imgDireita from "../assets/imagem_15.png";

export default function SobreNos() {
  return (
    <section id="sobre" className="relative overflow-hidden bg-[#0047A0] text-white py-20 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <h2
            className="text-4xl font-extrabold mb-4 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pizza com propósito
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed max-w-lg">
            O projeto <strong className="text-[#FFD100]">Papa Pizzas</strong> nasce da JMJ — Jornada Mundial da Juventude — com o objetivo de unir jovens católicos espalhados pelo globo. Cada pizza encomendada
            sustenta nossas missões e fortalece nossas paróquias.
          </p>
          <a
            href="#encomendar"
            className="mt-8 inline-block bg-[#FFD100] text-[#0047A0] font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all"
          >
            Fazer meu pedido
          </a>
        </div>
      </div>

      {/* Papa espiando pela lateral direita */}
      <img
        src={imgDireita}
        alt=""
        aria-hidden="true"
        className="absolute right-0 bottom-0 w-48 md:w-64 lg:w-72 translate-x-1/4 pointer-events-none select-none"
      />
    </section>
  );
}
