"use client";

import { useEffect, useState } from "react";
import { products as fallbackProducts, type Product } from "@/lib/products";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/products", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar o catálogo.");
        return (await response.json()) as { products?: Product[] };
      })
      .then((payload) => {
        if (Array.isArray(payload.products)) setProducts(payload.products);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { products, loading };
}
