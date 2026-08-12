import { requireAdmin } from "@/lib/server/auth";
import { isSameOrigin } from "@/lib/server/security";
import { updateSaleStatus, type SaleStatus } from "@/lib/server/store";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const auth = await requireAdmin(request, true);
  if ("response" in auth) return auth.response;
  try {
    const body = (await request.json()) as { status?: SaleStatus };
    if (body.status !== "CONFIRMED" && body.status !== "CANCELED") {
      throw new Error("Status inválido.");
    }
    const { id } = await context.params;
    return Response.json({ sale: await updateSaleStatus(id, body.status, auth.session.username) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao atualizar venda." }, { status: 400 });
  }
}
