"use client";

import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import "./SpotlightCard.css";

type SpotlightCardProps = {
  children: ReactNode;
  as?: "article" | "div";
  className?: string;
  spotlightColor?: string;
};

export default function SpotlightCard({
  children,
  as = "div",
  className = "",
  spotlightColor = "rgba(163, 251, 6, 0.16)",
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);

  const setCardRef = (node: HTMLElement | null) => {
    cardRef.current = node;
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    cardRef.current.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
  };

  const handlePointerLeave = () => {
    cardRef.current?.style.setProperty("--mouse-x", "50%");
    cardRef.current?.style.setProperty("--mouse-y", "50%");
  };

  const classes = `card-spotlight ${className}`.trim();
  const style = { "--spotlight-color": spotlightColor } as CSSProperties;

  if (as === "article") {
    return (
      <article
        ref={setCardRef}
        className={classes}
        style={style}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {children}
      </article>
    );
  }

  return (
    <div
      ref={setCardRef}
      className={classes}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>
  );
}
