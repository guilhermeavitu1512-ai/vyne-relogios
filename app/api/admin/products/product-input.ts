import type { ProductUpdate } from "@/lib/server/store";
import { isSupabaseProductImageUrl } from "@/lib/server/supabase";

function nonNegativeMoney(value: unknown, nullable = false) {
  if (nullable && (value === null || value === "" || value === undefined)) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error("Preço inválido.");
  return Math.round(number * 100);
}

export function parseProduct(body: Record<string, unknown>): ProductUpdate {
  const required = ["name", "model", "brand", "description", "imageUrl"] as const;
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
  const allowedImage =
    imageUrl.startsWith("https://images.unsplash.com/") ||
    imageUrl.startsWith("/api/product-images/products/") ||
    imageUrl.startsWith("/media/products/") ||
    isSupabaseProductImageUrl(imageUrl);
  if (!allowedImage) throw new Error("URL da imagem inválida.");

  return {
    name: String(body.name).trim().slice(0, 120),
    model: String(body.model).trim().slice(0, 120),
    brand: String(body.brand).trim().toUpperCase().slice(0, 60),
    description: String(body.description).trim().slice(0, 1200),
    priceCents: nonNegativeMoney(body.price) ?? 0,
    promotionalPriceCents: nonNegativeMoney(body.promotionalPrice, true),
    imageUrl,
    stock,
    category: typeof body.category === "string" && body.category.trim()
      ? body.category.trim().slice(0, 80)
      : "Relógios",
    tag: typeof body.tag === "string" ? body.tag.trim().slice(0, 100) : "",
    specs,
    featured: body.featured === true,
    recommended: body.recommended === true,
    active: body.active === true,
  };
}
