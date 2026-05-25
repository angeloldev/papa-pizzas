import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/logo_papa_pizzas.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await login(email, senha);
      navigate("/admin");
    } catch {
      setErro("E-mail ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logo} alt="Papa Pizzas" className="h-16 mx-auto mb-4" />
          <h1
            className="text-2xl font-extrabold text-[#C60C30]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Painel do Papa
          </h1>
          <p className="text-sm text-gray-400 mt-1">Acesso restrito à equipe</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@papapizzas.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
            <input
              type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C60C30]"
            />
          </div>

          {erro && (
            <p className="text-sm text-[#C60C30] bg-red-50 rounded-xl px-4 py-3">{erro}</p>
          )}

          <button
            type="submit" disabled={carregando}
            className="w-full bg-[#C60C30] text-white font-bold py-3.5 rounded-2xl hover:bg-red-700 transition disabled:opacity-60"
          >
            {carregando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-gray-300">
          <a href="/" className="hover:text-[#C60C30] transition">← Voltar ao site</a>
        </p>
      </div>
    </div>
  );
}
