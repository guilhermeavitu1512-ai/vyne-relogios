"use client";

import dynamic from "next/dynamic";
import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import FreeShippingBanner from "@/components/FreeShippingBanner";
import ProductQuickView from "@/components/ProductQuickView";
import RecommendedMarquee from "@/components/RecommendedMarquee";
import ResponsiveWatchImage from "@/components/ResponsiveWatchImage";
import SiteFooter from "@/components/SiteFooter";
import SpotlightCard from "@/components/SpotlightCard";
import StaggeredMenu from "@/components/StaggeredMenu";
import StrokeText from "@/components/StrokeText";
import { brandNames, products, type Product } from "@/lib/products";
import { editorialEase, motionDurations, staggerDelay } from "@/lib/motion";

const CircularGallery = dynamic(() => import("@/components/CircularGallery"), {
  ssr: false,
});

const FloatingLines = dynamic(() => import("@/components/FloatingLines"), {
  ssr: false,
});

const heroLineGradient = ["#080808", "#283a05", "#6da800", "#a3fb06"];
const heroEnabledWaves: Array<"middle" | "bottom"> = ["middle", "bottom"];
const heroLineCount = [6, 5];
const heroLineDistance = [5, 6];
const heroMiddleWavePosition = { x: 1.45, y: -0.08, rotate: 0.22 };
const heroBottomWavePosition = { x: 1.05, y: -0.72, rotate: -0.48 };

const menuItems = [
  { label: "Início", ariaLabel: "Ir para o início", link: "/#inicio" },
  {
    label: "Recomendados",
    ariaLabel: "Ver relógios recomendados",
    link: "/#recomendados",
  },
  { label: "Coleção", ariaLabel: "Explorar a coleção", link: "/#colecao" },
  { label: "A VYNE", ariaLabel: "Conhecer a VYNE", link: "/#sobre" },
];

const trustPoints = [
  {
    index: "01",
    title: "Procedência clara",
    text: "Relógios originais selecionados com informações apresentadas sem ambiguidade.",
  },
  {
    index: "02",
    title: "Curadoria com propósito",
    text: "Modelos reconhecidos escolhidos por qualidade, presença e relação inteligente de valor.",
  },
  {
    index: "03",
    title: "Confiança na escolha",
    text: "Uma experiência objetiva para comparar estilos, mecanismos e preços com segurança.",
  },
];

const galleryItems = products.map((product) => ({
  image: product.image,
  text: `${product.brand} · ${product.model}`,
}));

function Section({
  id,
  className,
  children,
  ariaLabel,
}: {
  id?: string;
  className: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <section id={id} className={`story-section ${className}`} aria-label={ariaLabel}>
      {children}
    </section>
  );
}

function useCompactEffects() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return compact;
}

