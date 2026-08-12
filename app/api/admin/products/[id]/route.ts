import { requireAdmin } from "@/lib/server/auth";
import { isSameOrigin } from "@/lib/server/security";
import { updateProduct, type ProductUpdate } from "@/lib/server/store";

function nonNegativeMoney(value: unknown, nullable = false) {
  if (nullable && (value === null || value === "" || value === undefined)) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error("Preço inválido.");
  return Math.round(number * 100);
}

function parseProduct(body: Record<string, unknown>): ProductUpdate {
  const required = ["name", "brand", "description", "imageUrl", "category"] as const;
  for (const field of required) {
    if (typeof body[field] !== "string" || !body[field].trim()) {
      throw new Error(`O campo ${field} é obrigatório.`);
    }
  }
  const stock = Number(body.stock);
  if (!Number.isSafeInteger(stock) || stock < 0) throw new Error("Estoque inválido.");
  const specs = Array.isArray(body.specs)
    ? body.specs.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 12)
    : [];
  const imageUrl = String(body.imageUrl).trim();
  if (!imageUrl.startsWith("https://images.unsplash.com/") && !imageUrl.startsWith("/api/product-images/products/")) {
    throw new Error("URL da imagem inválida.");
  }

  return {
    name: String(body.name).trim().slice(0, 120),
    brand: String(body.brand).trim().toUpperCase().slice(0, 60),
    description: String(body.description).trim().slice(0, 1200),
    priceCents: nonNegativeMoney(body.price) ?? 0,
    promotionalPriceCents: nonNegativeMoney(body.promotionalPrice, true),
    imageUrl,
    stock,
    category: String(body.category).trim().slice(0, 80),
    tag: typeof body.tag === "string" ? body.tag.trim().slice(0, 100) : "",
    specs,
    featured: body.featured === true,
    recommended: body.recommended === true,
    active: body.active === true,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const auth = await requireAdmin(request, true);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const product = await updateProduct(id, parseProduct(body), auth.session.username);
    if (!product) return Response.json({ error: "Produto não encontrado." }, { status: 404 });
    return Response.json({ product });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao salvar produto." }, { status: 400 });
  }
}
