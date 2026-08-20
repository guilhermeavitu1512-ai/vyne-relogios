"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import type { Product } from "@/lib/products";

type AdminProduct = Product & { createdAt: string; updatedAt: string };
type StockFilter = "all" | "available" | "low" | "out";

export default function AdminProductsPage() {
  const { request } = useAdmin();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [stock, setStock] = useState<StockFilter>("all");
  const [status, setStatus] = useState("all");
  const [recommended, setRecommended] = useState("all");
  const [featured, setFeatured] = useState("all");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const payload = await request<{ products: AdminProduct[] }>("/api/admin/products");
      setProducts(payload.products);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar produtos.");
    }
  }, [request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const brands = useMemo(() => [...new Set(products.map((product) => product.brand))].sort(), [products]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      if (term && !`${product.name} ${product.brand} ${product.model} ${product.descriptor}`.toLocaleLowerCase("pt-BR").includes(term)) return false;
      if (brand !== "all" && product.brand !== brand) return false;
      if (stock === "available" && product.stock <= 3) return false;
      if (stock === "low" && !(product.stock > 0 && product.stock <= 3)) return false;
      if (stock === "out" && product.stock !== 0) return false;
      if (status === "active" && !product.active) return false;
      if (status === "inactive" && product.active) return false;
      if (recommended === "yes" && !product.recommended) return false;
      if (recommended === "no" && product.recommended) return false;
      if (featured === "yes" && !product.featured) return false;
      if (featured === "no" && product.featured) return false;
      return true;
    });
  }, [brand, featured, products, recommended, search, status, stock]);

  const replaceProduct = (updated: AdminProduct) => {
    setProducts((current) => current.map((product) => product.id === updated.id ? updated : product));
  };

  const removeProduct = (id: string) => {
    setProducts((current) => current.filter((product) => product.id !== id));
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header"><div><span>Catálogo</span><h1>PRODUTOS</h1><p>Edite informações públicas, preço, imagem e estoque.</p></div><button type="button" className="is-primary admin-add-product" onClick={() => setCreating(true)} disabled={creating}>+ Adicionar relógio</button></header>
      {error && <div className="admin-alert" role="alert">{error}<button type="button" onClick={load}>Tentar novamente</button></div>}

      {creating && (
        <section className="admin-product-create" aria-label="Adicionar novo relógio">
          <ProductEditor
            product={emptyProduct()}
            isNew
            onSaved={(created) => {
              setProducts((current) => [created, ...current]);
              setCreating(false);
            }}
            onDeleted={removeProduct}
            onCancelNew={() => setCreating(false)}
            request={request}
          />
        </section>
      )}

      <section className="admin-filters" aria-label="Filtros de produtos">
        <label className="admin-search">Buscar<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, marca ou modelo" /></label>
        <label>Marca<select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="all">Todas</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Estoque<select value={stock} onChange={(event) => setStock(event.target.value as StockFilter)}><option value="all">Todos</option><option value="available">Em estoque</option><option value="low">Estoque baixo</option><option value="out">Esgotado</option></select></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select></label>
        <label>Recomendado<select value={recommended} onChange={(event) => setRecommended(event.target.value)}><option value="all">Todos</option><option value="yes">Sim</option><option value="no">Não</option></select></label>
        <label>Destaque<select value={featured} onChange={(event) => setFeatured(event.target.value)}><option value="all">Todos</option><option value="yes">Sim</option><option value="no">Não</option></select></label>
      </section>

      <div className="admin-results-count">{filtered.length} de {products.length} produtos</div>
      <section className="admin-product-list">
        {filtered.map((product) => <ProductEditor key={product.id} product={product} onSaved={replaceProduct} onDeleted={removeProduct} request={request} />)}
        {!error && products.length === 0 && <div className="admin-skeleton">Carregando produtos…</div>}
        {products.length > 0 && filtered.length === 0 && <p className="admin-empty">Nenhum produto corresponde aos filtros.</p>}
      </section>
    </div>
  );
}

