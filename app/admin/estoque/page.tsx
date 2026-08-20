"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminProvider";
import type { Product } from "@/lib/products";

type Movement = {
  id: string;
  productId: string;
  productName: string;
  saleId: string | null;
  type: "ENTRY" | "SALE" | "MANUAL_ADJUSTMENT" | "RETURN" | "CANCELLATION";
  quantity: number;
  previousStock: number;
  newStock: number;
  responsible: string;
  note: string;
  createdAt: string;
};

const movementLabels = {
  ENTRY: "Entrada",
  SALE: "Venda",
  MANUAL_ADJUSTMENT: "Ajuste manual",
  RETURN: "Devolução",
  CANCELLATION: "Cancelamento",
} as const;

export default function AdminStockPage() {
  const { request } = useAdmin();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [quickActionId, setQuickActionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(() => searchParams.get("produto") ?? "");

  const load = useCallback(async () => {
    try {
      const [productPayload, movementPayload] = await Promise.all([
        request<{ products: Product[] }>("/api/admin/products"),
        request<{ movements: Movement[] }>("/api/admin/stock-movements"),
      ]);
      setProducts(productPayload.products);
      setMovements(movementPayload.movements);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar estoque.");
    }
  }, [request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSubmitting(true);
    setMessage("");
    try {
      await request("/api/admin/stock-movements", {
        method: "POST",
        body: JSON.stringify({
          productId: form.get("productId"),
          type: form.get("type"),
          quantity: Number(form.get("quantity")),
          note: form.get("note"),
        }),
      });
      formElement.reset();
      setMessage("Movimentação registrada com sucesso.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao registrar movimentação.");
    } finally {
      setSubmitting(false);
    }
  };

  const quickAdjust = async (product: Product, quantity: 1 | -1) => {
    setQuickActionId(product.id);
    setMessage("");
    try {
      await request("/api/admin/stock-movements", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          type: quantity > 0 ? "ENTRY" : "MANUAL_ADJUSTMENT",
          quantity,
          note: quantity > 0 ? "Entrada rápida de uma unidade" : "Retirada rápida de uma unidade",
        }),
      });
      setMessage(quantity > 0 ? "Uma unidade foi adicionada ao estoque." : "Uma unidade foi retirada do estoque.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao atualizar estoque.");
    } finally {
      setQuickActionId(null);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header"><div><span>Inventário</span><h1>ESTOQUE</h1><p>Cada alteração gera um registro auditável com saldo anterior e atual.</p></div></header>
      <section className="admin-stock-overview">
        {products.map((product) => {
          const tone = product.stock === 0 ? "out" : product.stock <= 3 ? "low" : "available";
          const updating = quickActionId === product.id;
          return <article key={product.id}><img src={product.image} alt={`${product.brand} ${product.model}`} /><div><span>{product.brand}</span><strong>{product.model}</strong></div><b aria-label={`${product.stock} unidades em estoque`}>{product.stock}</b><small className={`is-${tone}`}>{tone === "out" ? "Esgotado" : tone === "low" ? "Baixo" : "Em estoque"}</small><div className="admin-stock-actions"><button type="button" className="is-primary" disabled={updating} onClick={() => void quickAdjust(product, 1)}>+ Adicionar 1</button><button type="button" disabled={updating || product.stock === 0} onClick={() => void quickAdjust(product, -1)}>− Retirar 1</button></div></article>;
        })}
      </section>

      <section className="admin-panel admin-stock-entry">
        <header><span>Novo lançamento</span><h2>MOVIMENTAR ESTOQUE</h2></header>
        <form onSubmit={submit}>
          <label>Produto<select name="productId" required value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}><option value="" disabled>Selecione</option>{products.map((product) => <option key={product.id} value={product.id}>{product.brand} {product.model} · saldo {product.stock}</option>)}</select></label>
          <label>Tipo<select name="type" required defaultValue="ENTRY"><option value="ENTRY">Entrada</option><option value="RETURN">Devolução</option><option value="MANUAL_ADJUSTMENT">Ajuste manual</option></select></label>
          <label>Quantidade<input name="quantity" type="number" step="1" required placeholder="Ex.: 5 ou -2" /></label>
          <label className="admin-field-wide">Observação<input name="note" maxLength={300} placeholder="Motivo ou referência" /></label>
          <button type="submit" className="is-primary" disabled={submitting}>{submitting ? "Registrando…" : "Registrar movimentação"}</button>
        </form>
        <p>Entradas e devoluções são positivas. Ajustes manuais podem ser positivos ou negativos, sem permitir saldo abaixo de zero.</p>
      </section>

      {message && <div className="admin-alert" role="status">{message}</div>}
      <section className="admin-panel admin-movement-history">
        <header><span>Auditoria</span><h2>HISTÓRICO DE MOVIMENTAÇÕES</h2></header>
        <div className="admin-movement-list">{movements.map((movement) => <article key={movement.id}><div><strong>{movement.productName}</strong><span>{movement.type === "MANUAL_ADJUSTMENT" && movement.quantity < 0 ? "Saída" : movementLabels[movement.type]}{movement.saleId ? ` · venda #${movement.saleId.slice(0, 8)}` : ""}</span></div><b className={movement.quantity >= 0 ? "is-positive" : "is-negative"}>{movement.quantity >= 0 ? "+" : ""}{movement.quantity}</b><div><span>Anterior {movement.previousStock}</span><strong>Atual {movement.newStock}</strong></div><div><time>{new Date(movement.createdAt).toLocaleString("pt-BR")}</time><small>{movement.responsible}{movement.note ? ` · ${movement.note}` : ""}</small></div></article>)}</div>
        {movements.length === 0 && <p className="admin-empty">Nenhuma movimentação registrada.</p>}
      </section>
    </div>
  );
}
