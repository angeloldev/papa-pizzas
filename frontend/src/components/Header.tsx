import logo from "../assets/logo_papa_pizzas.png";

export default function Header() {
  return (
    <header className="bg-[#C60C30] shadow-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-2 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <img src={logo} alt="Papa Pizzas" className="h-12 w-auto" />
        </a>
        <nav className="hidden sm:flex gap-6 text-white text-sm font-semibold">
          <a href="#sobre"      className="hover:text-[#FFD100] transition-colors">Sobre</a>
          <a href="#cardapio"   className="hover:text-[#FFD100] transition-colors">Cardápio</a>
          <a href="#encomendar" className="hover:text-[#FFD100] transition-colors">Encomendar</a>
        </nav>
      </div>
    </header>
  );
}