function ProductEditor({
  product,
  isNew = false,
  onSaved,
  onDeleted,
  onCancelNew,
  request,
}: {
  product: AdminProduct;
  isNew?: boolean;
  onSaved: (product: AdminProduct) => void;
  onDeleted: (id: string) => void;
  onCancelNew?: () => void;
  request: <T>(url: string, init?: RequestInit) => Promise<T>;
}) {
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(product);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [stockAmount, setStockAmount] = useState("1");
  const [stockSaving, setStockSaving] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const cancel = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setDraft(product);
    setMessage("");
    setEditing(false);
    onCancelNew?.();
  };

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setMessage("");
    if (!nextFile) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(nextFile.type)) {
      setMessage("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      setMessage("A imagem deve ter no máximo 5 MB.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const requiredFields = [
        ["nome", draft.name],
        ["marca", draft.brand],
        ["modelo", draft.model],
        ["descrição", draft.descriptor],
      ] as const;
      const missingField = requiredFields.find(([, value]) => !value.trim());
      if (missingField) throw new Error(`Informe ${missingField[0]} do relógio.`);
      if (!Number.isFinite(draft.priceValue) || draft.priceValue < 0) throw new Error("Informe um preço válido.");
      if (draft.promotionalPriceValue !== null && (!Number.isFinite(draft.promotionalPriceValue) || draft.promotionalPriceValue < 0)) {
        throw new Error("Informe um preço promocional válido.");
      }
      if (!Number.isSafeInteger(draft.stock) || draft.stock < 0) throw new Error("Informe um estoque válido.");

      let imageUrl = draft.image;
      if (file) {
        const optimized = await optimizeImage(file);
        const formData = new FormData();
        formData.set("file", optimized);
        const upload = await request<{ url: string }>("/api/admin/uploads", { method: "POST", body: formData });
        imageUrl = upload.url;
      }
      if (!imageUrl) throw new Error("Selecione uma foto para o novo relógio.");
      const payload = await request<{ product: AdminProduct }>(isNew ? "/api/admin/products" : `/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify({
          name: draft.name,
          model: draft.model,
          brand: draft.brand,
          description: draft.descriptor,
          price: draft.priceValue,
          promotionalPrice: draft.promotionalPriceValue,
          imageUrl,
          stock: draft.stock,
          category: draft.category,
          tag: draft.tag,
          specs: draft.specs,
          featured: draft.featured,
          recommended: draft.recommended,
          active: draft.active,
        }),
      });
      onSaved(payload.product);
      setDraft(payload.product);
      setFile(null);
      setPreview(null);
      setEditing(false);
      setMessage(isNew ? "Relógio criado e publicado no catálogo." : "Alterações salvas e publicadas no catálogo.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const adjustStock = async (direction: 1 | -1) => {
    const amount = Number(stockAmount);
    setMessage("");
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setMessage("Informe uma quantidade inteira maior que zero.");
      return;
    }
    if (direction < 0 && amount > draft.stock) {
      setMessage("A retirada não pode deixar o estoque negativo.");
      return;
    }

    setStockSaving(true);
    try {
      const quantity = direction * amount;
      const payload = await request<{ product: AdminProduct }>("/api/admin/stock-movements", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          type: direction > 0 ? "ENTRY" : "MANUAL_ADJUSTMENT",
          quantity,
          note: direction > 0 ? "Entrada realizada na página de produtos" : "Retirada realizada na página de produtos",
        }),
      });
      setDraft(payload.product);
      onSaved(payload.product);
      setStockAmount("1");
      setMessage(direction > 0 ? "Estoque adicionado e salvo." : "Estoque retirado e salvo.");
    } catch (stockError) {
      setMessage(stockError instanceof Error ? stockError.message : "Falha ao atualizar estoque.");
    } finally {
      setStockSaving(false);
    }
  };

  const remove = async () => {
    if (isNew) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = await request<{ mode: "deleted" | "archived"; product: AdminProduct }>(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: "DELETE" });
      if (payload.mode === "archived") onSaved(payload.product);
      else onDeleted(product.id);
      setMessage(payload.mode === "archived" ? "Produto retirado do catálogo; o histórico foi preservado." : "Produto excluído.");
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : "Falha ao excluir.");
    } finally {
      setSaving(false);
      setConfirmingDelete(false);
    }
  };

  const stockTone = draft.stock === 0 ? "out" : draft.stock <= 3 ? "low" : "available";
  return (
    <article className="admin-product-card">
      <div className="admin-product-summary">
        <div className="admin-product-image">{preview ?? draft.image ? <img src={preview ?? draft.image} alt={`${draft.brand} ${draft.model}`} /> : <span>Foto do relógio</span>}</div>
        <div><span>{draft.brand}</span><h2>{draft.name || draft.model}</h2><p className="admin-product-model">Modelo: {draft.model || "—"}</p><p>{draft.descriptor}</p><strong>{formatMoney((draft.promotionalPriceValue ?? draft.priceValue) * 100)}</strong></div>
        <div className="admin-product-state"><span className={`admin-stock-badge is-${stockTone}`}>{stockTone === "out" ? "Esgotado" : stockTone === "low" ? "Estoque baixo" : "Em estoque"}</span><div className="admin-product-flags"><span className={draft.recommended ? "is-positive" : undefined}>{draft.recommended ? "Recomendado" : "Não recomendado"}</span><span className={draft.active ? "is-positive" : "is-muted"}>{draft.active ? "Ativo" : "Inativo"}</span></div><b>{draft.stock} un.</b>{!isNew && <div className="admin-product-actions"><button type="button" onClick={() => { setStockOpen(false); setEditing(true); }} disabled={editing || stockSaving}>Editar</button><button type="button" onClick={() => setStockOpen((open) => !open)} disabled={editing || saving}>{stockOpen ? "Fechar estoque" : "Estoque"}</button><button type="button" className="is-danger" onClick={() => setConfirmingDelete(true)} disabled={saving || stockSaving}>Excluir</button></div>}</div>
      </div>

      {stockOpen && !isNew && <div className="admin-product-stock-panel">
        <div><span>Estoque atual</span><strong>{draft.stock}</strong><small>{stockTone === "out" ? "Esgotado" : stockTone === "low" ? "Estoque baixo" : "Em estoque"}</small></div>
        <label>Quantidade<input type="number" min="1" step="1" inputMode="numeric" value={stockAmount} onChange={(event) => setStockAmount(event.target.value)} /></label>
        <div><button type="button" className="is-primary" disabled={stockSaving} onClick={() => void adjustStock(1)}>{stockSaving ? "Salvando…" : "Adicionar"}</button><button type="button" disabled={stockSaving || draft.stock === 0} onClick={() => void adjustStock(-1)}>Retirar</button></div>
      </div>}

      {editing && <div className="admin-product-form">
        <div className="admin-form-grid">
          <label>Nome<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>Marca<input required value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} /></label>
          <label>Modelo<input required value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} /></label>
          <label>Preço<input required type="number" min="0" step="0.01" value={draft.priceValue} onChange={(event) => setDraft({ ...draft, priceValue: Number(event.target.value) })} /></label>
          <label>Preço promocional<input type="number" min="0" step="0.01" value={draft.promotionalPriceValue ?? ""} placeholder="Sem promoção" onChange={(event) => setDraft({ ...draft, promotionalPriceValue: event.target.value === "" ? null : Number(event.target.value) })} /></label>
          <label>Estoque<input type="number" min="0" step="1" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} /></label>
          <label>Categoria <small>Opcional</small><input value={draft.category} placeholder="Relógios" onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
          <label>Etiqueta<input value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })} /></label>
          <label>Características<input value={draft.specs.join("; ")} onChange={(event) => setDraft({ ...draft, specs: event.target.value.split(";").map((item) => item.trim()).filter(Boolean) })} /><small>Separe por ponto e vírgula.</small></label>
          <label className="admin-field-wide">Descrição<textarea required rows={4} value={draft.descriptor} onChange={(event) => setDraft({ ...draft, descriptor: event.target.value })} /></label>
          <label className="admin-upload admin-field-wide">{isNew ? "Foto" : "Alterar foto"}<input required={isNew && !draft.image} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} /><span>JPG, PNG ou WebP · máximo 5 MB · preview antes de salvar</span></label>
        </div>
        <div className="admin-checks">
          <label><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />Disponível no catálogo</label>
          <label><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />Destaque</label>
          <label><input type="checkbox" checked={draft.recommended} onChange={(event) => setDraft({ ...draft, recommended: event.target.checked })} />Recomendado</label>
        </div>
        <div className="admin-form-actions"><button type="button" className="is-primary" onClick={save} disabled={saving}>{saving ? "Salvando…" : isNew ? "Salvar produto" : "Salvar alterações"}</button><button type="button" onClick={cancel} disabled={saving}>Cancelar</button></div>
      </div>}
      {confirmingDelete && <div className="admin-confirm-overlay" role="presentation"><div className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby={`delete-${product.id}`}><span>Confirmação</span><h3 id={`delete-${product.id}`}>EXCLUIR RELÓGIO?</h3><p>Tem certeza que deseja excluir este relógio? Produtos com histórico serão apenas desativados para preservar a auditoria.</p><div><button type="button" onClick={() => setConfirmingDelete(false)} disabled={saving}>Cancelar</button><button type="button" className="is-danger" onClick={() => void remove()} disabled={saving}>{saving ? "Excluindo…" : "Excluir produto"}</button></div></div></div>}
      {message && <p className={message.includes("salv") || message.includes("criado") || message.includes("excluído") || message.includes("retirado") ? "admin-form-success" : "admin-form-error"} role="status">{message}</p>}
    </article>
  );
}

function emptyProduct(): AdminProduct {
  return {
    id: "novo",
    name: "",
    brand: "",
    model: "",
    descriptor: "",
    price: "R$ 0",
    priceValue: 0,
    promotionalPriceValue: null,
    image: "",
    tag: "",
    category: "",
    specs: [],
    stock: 0,
    featured: false,
    recommended: false,
    active: true,
    createdAt: "",
    updatedAt: "",
  };
}

async function optimizeImage(file: File) {
  if (typeof createImageBitmap !== "function") return file;
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, 1600 / longest);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
