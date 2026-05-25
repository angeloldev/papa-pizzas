import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { estaLogado } = useAuth();
  if (!estaLogado) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
