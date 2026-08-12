"use client";

import type { Product } from "@/lib/products";
import ResponsiveWatchImage from "@/components/ResponsiveWatchImage";
import "./RecommendedProducts.css";

type RecommendedProductsProps = {
  products: Product[];
  onSelectProduct: (product: Product) => void;
};

export default function RecommendedProducts({
  products,
  onSelectProduct,
}: RecommendedProductsProps) {
  return (
    <div className="recommended-products-grid" role="list">
      {products.map((product, index) => (
        <article
          className="recommended-product"
          data-featured={index < 2 ? "true" : undefined}
          role="listitem"
          key={`${product.brand}-${product.model}`}
        >
          <button
            type="button"
            aria-label={`Visualizar ${product.brand} ${product.model}, ${product.price}`}
            onClick={() => onSelectProduct(product)}
          >
            <div className="recommended-product-image">
              <ResponsiveWatchImage
                src={product.image}
                alt={`${product.brand} ${product.model}`}
                sizes="(max-width: 639px) 100vw, (max-width: 1099px) 50vw, 42vw"
                fit="contain"
              />
              {product.stock === 0 && (
                <span className="recommended-product-stock">ESGOTADO</span>
              )}
            </div>

            <div className="recommended-product-copy">
              <div>
                <span>{product.brand}</span>
                <small>{product.category}</small>
              </div>
              <h3>{product.model}</h3>
              <p>{product.descriptor}</p>
              <div className="recommended-product-meta">
                <strong>{product.price}</strong>
                <span>VER PRODUTO</span>
              </div>
            </div>
          </button>
        </article>
      ))}
    </div>
  );
}
