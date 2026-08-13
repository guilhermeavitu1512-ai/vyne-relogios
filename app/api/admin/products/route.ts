import { requireAdmin } from "@/lib/server/auth";
import { isSameOrigin } from "@/lib/server/security";
import { createProduct, listProducts } from "@/lib/server/store";
import { parseProduct } from "@/app/api/admin/products/product-input";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  try {
    return Response.json({ products: await listProducts(true) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao carregar produtos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const auth = await requireAdmin(request, true);
  if ("response" in auth) return auth.response;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const product = await createProduct(parseProduct(body), auth.session.username);
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao criar produto." }, { status: 400 });
  }
}
