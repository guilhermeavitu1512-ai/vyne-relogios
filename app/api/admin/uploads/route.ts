import { getProductImagesBucket } from "@/db/runtime";
import { requireAdmin } from "@/lib/server/auth";
import { isSameOrigin } from "@/lib/server/security";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const auth = await requireAdmin(request, true);
  if ("response" in auth) return auth.response;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("Selecione uma imagem.");
    const extension = allowedTypes.get(file.type);
    if (!extension) throw new Error("Use uma imagem JPG, PNG ou WebP.");
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new Error("A imagem deve ter no máximo 5 MB.");

    const key = `products/${crypto.randomUUID()}.${extension}`;
    await getProductImagesBucket().put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { uploadedBy: auth.session.username },
    });
    return Response.json({ url: `/api/product-images/${key}` }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao enviar imagem." }, { status: 400 });
  }
}
