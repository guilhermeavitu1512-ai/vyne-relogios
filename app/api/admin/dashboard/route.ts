import { requireAdmin } from "@/lib/server/auth";
import { getDashboard } from "@/lib/server/store";

const periods = new Set(["today", "7d", "30d", "all"]);

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  try {
    const requested = new URL(request.url).searchParams.get("period") ?? "30d";
    const period = periods.has(requested) ? requested : "30d";
    return Response.json(await getDashboard(period), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao carregar o painel." }, { status: 500 });
  }
}
