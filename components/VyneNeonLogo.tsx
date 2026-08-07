"use client";

import { m, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function VyneNeonLogo({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"initial" | "expanded">("initial");
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage("expanded");
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  const letterStyle: React.CSSProperties = {
    color: "#a3fb06",
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2.5rem, 8vw, 7rem)",
    lineHeight: 1,
    letterSpacing: "-0.02em",
    userSelect: "none",
    whiteSpace: "nowrap",
    display: "block",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        overflow: "visible",
      }}
    >
      <m.div
        layout
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
          overflow: "visible",
        }}
      >
        {/* Letra V — aparece primeiro no centro */}
        <m.span
          layout
          style={letterStyle}
          initial={{ opacity: 0, scale: 0.5, filter: "blur(16px)" }}
          animate={
            pulsing
              ? { opacity: [1, 0.6, 1, 0.85, 1], scale: 1, filter: "blur(0px)" }
              : { opacity: 1, scale: 1, filter: "blur(0px)" }
          }
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          V
        </m.span>

        {/* Letras YNE reveladas deslizando da direita */}
        <AnimatePresence>
          {stage === "expanded" && (
            <m.div
              layout
              style={{ display: "flex", overflow: "hidden", whiteSpace: "nowrap" }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              transition={{ duration: 1.0, ease: [0.25, 1, 0.5, 1] }}
              onAnimationComplete={() => {
                setPulsing(true);
                setTimeout(onComplete, 500);
              }}
            >
              <m.span
                style={letterStyle}
                initial={{ x: 40, filter: "blur(12px)" }}
                animate={{ x: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.05 }}
              >
                YNE
              </m.span>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </div>
  );
}
