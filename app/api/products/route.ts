import { listProducts } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await listProducts(false);
    return Response.json({ products }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Catálogo temporariamente indisponível." }, { status: 503 });
  }
}
