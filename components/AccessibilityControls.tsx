"use client";

import { useEffect, useState } from "react";

export default function AccessibilityControls() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const savedMotion = localStorage.getItem("vyne-reduced-motion") === "true";
    const savedContrast = localStorage.getItem("vyne-high-contrast") === "true";
    document.documentElement.classList.toggle("user-reduced-motion", savedMotion);
    document.documentElement.classList.toggle("high-contrast", savedContrast);
    const syncState = window.requestAnimationFrame(() => {
      setReducedMotion(savedMotion);
      setHighContrast(savedContrast);
    });
    return () => window.cancelAnimationFrame(syncState);
  }, []);

  const toggleMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    localStorage.setItem("vyne-reduced-motion", String(next));
    document.documentElement.classList.toggle("user-reduced-motion", next);
  };

  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem("vyne-high-contrast", String(next));
    document.documentElement.classList.toggle("high-contrast", next);
  };

  return (
    <div className="accessibility-controls" aria-label="Preferências de acessibilidade">
      <button type="button" aria-pressed={reducedMotion} onClick={toggleMotion}>
        {reducedMotion ? "Movimento reduzido" : "Reduzir movimento"}
      </button>
      <button type="button" aria-pressed={highContrast} onClick={toggleContrast}>
        {highContrast ? "Contraste ativo" : "Aumentar contraste"}
      </button>
    </div>
  );
}
