"use client";

import { useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { Product } from "@/lib/products";
import ResponsiveWatchImage from "@/components/ResponsiveWatchImage";
import "./RecommendedMarquee.css";

type RecommendedMarqueeProps = {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  variant?: "recommended" | "gallery";
};

const recommendationLabels = [
  "RECOMENDADO",
  "MAIS PROCURADO",
  "ESCOLHA DA VYNE",
  "RECOMENDADO",
  "DESTAQUE VYNE",
];

export default function RecommendedMarquee({
  products,
  onSelectProduct,
  variant = "recommended",
}: RecommendedMarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstGroupRef = useRef<HTMLDivElement>(null);
  const secondGroupRef = useRef<HTMLDivElement>(null);
  const groupWidthRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const navigationOffsetRef = useRef(0);
  const suppressClickRef = useRef(false);
  const pointerRef = useRef({
    active: false,
    id: -1,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    dragging: false,
  });
  const reducedMotion = useReducedMotion();
  const [userReducedMotion, setUserReducedMotion] = useState(false);
  const shouldReduceMotion = Boolean(reducedMotion) || userReducedMotion;

  const updateCenteredCard = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const viewportRect = viewport.getBoundingClientRect();
    const viewportCenter = viewportRect.left + viewportRect.width / 2;
    let closestCard: HTMLElement | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    viewport.querySelectorAll<HTMLElement>(".recommended-card").forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCard = card;
      }
    });

    viewport.querySelectorAll<HTMLElement>(".recommended-card[data-centered]").forEach((card) => {
      if (card !== closestCard) delete card.dataset.centered;
    });
    if (closestCard) (closestCard as HTMLElement).dataset.centered = "true";
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const updatePreference = () => {
      setUserReducedMotion(root.classList.contains("user-reduced-motion"));
    };
    const frame = window.requestAnimationFrame(updatePreference);
    const observer = new MutationObserver(updatePreference);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const normalizePosition = useCallback(() => {
    const viewport = viewportRef.current;
    const groupWidth = groupWidthRef.current;
    if (!viewport || groupWidth <= 0) return;

    if (viewport.scrollLeft >= groupWidth * 2) {
      viewport.scrollLeft -= groupWidth;
      if (pointerRef.current.active) pointerRef.current.startScrollLeft -= groupWidth;
    } else if (viewport.scrollLeft <= 1) {
      viewport.scrollLeft += groupWidth;
      if (pointerRef.current.active) pointerRef.current.startScrollLeft += groupWidth;
    }
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstGroup = firstGroupRef.current;
    const secondGroup = secondGroupRef.current;
    if (!viewport || !firstGroup || !secondGroup) return;

    const measure = () => {
      const groupWidth = secondGroup.offsetLeft - firstGroup.offsetLeft;
      if (groupWidth <= 0) return;
      const wasUninitialized = groupWidthRef.current === 0;
      groupWidthRef.current = groupWidth;
      if (wasUninitialized) viewport.scrollLeft = groupWidth;
      normalizePosition();
      window.requestAnimationFrame(updateCenteredCard);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(firstGroup);
    return () => observer.disconnect();
  }, [normalizePosition, products, updateCenteredCard]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    let previousTime = performance.now();
    const animate = (time: number) => {
      const viewport = viewportRef.current;
      const elapsed = Math.min(time - previousTime, 34);
      previousTime = time;

      if (viewport) {
        const autoplayAdvance = elapsed * 0.032;
        const navigationAdvance = navigationOffsetRef.current * Math.min(elapsed / 92, 0.2);
        navigationOffsetRef.current -= navigationAdvance;
        if (Math.abs(navigationOffsetRef.current) < 0.2) navigationOffsetRef.current = 0;

        const totalAdvance = autoplayAdvance + navigationAdvance;
        viewport.scrollLeft += totalAdvance;
        if (pointerRef.current.active) {
          pointerRef.current.startScrollLeft += totalAdvance;
        }
        normalizePosition();
        updateCenteredCard();
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [normalizePosition, shouldReduceMotion, updateCenteredCard]);

  const moveByViewport = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const card = viewport.querySelector<HTMLElement>(".recommended-card");
    const track = viewport.querySelector<HTMLElement>(".recommended-marquee-track");
    const gap = track ? Number.parseFloat(window.getComputedStyle(track).columnGap) || 18 : 18;
    const distance = (card?.offsetWidth ?? Math.max(260, viewport.clientWidth * 0.72)) + gap;

    if (shouldReduceMotion) {
      viewport.scrollLeft += direction * distance;
      normalizePosition();
      updateCenteredCard();
      return;
    }

    navigationOffsetRef.current += direction * distance;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    pointerRef.current = {
      active: true,
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      dragging: false,
    };
    viewport.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const pointer = pointerRef.current;
    if (!viewport || !pointer.active || pointer.id !== event.pointerId) return;

    const deltaX = event.clientX - pointer.startX;
    const deltaY = event.clientY - pointer.startY;
    if (!pointer.dragging && Math.abs(deltaX) > 7 && Math.abs(deltaX) > Math.abs(deltaY)) {
      pointer.dragging = true;
      viewport.dataset.dragging = "true";
    }

    if (!pointer.dragging) return;
    viewport.scrollLeft = pointer.startScrollLeft - deltaX;
    normalizePosition();
    updateCenteredCard();
  };

  const endPointerInteraction = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const pointer = pointerRef.current;
    if (!viewport || !pointer.active || pointer.id !== event.pointerId) return;

    suppressClickRef.current = pointer.dragging;
    pointer.active = false;
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    delete viewport.dataset.dragging;
    normalizePosition();
    updateCenteredCard();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    moveByViewport(event.key === "ArrowRight" ? 1 : -1);
  };

  return (
    <div className={`recommended-marquee-shell recommended-marquee-shell--${variant}`}>
      <div className="recommended-marquee-controls" aria-label="Controles do carrossel">
        <button type="button" onClick={() => moveByViewport(-1)} aria-label="Relógios anteriores">
          <span aria-hidden="true">←</span>
        </button>
        <button type="button" onClick={() => moveByViewport(1)} aria-label="Próximos relógios">
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div
        ref={viewportRef}
        className="recommended-marquee-viewport"
        role="region"
        aria-label="Carrossel contínuo de relógios recomendados."
        aria-live="off"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerInteraction}
        onPointerCancel={endPointerInteraction}
        onKeyDown={handleKeyDown}
        onScroll={updateCenteredCard}
      >
        <div className="recommended-marquee-track">
          {[0, 1, 2].map((groupIndex) => (
            <div
              className="recommended-marquee-group"
              ref={groupIndex === 0 ? firstGroupRef : groupIndex === 1 ? secondGroupRef : undefined}
              aria-hidden={groupIndex === 1 ? undefined : true}
              key={groupIndex}
            >
              {products.map((product, productIndex) => (
                <article
                  className={`recommended-card recommended-card--${variant}`}
                  key={`${groupIndex}-${product.brand}-${product.model}`}
                >
                  <button
                    type="button"
                    tabIndex={groupIndex === 1 ? 0 : -1}
                    aria-label={`Visualizar ${product.brand} ${product.model}, ${product.price}`}
                    onClick={(event) => {
                      if (suppressClickRef.current) {
                        event.preventDefault();
                        suppressClickRef.current = false;
                        return;
                      }
                      onSelectProduct(product);
                    }}
                  >
                    <div className="recommended-card-image">
                      <ResponsiveWatchImage
                        src={product.image}
                        alt={`Imagem ilustrativa do ${product.brand} ${product.model}`}
                        sizes="(max-width: 639px) 82vw, (max-width: 1023px) 42vw, 24vw"
                      />
                      {variant === "recommended" && (
                        <span>{recommendationLabels[productIndex % recommendationLabels.length]}</span>
                      )}
                    </div>
                    <div className="recommended-card-copy">
                      <span>{product.brand}</span>
                      <h3>{product.model}</h3>
                      <div>
                        <strong>{variant === "recommended" ? product.price : "VER RELÓGIO"}</strong>
                        <i>VISUALIZAR →</i>
                      </div>
                    </div>
                  </button>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
