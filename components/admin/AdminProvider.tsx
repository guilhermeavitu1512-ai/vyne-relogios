"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

type AdminContextValue = {
  username: string;
  request: <T>(url: string, init?: RequestInit) => Promise<T>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("AdminProvider ausente.");
  return value;
}

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/estoque", label: "Estoque" },
  { href: "/admin/vendas", label: "Vendas" },
];

export default function AdminProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<{ username: string; csrfToken: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/session", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { user: { username: string }; csrfToken: string };
      setSession({ username: payload.user.username, csrfToken: payload.csrfToken });
    } catch {
      setSession(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void checkSession(), 0);
    return () => window.clearTimeout(timer);
  }, [checkSession]);

  const request = useCallback(
    async <T,>(url: string, init: RequestInit = {}) => {
      if (!session) throw new Error("Sessão expirada.");
      const headers = new Headers(init.headers);
      if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
      if ((init.method ?? "GET").toUpperCase() !== "GET") headers.set("x-csrf-token", session.csrfToken);
      const response = await fetch(url, { ...init, headers, cache: "no-store", credentials: "same-origin" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
      if (response.status === 401) {
        setSession(null);
        throw new Error("Sua sessão expirou. Entre novamente.");
      }
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível concluir a operação.");
      return payload;
    },
    [session],
  );

  const contextValue = useMemo(
    () => (session ? { username: session.username, request } : null),
    [request, session],
  );

  const logout = async () => {
    if (!session) return;
    try {
      await request<{ success: boolean }>("/api/admin/logout", { method: "POST" });
    } finally {
      setSession(null);
      router.replace("/admin");
    }
  };

  if (checking) {
    return <main className="admin-loading" aria-live="polite"><span />Validando acesso seguro…</main>;
  }

  if (!session || !contextValue) {
    return <AdminLogin onAuthenticated={setSession} />;
  }

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="admin-app">
        <header className="admin-mobile-header">
          <Link href="/admin" className="admin-wordmark" aria-label="VYNE Admin">VYNE<span>ADMIN</span></Link>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>
            {menuOpen ? "Fechar" : "Menu"}
          </button>
        </header>
        <aside className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
          <Link href="/admin" className="admin-wordmark" onClick={() => setMenuOpen(false)}>VYNE<span>ADMIN</span></Link>
          <nav aria-label="Navegação administrativa">
            {navigation.map((item) => {
              const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}>{item.label}</Link>;
            })}
          </nav>
          <div className="admin-sidebar-footer">
            <span>Conectado como</span>
            <strong>{session.username}</strong>
            <button type="button" onClick={logout}>Sair com segurança</button>
            <Link href="/">Ver loja pública ↗</Link>
          </div>
        </aside>
        {menuOpen && <button className="admin-menu-backdrop" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
        <main id="conteudo" className="admin-content">{children}</main>
      </div>
    </AdminContext.Provider>
  );
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: (session: { username: string; csrfToken: string }) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const payload = (await response.json()) as { error?: string; user?: { username: string }; csrfToken?: string };
      if (!response.ok || !payload.user || !payload.csrfToken) throw new Error(payload.error ?? "Acesso não autorizado.");
      onAuthenticated({ username: payload.user.username, csrfToken: payload.csrfToken });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-login">
      <section aria-labelledby="admin-login-title">
        <div className="admin-login-mark">VYNE</div>
        <span>Painel administrativo</span>
        <h1 id="admin-login-title">ACESSO RESTRITO.</h1>
        <p>Gerencie catálogo, estoque e vendas em uma área protegida.</p>
        <form onSubmit={submit}>
          <label htmlFor="admin-username">Usuário<input id="admin-username" name="username" type="text" inputMode="text" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" enterKeyHint="next" autoFocus required /></label>
          <label htmlFor="admin-password">Senha<input id="admin-password" name="password" type="password" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="current-password" enterKeyHint="go" required /></label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>{submitting ? "Verificando…" : "Entrar"}</button>
        </form>
        <Link href="/">← Voltar para a loja</Link>
      </section>
    </main>
  );
}
