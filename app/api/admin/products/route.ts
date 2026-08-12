import { requireAdmin } from "@/lib/server/auth";
import { listProducts } from "@/lib/server/store";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  try {
    return Response.json({ products: await listProducts(true) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao carregar produtos." }, { status: 500 });
  }
}
