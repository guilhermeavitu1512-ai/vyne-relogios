"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";

type DashboardData = {
  metrics: {
    productsCount: number;
    stockUnits: number;
    soldUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
    revenueCents: number;
  };
  bestSeller: RankingItem | null;
  ranking: RankingItem[];
  timeline: Array<{ date: string; sales: number; revenueCents: number }>;
};

type RankingItem = {
  productId: string;
  name: string;
  image: string;
  unitsSold: number;
  revenueCents: number;
  stock: number;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const periods = [
  ["today", "Hoje"],
  ["7d", "7 dias"],
  ["30d", "30 dias"],
  ["all", "Todo o período"],
] as const;

export default function AdminDashboard() {
  const { request } = useAdmin();
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await request<DashboardData>(`/api/admin/dashboard?period=${period}`));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar painel.");
    }
  }, [period, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const maxUnits = useMemo(() => Math.max(1, ...(data?.ranking.map((item) => item.unitsSold) ?? [1])), [data]);
  const maxRevenue = useMemo(() => Math.max(1, ...(data?.timeline.map((item) => item.revenueCents) ?? [1])), [data]);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div><span>Operação VYNE</span><h1>VISÃO GERAL</h1><p>Estoque, vendas e desempenho com dados reais.</p></div>
        <div className="admin-periods" role="group" aria-label="Período dos indicadores">
          {periods.map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>)}
        </div>
      </header>

      {error && <div className="admin-alert" role="alert">{error}<button type="button" onClick={load}>Tentar novamente</button></div>}
      {!data ? <div className="admin-skeleton">Carregando indicadores…</div> : (
        <>
          <section className="admin-metrics" aria-label="Indicadores principais">
            <Metric label="Produtos cadastrados" value={data.metrics.productsCount} />
            <Metric label="Unidades em estoque" value={data.metrics.stockUnits} />
            <Metric label="Unidades vendidas" value={data.metrics.soldUnits} />
            <Metric label="Estoque baixo" value={data.metrics.lowStockCount} tone="warning" />
            <Metric label="Esgotados" value={data.metrics.outOfStockCount} tone="danger" />
            <Metric label="Faturamento" value={money.format(data.metrics.revenueCents / 100)} />
          </section>

          <section className="admin-dashboard-grid">
            <article className="admin-panel admin-best-seller">
              <header><span>Destaque do período</span><h2>PRODUTO MAIS VENDIDO</h2></header>
              {data.bestSeller ? (
                <div><img src={data.bestSeller.image} alt="" /><div><strong>{data.bestSeller.name}</strong><span>{data.bestSeller.unitsSold} unidades vendidas</span><b>{money.format(data.bestSeller.revenueCents / 100)}</b><small>{data.bestSeller.stock} em estoque</small></div></div>
              ) : <EmptyData text="Nenhuma venda confirmada neste período." />}
            </article>

            <article className="admin-panel">
              <header><span>Top 5</span><h2>MAIS VENDIDOS</h2></header>
              {data.ranking.length ? <ol className="admin-ranking">{data.ranking.map((item, index) => (
                <li key={item.productId}><b>{index + 1}º</b><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.unitsSold} vendidos · {item.stock} restantes</span><i style={{ width: `${(item.unitsSold / maxUnits) * 100}%` }} /></div><em>{money.format(item.revenueCents / 100)}</em></li>
              ))}</ol> : <EmptyData text="O ranking aparecerá após a primeira venda confirmada." />}
            </article>
          </section>

          <section className="admin-panel admin-chart-panel">
            <header><span>Histórico</span><h2>VENDAS E RECEITA POR PERÍODO</h2></header>
            {data.timeline.length ? <div className="admin-bars" aria-label="Gráfico de receita por período">{data.timeline.map((point) => (
              <div key={point.date}><span>{new Date(`${point.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span><i style={{ height: `${Math.max(8, (point.revenueCents / maxRevenue) * 100)}%` }} title={`${point.sales} vendas · ${money.format(point.revenueCents / 100)}`} /><b>{point.sales}</b></div>
            ))}</div> : <EmptyData text="Sem vendas confirmadas para exibir no gráfico." />}
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return <article className={tone ? `is-${tone}` : undefined}><span>{label}</span><strong>{value}</strong></article>;
}

function EmptyData({ text }: { text: string }) {
  return <p className="admin-empty">{text}</p>;
}
