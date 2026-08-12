"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import type { Product } from "@/lib/products";

type Sale = {
  id: string;
  totalCents: number;
  status: "PENDING" | "CONFIRMED" | "CANCELED";
  createdAt: string;
  confirmedAt: string | null;
  items: Array<{ id: string; productId: string; productName: string; quantity: number; unitPriceCents: number; totalCents: number }>;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const statusLabels = { PENDING: "Pendente", CONFIRMED: "Confirmada", CANCELED: "Cancelada" } as const;

export default function AdminSalesPage() {
  const { request } = useAdmin();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setMessage("");
      const [salePayload, productPayload] = await Promise.all([
        request<{ sales: Sale[] }>("/api/admin/sales"),
        request<{ products: Product[] }>("/api/admin/products"),
      ]);
      setSales(salePayload.sales);
      setProducts(productPayload.products.filter((product) => product.active));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar vendas.");
    }
  }, [request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSubmitting(true);
    setMessage("");
    try {
      const payload = await request<{ sale: Sale }>("/api/admin/sales", {
        method: "POST",
        body: JSON.stringify({ items: [{ productId: form.get("productId"), quantity: Number(form.get("quantity")) }] }),
      });
      setSales((current) => [payload.sale, ...current]);
      formElement.reset();
      setMessage("Venda pendente registrada. Confirme para baixar o estoque.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao registrar venda.");
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (sale: Sale, nextStatus: "CONFIRMED" | "CANCELED") => {
    setMessage("");
    try {
      const payload = await request<{ sale: Sale }>(`/api/admin/sales/${sale.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setSales((current) => current.map((item) => item.id === sale.id ? payload.sale : item));
      setMessage(nextStatus === "CONFIRMED" ? "Venda confirmada e estoque atualizado." : "Venda cancelada e estoque reconciliado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao atualizar venda.");
    }
  };

  const filtered = useMemo(() => status === "all" ? sales : sales.filter((sale) => sale.status === status), [sales, status]);

  return (
    <div className="admin-page">
      <header className="admin-page-header"><div><span>Comercial</span><h1>VENDAS</h1><p>Registre pedidos e confirme somente vendas efetivamente concluídas.</p></div></header>
      <section className="admin-panel admin-sale-create">
        <header><span>Novo registro</span><h2>REGISTRAR VENDA</h2></header>
        <form onSubmit={create}>
          <label>Produto<select name="productId" required defaultValue=""><option value="" disabled>Selecione</option>{products.map((product) => <option key={product.id} value={product.id}>{product.brand} {product.model} · {product.stock} em estoque</option>)}</select></label>
          <label>Quantidade<input name="quantity" type="number" min="1" max="999" step="1" defaultValue="1" required /></label>
          <button type="submit" className="is-primary" disabled={submitting || products.length === 0}>{submitting ? "Registrando…" : "Criar como pendente"}</button>
        </form>
        <p>O estoque só é reduzido quando a venda muda para CONFIRMADA.</p>
      </section>

      {message && <div className="admin-alert" role="status">{message}</div>}
      <div className="admin-list-toolbar"><strong>Histórico de vendas</strong><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="PENDING">Pendentes</option><option value="CONFIRMED">Confirmadas</option><option value="CANCELED">Canceladas</option></select></label></div>
      <section className="admin-sales-list">
        {filtered.map((sale) => (
          <article key={sale.id} className="admin-sale-card">
            <header><div><span>#{sale.id.slice(0, 8).toUpperCase()}</span><time>{new Date(sale.createdAt).toLocaleString("pt-BR")}</time></div><span className={`admin-sale-status is-${sale.status.toLowerCase()}`}>{statusLabels[sale.status]}</span></header>
            <ul>{sale.items.map((item) => <li key={item.id}><div><strong>{item.productName}</strong><span>{item.quantity} × {money.format(item.unitPriceCents / 100)}</span></div><b>{money.format(item.totalCents / 100)}</b></li>)}</ul>
            <footer><strong>Total: {money.format(sale.totalCents / 100)}</strong>{sale.status === "PENDING" && <div><button type="button" className="is-primary" onClick={() => changeStatus(sale, "CONFIRMED")}>Confirmar venda</button><button type="button" onClick={() => changeStatus(sale, "CANCELED")}>Cancelar</button></div>}{sale.status === "CONFIRMED" && <button type="button" onClick={() => changeStatus(sale, "CANCELED")}>Cancelar e devolver estoque</button>}</footer>
          </article>
        ))}
        {sales.length === 0 && <p className="admin-empty">Nenhuma venda registrada. Os indicadores permanecem zerados até existir uma venda real.</p>}
      </section>
    </div>
  );
}
