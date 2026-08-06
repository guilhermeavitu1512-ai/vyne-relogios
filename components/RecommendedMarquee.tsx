"use client";

import { useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import type { Product } from "@/lib/products";
import ResponsiveWatchImage from "@/components/ResponsiveWatchImage";
import "./RecommendedMarquee.css";

type RecommendedMarqueeProps = {
  products: Product[];
  onSelectProduct: (product: Product) => void;
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
}: RecommendedMarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstGroupRef = useRef<HTMLDivElement>(null);
  const secondGroupRef = useRef<HTMLDivElement>(null);
  const groupWidthRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const resumeAtRef = useRef(0);
  const hoveredRef = useRef(false);
  const focusWithinRef = useRef(false);
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
    } else if (viewport.scrollLeft <= 1) {
      viewport.scrollLeft += groupWidth;
    }
  }, []);

  const pauseAutoplay = useCallback((delay = 2600) => {
    resumeAtRef.current = performance.now() + delay;
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
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(firstGroup);
    return () => observer.disconnect();
  }, [normalizePosition, products]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    let previousTime = performance.now();
    const animate = (time: number) => {
      const viewport = viewportRef.current;
      const elapsed = Math.min(time - previousTime, 34);
      previousTime = time;

      if (
        viewport &&
        !pointerRef.current.active &&
        !hoveredRef.current &&
        !focusWithinRef.current &&
        time >= resumeAtRef.current
      ) {
        viewport.scrollLeft += elapsed * 0.022;
        normalizePosition();
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [normalizePosition, shouldReduceMotion]);

  const moveByViewport = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    pauseAutoplay();
    viewport.scrollBy({
      left: direction * Math.max(260, viewport.clientWidth * 0.72),
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
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
    pauseAutoplay();
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
  };

  const endPointerInteraction = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const pointer = pointerRef.current;
    if (!viewport || !pointer.active || pointer.id !== event.pointerId) return;

    suppressClickRef.current = pointer.dragging;
    pointer.active = false;
    if (event.pointerType !== "mouse") hoveredRef.current = false;
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    delete viewport.dataset.dragging;
    pauseAutoplay(3200);
    normalizePosition();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    moveByViewport(event.key === "ArrowRight" ? 1 : -1);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) > 0 || event.shiftKey) pauseAutoplay(3000);
  };

  const handleFocus = () => {
    focusWithinRef.current = true;
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    focusWithinRef.current = false;
    pauseAutoplay(1800);
  };

  return (
    <div className="recommended-marquee-shell">
      <div className="recommended-marquee-controls" aria-label="Controles dos recomendados">
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
        aria-label="Relógios recomendados. Arraste horizontalmente ou use as setas do teclado."
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerInteraction}
        onPointerCancel={endPointerInteraction}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") hoveredRef.current = true;
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") {
            hoveredRef.current = false;
            pauseAutoplay(1800);
          }
        }}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
                  className="recommended-card"
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
                      <span>{recommendationLabels[productIndex % recommendationLabels.length]}</span>
                    </div>
                    <div className="recommended-card-copy">
                      <span>{product.brand}</span>
                      <h3>{product.model}</h3>
                      <div>
                        <strong>{product.price}</strong>
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
