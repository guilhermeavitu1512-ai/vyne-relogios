import { adminSessionCookie, createAdminSession, validateAdminCredentials } from "@/lib/server/auth";
import { isSameOrigin } from "@/lib/server/security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Origem da solicitação inválida." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) {
      return Response.json({ error: "Informe usuário e senha." }, { status: 400 });
    }
    if (!(await validateAdminCredentials(username, password))) {
      return Response.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
    }

    const { token, session } = await createAdminSession(username);
    return Response.json(
      { user: { username: session.username }, csrfToken: session.csrfToken },
      { headers: { "Set-Cookie": adminSessionCookie(token, request), "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível entrar.";
    return Response.json({ error: message }, { status: 503 });
  }
}
