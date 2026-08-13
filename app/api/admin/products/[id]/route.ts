import { requireAdmin } from "@/lib/server/auth";
import { isSameOrigin } from "@/lib/server/security";
import { deleteProduct, updateProduct } from "@/lib/server/store";
import { parseProduct } from "@/app/api/admin/products/product-input";

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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const auth = await requireAdmin(request, true);
  if ("response" in auth) return auth.response;
  try {
    const { id } = await context.params;
    const result = await deleteProduct(id);
    if (!result) return Response.json({ error: "Produto não encontrado." }, { status: 404 });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao excluir produto." }, { status: 400 });
  }
}