function ProductGalleryShowcase({
  onSelectProduct,
}: {
  onSelectProduct: (product: Product) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = containerRef.current;
    if (!element || reduceMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setReady(true),
      { rootMargin: "280px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <div className="gallery-module">
      <div className="gallery-caption">
        <div>
          <span>EXPLORAÇÃO INTERATIVA</span>
          <strong>ARRASTE PARA DESCOBRIR</strong>
        </div>
        <p>USE O GESTO HORIZONTAL OU AS SETAS DO TECLADO.</p>
      </div>
      <div className="gallery-stage" ref={containerRef}>
        {reduceMotion ? (
          <div className="gallery-static" role="region" aria-label="Relógios disponíveis">
            {products.map((product) => (
              <SpotlightCard
                as="article"
                className="gallery-static-card"
                key={`${product.brand}-${product.model}`}
              >
                <button
                  type="button"
                  aria-label={`Ver detalhes e comprar ${product.brand} ${product.model}`}
                  onClick={() => onSelectProduct(product)}
                >
                  <div>
                    <ResponsiveWatchImage
                      src={product.image}
                      alt={`${product.brand} ${product.model}`}
                      sizes="78vw"
                    />
                  </div>
                  <span>{product.brand}</span>
                  <strong>{product.model}</strong>
                </button>
              </SpotlightCard>
            ))}
          </div>
        ) : ready ? (
          <CircularGallery
            items={galleryItems}
            bend={2.7}
            textColor="#ffffff"
            borderRadius={0.055}
            scrollSpeed={2}
            scrollEase={0.065}
          />
        ) : (
          <div className="gallery-placeholder" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const reduceMotion = useReducedMotion();
  const compactEffects = useCompactEffects();
  const { scrollY, scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.25,
  });

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 48;
    setScrolled((current) => (current === next ? current : next));
  });

  return (
    <LazyMotion features={domAnimation}>
      <div className="site-shell">
        <m.div className="scroll-progress" style={{ scaleX: smoothProgress }} aria-hidden="true" />
        <FreeShippingBanner />

        <StaggeredMenu
          items={menuItems}
          headerLinks={[
            { label: "Recomendados", link: "/#recomendados" },
            { label: "Coleção", link: "/#colecao" },
          ]}
          position="right"
          accentColor="#a3fb06"
          menuButtonColor="#ffffff"
          openMenuButtonColor="#ffffff"
          closeOnClickAway
          isFixed
          scrolled={scrolled}
        />

        <main id="conteudo">
          <section className="hero signature-hero" id="inicio" aria-labelledby="hero-title">
            {!reduceMotion && !compactEffects && (
              <div className="hero-lines" aria-hidden="true">
                <FloatingLines
                  linesGradient={heroLineGradient}
                  enabledWaves={heroEnabledWaves}
                  lineCount={heroLineCount}
                  lineDistance={heroLineDistance}
                  middleWavePosition={heroMiddleWavePosition}
                  bottomWavePosition={heroBottomWavePosition}
                  animationSpeed={0.3}
                  interactive
                  bendRadius={4.8}
                  bendStrength={-0.54}
                  mouseDamping={0.08}
                  parallax
                  parallaxStrength={0.08}
                  mixBlendMode="screen"
                />
              </div>
            )}

            <div className="hero-atmosphere" aria-hidden="true" />

            <div className="hero-container">
              <div className="hero-grid">
                <m.div
                  className="hero-copy"
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.75, ease: editorialEase }}
                >
                  <span className="eyebrow">CURADORIA INDEPENDENTE · RELÓGIOS ORIGINAIS</span>
                  <h1
                    id="hero-title"
                    className="hero-stroke-title"
                    aria-label="Sofisticação real. Preço inteligente."
                  >
                    <StrokeText
                      text="SOFISTICAÇÃO REAL."
                      className="hero-stroke-row hero-stroke-row--primary"
                      strokeColor="#a3fb06"
                      fillColor="#ffffff"
                      fontWeight={400}
                      startDelay={0.05}
                      height="clamp(44px, 6.8vw, 94px)"
                      ariaHidden
                    />
                    <StrokeText
                      text="PREÇO INTELIGENTE."
                      className="hero-stroke-row hero-stroke-row--accent"
                      strokeColor="#ffffff"
                      fillColor="#a3fb06"
                      fontWeight={400}
                      startDelay={0.18}
                      height="clamp(44px, 6.8vw, 94px)"
                      ariaHidden
                    />
                  </h1>
                  <p>
                    SEIKO, CASIO, CITIZEN, ORIENT E TIMEX SELECIONADOS PARA QUEM PROCURA
                    AUTENTICIDADE, ESTILO E UMA COMPRA MAIS INTELIGENTE.
                  </p>
                  <div className="hero-actions">
                    <a className="button button-primary" href="#recomendados">
                      VER RECOMENDADOS <span aria-hidden="true">↓</span>
                    </a>
                    <a className="text-link" href="#sobre">
                      CONHECER A VYNE <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </m.div>

                <m.div
                  className="hero-model"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.82, delay: 0.1, ease: editorialEase }}
                >
                  <div className="model-caption">
                    <span>VISUALIZAÇÃO 3D</span>
                    <i />
                    <small>ARRASTE PARA EXPLORAR</small>
                  </div>
                  <div className="hero-model-viewport">
                    <iframe
                      className="hero-sketchfab"
                      title="Relógio Seiko em visualização 3D interativa"
                      src={`https://sketchfab.com/models/0796e23ab5c0448c9bdf3fe5c3b3e362/embed?autostart=1&camera=0&scrollwheel=0&ui_infos=0&ui_controls=0&ui_general_controls=0&ui_start=0&ui_loading=0&ui_stop=0&ui_hint=0&ui_help=0&ui_settings=0&ui_inspector=0&ui_annotations=0&ui_animations=0&ui_fullscreen=0&ui_watermark=0&ui_watermark_link=0&ui_vr=0&ui_ar=0&dnt=1&transparent=1&max_texture_size=${compactEffects ? 1024 : 2048}&ui_theme=dark`}
                      loading="eager"
                      allow="autoplay; fullscreen; xr-spatial-tracking"
                      allowFullScreen
                    />
                  </div>
                </m.div>
              </div>
            </div>

            <div className="hero-scroll-cue" aria-hidden="true">
              <span>DESLIZE PARA DESCOBRIR</span>
              <i />
            </div>
          </section>

          <Section id="quem-somos" className="who-section">
            <div className="who-grid">
              <AnimatedSection className="who-copy">
                <span className="section-index">QUEM SOMOS</span>
                <h2>RELÓGIOS ESCOLHIDOS COM INTENÇÃO.</h2>
                <p>
                  A VYNE TRABALHA COM RELÓGIOS ORIGINAIS E SELECIONADOS PARA PESSOAS QUE
                  PROCURAM ESTILO, QUALIDADE E PREÇO INTELIGENTE.
                </p>
              </AnimatedSection>
              <m.div
                className="vyne-wordmark-panel"
                role="img"
                aria-label="Logomarca VYNE"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: reduceMotion ? 0 : 0.65, ease: editorialEase }}
              >
                <span>VYNE</span>
                <small>RITMO AUTÊNTICO</small>
              </m.div>
            </div>

            <div className="brand-line" aria-label="Marcas selecionadas">
              <span>MARCAS SELECIONADAS</span>
              <div>
                {brandNames.map((brand, index) => (
                  <m.strong
                    key={brand}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: reduceMotion ? 0 : motionDurations.content,
                      delay: reduceMotion ? 0 : staggerDelay(index, 0.04),
                      ease: editorialEase,
                    }}
                  >
                    {brand}
                  </m.strong>
                ))}
              </div>
            </div>
          </Section>

          <Section id="recomendados" className="recommended-section">
            <AnimatedSection className="recommended-heading">
              <span className="section-index">SELEÇÃO VYNE</span>
              <h2>RELÓGIOS RECOMENDADOS</h2>
              <p>
                OS MODELOS QUE MELHOR REPRESENTAM NOSSA CURADORIA DE ESTILO, QUALIDADE E
                VALOR.
              </p>
            </AnimatedSection>
            <RecommendedMarquee products={products} onSelectProduct={setSelectedProduct} />
          </Section>

          <Section id="colecao" className="collection-section">
            <AnimatedSection className="collection-intro">
              <h2>ENCONTRE O RELÓGIO QUE COMBINA COM VOCÊ</h2>
              <p>
                EXPLORE DIFERENTES MARCAS, MECANISMOS E ESTILOS EM UMA EXPERIÊNCIA
                INTERATIVA.
              </p>
            </AnimatedSection>

            <ProductGalleryShowcase onSelectProduct={setSelectedProduct} />

            <div className="collection-action">
              <a className="button button-primary collection-primary-cta" href="/catalogo">
                EXPLORAR COLEÇÃO <span aria-hidden="true">→</span>
              </a>
              <small>* VALORES E DISPONIBILIDADE SÃO ILUSTRATIVOS.</small>
            </div>
          </Section>

          <Section id="sobre" className="brand-unified-section">
            <div className="brand-unified-grid">
              <AnimatedSection className="brand-unified-copy">
                <span className="section-index">A VYNE</span>
                <h2>AUTENTICIDADE, CURADORIA E ESCOLHA INTELIGENTE.</h2>
                <p>
                  A VYNE NÃO FABRICA RELÓGIOS. SELECIONA ORIGINAIS DE MARCAS RECONHECIDAS
                  PARA QUEM BUSCA QUALIDADE, CONFIANÇA E UMA RELAÇÃO MAIS INTELIGENTE ENTRE
                  PRODUTO, ESTILO E PREÇO.
                </p>
                <div className="brand-mini-wordmark" role="img" aria-label="Logomarca VYNE">
                  VYNE
                </div>
              </AnimatedSection>

              <div className="trust-list brand-trust-list">
                {trustPoints.map((point, index) => (
                  <m.article
                    key={point.index}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      duration: reduceMotion ? 0 : motionDurations.content,
                      delay: reduceMotion ? 0 : staggerDelay(index, 0.05),
                      ease: editorialEase,
                    }}
                  >
                    <span>{point.index}</span>
                    <div>
                      <h3>{point.title}</h3>
                      <p>{point.text}</p>
                    </div>
                  </m.article>
                ))}
              </div>
            </div>

            <div className="brand-principles" aria-label="Compromissos da VYNE">
              <div><strong>5</strong><span>MARCAS RECONHECIDAS</span></div>
              <div><strong>0</strong><span>RÉPLICAS NO CATÁLOGO</span></div>
              <div><strong>100%</strong><span>FOCO EM ORIGINALIDADE</span></div>
            </div>
          </Section>

          <Section className="final-cta">
            <div className="final-cta-glow" aria-hidden="true" />
            <AnimatedSection className="final-cta-inner">
              <span className="eyebrow">A ESCOLHA CERTA COMEÇA COM CONFIANÇA</span>
              <h2>ESCOLHA O SEU PRÓXIMO RELÓGIO.</h2>
              <p>ORIGINAIS SELECIONADOS PARA ACOMPANHAR O SEU RITMO.</p>
              <a className="button button-primary" href="/catalogo">
                EXPLORAR COLEÇÃO <span aria-hidden="true">→</span>
              </a>
            </AnimatedSection>
          </Section>
        </main>

        <SiteFooter />
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      </div>
    </LazyMotion>
  );
}
