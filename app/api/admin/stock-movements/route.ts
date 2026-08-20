import { requireAdmin } from "@/lib/server/auth";
import { isSameOrigin } from "@/lib/server/security";
import { addStockMovement, listStockMovements, type StockMovementType } from "@/lib/server/store";

const allowedTypes = new Set<StockMovementType>(["ENTRY", "MANUAL_ADJUSTMENT", "RETURN"]);

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  try {
    return Response.json({ movements: await listStockMovements() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin/stock-movements] Falha ao carregar movimentações", error);
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao carregar movimentações." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const auth = await requireAdmin(request, true);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const type = String(body.type) as StockMovementType;
    const quantity = Number(body.quantity);
    if (!allowedTypes.has(type)) throw new Error("Tipo de movimentação inválido.");
    if (!Number.isSafeInteger(quantity) || quantity === 0) throw new Error("Informe uma quantidade inteira diferente de zero.");
    if ((type === "ENTRY" || type === "RETURN") && quantity < 0) throw new Error("Entradas e devoluções devem ser positivas.");
    const productId = typeof body.productId === "string" ? body.productId : "";
    if (!productId) throw new Error("Selecione um produto.");
    const product = await addStockMovement({
      productId,
      type: type as "ENTRY" | "MANUAL_ADJUSTMENT" | "RETURN",
      quantity,
      responsible: auth.session.username,
      note: typeof body.note === "string" ? body.note.trim().slice(0, 300) : "",
    });
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao registrar movimentação." }, { status: 400 });
  }
}
