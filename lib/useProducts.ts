"use client";

import { useEffect, useState } from "react";
import { products as fallbackProducts, type Product } from "@/lib/products";

const legacyImageById = new Map([
  ["seiko-5-sports", "photo-1654544705636-2b6ddd388d96"],
  ["casio-vintage", "photo-1622527241521-a48f190a35cc"],
  ["citizen-tsuyosa", "photo-1753620022899-f0aa1c34e331"],
  ["orient-bambino", "photo-1654544705636-2b6ddd388d96"],
  ["timex-q-reissue", "photo-1708651145401-6be804cd02d4"],
]);

function replaceLegacyProductImage(product: Product) {
  const legacyImageId = legacyImageById.get(product.id);
  const fallbackProduct = fallbackProducts.find((item) => item.id === product.id);
  if (!legacyImageId || !fallbackProduct || !product.image.includes(legacyImageId)) return product;
  return { ...product, image: fallbackProduct.image };
}

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
        if (Array.isArray(payload.products)) {
          setProducts(payload.products.map(replaceLegacyProductImage));
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { products, loading };
}
