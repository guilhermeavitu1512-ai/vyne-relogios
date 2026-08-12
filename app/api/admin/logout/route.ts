import { clearAdminSessionCookie, requireAdmin } from "@/lib/server/auth";
import { isSameOrigin } from "@/lib/server/security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const auth = await requireAdmin(request, true);
  if ("response" in auth) return auth.response;
  return Response.json(
    { success: true },
    { headers: { "Set-Cookie": clearAdminSessionCookie(request), "Cache-Control": "no-store" } },
  );
}
