"use client";

import { m, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();

  return (
    <div className="recommended-products-grid" role="list">
      {products.map((product, index) => (
        <m.article
          className="recommended-product"
          data-last={index === products.length - 1 ? "true" : undefined}
          role="listitem"
          key={`${product.brand}-${product.model}`}
          initial={reduceMotion ? false : { opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{
            duration: reduceMotion ? 0 : 0.3,
            delay: reduceMotion ? 0 : Math.min(index * 0.055, 0.22),
            ease: [0.22, 1, 0.36, 1],
          }}
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
                sizes="(max-width: 639px) 46vw, (max-width: 1099px) 48vw, 500px"
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
        </m.article>
      ))}
    </div>
  );
}
