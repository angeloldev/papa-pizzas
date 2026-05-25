import { useState, useCallback } from "react";
import { login as apiLogin } from "../lib/api";

interface AuthState {
  token: string | null;
  nome: string | null;
}

function lerStorage(): AuthState {
  return {
    token: localStorage.getItem("papa_token"),
    nome: localStorage.getItem("papa_admin_nome"),
  };
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(lerStorage);

  const login = useCallback(async (email: string, senha: string) => {
    const { access_token, nome } = await apiLogin(email, senha);
    localStorage.setItem("papa_token", access_token);
    localStorage.setItem("papa_admin_nome", nome);
    setAuth({ token: access_token, nome });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("papa_token");
    localStorage.removeItem("papa_admin_nome");
    setAuth({ token: null, nome: null });
  }, []);

  return {
    token: auth.token,
    nome: auth.nome,
    estaLogado: !!auth.token,
    login,
    logout,
  };
}
