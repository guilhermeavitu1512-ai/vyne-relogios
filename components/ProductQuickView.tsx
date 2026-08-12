"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/lib/products";
import ResponsiveWatchImage from "@/components/ResponsiveWatchImage";
import "./ProductQuickView.css";

type ProductQuickViewProps = {
  product: Product | null;
  onClose: () => void;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function ProductQuickView({ product, onClose }: ProductQuickViewProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [purchaseDetailsVisible, setPurchaseDetailsVisible] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!product) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflowY = document.body.style.overflowY;
    document.body.style.overflowY = "hidden";

    const focusTimer = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPurchaseDetailsVisible(false);
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflowY = previousOverflowY;
      previousActiveElement?.focus();
    };
  }, [product]);

  if (!product || typeof document === "undefined") return null;

  const closeDialog = () => {
    setPurchaseDetailsVisible(false);
    onClose();
  };

  return createPortal(
    <div
      className="product-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <section
        ref={dialogRef}
        className="product-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <button
          ref={closeButtonRef}
          className="product-dialog-close"
          type="button"
          aria-label="Fechar detalhes do produto"
          onClick={closeDialog}
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="product-dialog-image">
          <ResponsiveWatchImage
            src={product.image}
            alt={`Imagem ilustrativa do ${product.brand} ${product.model}`}
            sizes="(max-width: 760px) 94vw, 48vw"
          />
          <span className="product-dialog-tag">{product.tag}</span>
        </div>

        <div className="product-dialog-content">
          <span className="product-dialog-eyebrow">
            {product.brand} · {product.category}
          </span>
          <h2 id={titleId}>{product.model}</h2>

          <div className="product-dialog-price">
            <span>A partir de</span>
            <strong>{product.price}</strong>
          </div>

          <div className="product-dialog-description" id={descriptionId}>
            <span>Descrição</span>
            <p>{product.descriptor}</p>
          </div>

          <ul className="product-dialog-specs" aria-label="Características do relógio">
            {product.specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>

          <div className="product-dialog-purchase">
            <button
              className="button button-primary product-dialog-cta"
              type="button"
              disabled={product.stock === 0}
              aria-expanded={purchaseDetailsVisible}
              onClick={() => setPurchaseDetailsVisible(true)}
            >
              {product.stock === 0 ? "Produto esgotado" : "Quero comprar este relógio"} <span aria-hidden="true">→</span>
            </button>
            <small>{product.stock === 0 ? "Este modelo está indisponível no momento." : `${product.stock} unidade${product.stock === 1 ? "" : "s"} disponível${product.stock === 1 ? "" : "is"}.`}</small>
          </div>

          {purchaseDetailsVisible && product.stock > 0 && (
            <div className="product-dialog-notice" role="status" aria-live="polite">
              <strong>Solicitação de compra</strong>
              <p>
                O canal comercial da VYNE ainda não está configurado. Assim que estoque,
                garantia e atendimento forem definidos, a continuação da compra ficará
                disponível aqui com segurança.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
