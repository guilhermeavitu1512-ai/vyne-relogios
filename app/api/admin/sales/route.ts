import { requireAdmin } from "@/lib/server/auth";
import { isSameOrigin } from "@/lib/server/security";
import { createSale, listSales } from "@/lib/server/store";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  try {
    return Response.json({ sales: await listSales() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao carregar vendas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const auth = await requireAdmin(request, true);
  if ("response" in auth) return auth.response;
  try {
    const body = (await request.json()) as { items?: Array<{ productId?: unknown; quantity?: unknown }> };
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
      throw new Error("Inclua ao menos um produto na venda.");
    }
    const items = body.items.map((item) => {
      const productId = typeof item.productId === "string" ? item.productId : "";
      const quantity = Number(item.quantity);
      if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 999) {
        throw new Error("Item de venda inválido.");
      }
      return { productId, quantity };
    });
    return Response.json({ sale: await createSale(items) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao registrar venda." }, { status: 400 });
  }
}
