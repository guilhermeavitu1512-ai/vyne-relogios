import { requireAdmin } from "@/lib/server/auth";
import { isSameOrigin } from "@/lib/server/security";
import { uploadProductImage } from "@/lib/server/supabase";

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
    const url = await uploadProductImage(key, await file.arrayBuffer(), file.type);
    return Response.json({ url }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao enviar imagem." }, { status: 400 });
  }
}
