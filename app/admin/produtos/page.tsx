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
      if (term && !`${product.brand} ${product.model} ${product.descriptor}`.toLocaleLowerCase("pt-BR").includes(term)) return false;
      if (brand !== "all" && product.brand !== brand) return false;
      if (stock === "available" && product.stock <= 3) return false;
      if (stock === "low" && !(product.stock > 0 && product.stock <= 3)) return false;
      if (stock === "out" && product.stock !== 0) return false;
      if (status === "active" && !product.active) return false;
      if (status === "inactive" && product.active) return false;
      if (recommended === "yes" && !product.recommended) return false;
      if (recommended === "no" && product.recommended) return false;
      return true;
    });
  }, [brand, products, recommended, search, status, stock]);

  const replaceProduct = (updated: AdminProduct) => {
    setProducts((current) => current.map((product) => product.id === updated.id ? updated : product));
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header"><div><span>Catálogo</span><h1>PRODUTOS</h1><p>Edite informações públicas, preço, imagem e estoque.</p></div></header>
      {error && <div className="admin-alert" role="alert">{error}<button type="button" onClick={load}>Tentar novamente</button></div>}

      <section className="admin-filters" aria-label="Filtros de produtos">
        <label className="admin-search">Buscar<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Marca ou modelo" /></label>
        <label>Marca<select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="all">Todas</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Estoque<select value={stock} onChange={(event) => setStock(event.target.value as StockFilter)}><option value="all">Todos</option><option value="available">Em estoque</option><option value="low">Estoque baixo</option><option value="out">Esgotado</option></select></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="active">Disponível</option><option value="inactive">Inativo</option></select></label>
        <label>Recomendado<select value={recommended} onChange={(event) => setRecommended(event.target.value)}><option value="all">Todos</option><option value="yes">Sim</option><option value="no">Não</option></select></label>
      </section>

      <div className="admin-results-count">{filtered.length} de {products.length} produtos</div>
      <section className="admin-product-list">
        {filtered.map((product) => <ProductEditor key={product.id} product={product} onSaved={replaceProduct} request={request} />)}
        {!error && products.length === 0 && <div className="admin-skeleton">Carregando produtos…</div>}
        {products.length > 0 && filtered.length === 0 && <p className="admin-empty">Nenhum produto corresponde aos filtros.</p>}
      </section>
    </div>
  );
}

function ProductEditor({
  product,
  onSaved,
  request,
}: {
  product: AdminProduct;
  onSaved: (product: AdminProduct) => void;
  request: <T>(url: string, init?: RequestInit) => Promise<T>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(product);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const cancel = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setDraft(product);
    setMessage("");
    setEditing(false);
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
      let imageUrl = draft.image;
      if (file) {
        const optimized = await optimizeImage(file);
        const formData = new FormData();
        formData.set("file", optimized);
        const upload = await request<{ url: string }>("/api/admin/uploads", { method: "POST", body: formData });
        imageUrl = upload.url;
      }
      const payload = await request<{ product: AdminProduct }>(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.model,
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
      setMessage("Alterações salvas e publicadas no catálogo.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const stockTone = product.stock === 0 ? "out" : product.stock <= 3 ? "low" : "available";
  return (
    <article className="admin-product-card">
      <div className="admin-product-summary">
        <div className="admin-product-image"><img src={preview ?? draft.image} alt={`${draft.brand} ${draft.model}`} /></div>
        <div><span>{draft.brand}</span><h2>{draft.model}</h2><p>{draft.descriptor}</p><strong>{formatMoney((draft.promotionalPriceValue ?? draft.priceValue) * 100)}</strong></div>
        <div className="admin-product-state"><span className={`admin-stock-badge is-${stockTone}`}>{stockTone === "out" ? "Esgotado" : stockTone === "low" ? "Estoque baixo" : "Em estoque"}</span><b>{draft.stock} un.</b><button type="button" onClick={() => setEditing(true)} disabled={editing}>Editar</button></div>
      </div>

      {editing && <div className="admin-product-form">
        <div className="admin-form-grid">
          <label>Nome<input value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} /></label>
          <label>Marca<input value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} /></label>
          <label>Preço<input type="number" min="0" step="0.01" value={draft.priceValue} onChange={(event) => setDraft({ ...draft, priceValue: Number(event.target.value) })} /></label>
          <label>Preço promocional<input type="number" min="0" step="0.01" value={draft.promotionalPriceValue ?? ""} placeholder="Sem promoção" onChange={(event) => setDraft({ ...draft, promotionalPriceValue: event.target.value === "" ? null : Number(event.target.value) })} /></label>
          <label>Estoque<input type="number" min="0" step="1" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} /></label>
          <label>Categoria<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
          <label>Etiqueta<input value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })} /></label>
          <label>Características<input value={draft.specs.join("; ")} onChange={(event) => setDraft({ ...draft, specs: event.target.value.split(";").map((item) => item.trim()).filter(Boolean) })} /><small>Separe por ponto e vírgula.</small></label>
          <label className="admin-field-wide">Descrição<textarea rows={4} value={draft.descriptor} onChange={(event) => setDraft({ ...draft, descriptor: event.target.value })} /></label>
          <label className="admin-upload admin-field-wide">Alterar foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} /><span>JPG, PNG ou WebP · máximo 5 MB</span></label>
        </div>
        <div className="admin-checks">
          <label><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />Disponível no catálogo</label>
          <label><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />Destaque</label>
          <label><input type="checkbox" checked={draft.recommended} onChange={(event) => setDraft({ ...draft, recommended: event.target.checked })} />Recomendado</label>
        </div>
        <div className="admin-form-actions"><button type="button" className="is-primary" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button><button type="button" onClick={cancel} disabled={saving}>Cancelar</button></div>
      </div>}
      {message && <p className={message.startsWith("Alterações") ? "admin-form-success" : "admin-form-error"} role="status">{message}</p>}
    </article>
  );
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
