"use client";

import dynamic from "next/dynamic";
import {
  AnimatePresence,
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
import GradualBlur from "@/components/GradualBlur";
import ResponsiveWatchImage from "@/components/ResponsiveWatchImage";
import SectionTransition, {
  type SectionTone,
} from "@/components/SectionTransition";
import StaggeredMenu from "@/components/StaggeredMenu";
import {
  editorialEase,
  motionDurations,
  staggerDelay,
} from "@/lib/motion";

const Aurora = dynamic(() => import("@/components/Aurora"), {
  ssr: false,
});

const CircularGallery = dynamic(() => import("@/components/CircularGallery"), {
  ssr: false,
});

const FloatingLines = dynamic(() => import("@/components/FloatingLines"), {
  ssr: false,
});

const heroLineGradient = ["#07110d", "#173629", "#3f7f5a", "#9da89f"];
const heroEnabledWaves: Array<"middle" | "bottom"> = ["middle", "bottom"];
const heroLineCount = [7, 6];
const heroLineDistance = [4.5, 5.5];
const heroMiddleWavePosition = { x: 1.7, y: -0.05, rotate: 0.28 };
const heroBottomWavePosition = { x: 1.1, y: -0.75, rotate: -0.52 };

type Product = {
  brand: string;
  model: string;
  descriptor: string;
  price: string;
  image: string;
  tag: string;
  specs: string[];
};

const products: Product[] = [
  {
    brand: "SEIKO",
    model: "5 Sports",
    descriptor: "Automático · presença esportiva",
    price: "R$ 2.490*",
    image:
      "https://images.unsplash.com/photo-1654544705636-2b6ddd388d96?auto=format&fit=crop&w=1800&q=88",
    tag: "Escolha do curador",
    specs: ["Movimento automático", "Caixa em aço", "Estilo versátil"],
  },
  {
    brand: "CASIO",
    model: "Vintage",
    descriptor: "Digital · design que atravessa gerações",
    price: "R$ 349*",
    image:
      "https://images.unsplash.com/photo-1622527241521-a48f190a35cc?auto=format&fit=crop&w=1400&q=88",
    tag: "Ícone acessível",
    specs: ["Display digital", "Bracelete metálico", "Perfil urbano"],
  },
  {
    brand: "CITIZEN",
    model: "Tsuyosa",
    descriptor: "Automático · cor e precisão",
    price: "R$ 2.790*",
    image:
      "https://images.unsplash.com/photo-1753620022899-f0aa1c34e331?auto=format&fit=crop&w=1600&q=88",
    tag: "Novo ritmo",
    specs: ["Movimento automático", "Mostrador marcante", "Aço integrado"],
  },
  {
    brand: "ORIENT",
    model: "Bambino",
    descriptor: "Clássico · elegância sem excesso",
    price: "R$ 1.890*",
    image:
      "https://images.unsplash.com/photo-1654544705636-2b6ddd388d96?auto=format&fit=crop&w=1500&q=88&sat=-22",
    tag: "Essencial clássico",
    specs: ["Estética clássica", "Perfil refinado", "Uso social"],
  },
  {
    brand: "TIMEX",
    model: "Q Reissue",
    descriptor: "Quartzo · herança reinterpretada",
    price: "R$ 1.290*",
    image:
      "https://images.unsplash.com/photo-1708651145401-6be804cd02d4?auto=format&fit=crop&w=1500&q=88",
    tag: "Design de arquivo",
    specs: ["Movimento a quartzo", "Caixa em aço", "Visual atemporal"],
  },
];

const galleryItems = products.map((product) => ({
  image: product.image,
  text: `${product.brand} · ${product.model}`,
}));

const menuItems = [
  { label: "Início", ariaLabel: "Ir para o início", link: "#inicio" },
  { label: "Coleção", ariaLabel: "Ver a coleção", link: "#colecao" },
  {
    label: "Autenticidade",
    ariaLabel: "Conhecer os compromissos de autenticidade",
    link: "#confianca",
  },
  { label: "A VYNE", ariaLabel: "Conhecer a VYNE", link: "#sobre" },
];

const brandNames = ["SEIKO", "CASIO", "CITIZEN", "ORIENT", "TIMEX"];

const trustPoints = [
  {
    index: "01",
    title: "Procedência clara",
    text: "Relógios originais, selecionados com critérios de procedência e informações apresentadas sem ambiguidade.",
  },
  {
    index: "02",
    title: "Garantia explicada",
    text: "Condições de garantia, conservação e suporte comunicadas antes da decisão de compra.",
  },
  {
    index: "03",
    title: "Preço inteligente",
    text: "Uma curadoria que aproxima modelos reconhecidos sem transformar sofisticação em exagero.",
  },
  {
    index: "04",
    title: "Atendimento humano",
    text: "Orientação para comparar mecanismos, proporções e estilos com segurança e tranquilidade.",
  },
];

function CinematicSection({
  children,
  className,
  id,
  ariaLabel,
  from = "black",
  to = "darkGreen",
}: {
  children: ReactNode;
  className: string;
  id?: string;
  ariaLabel?: string;
  from?: SectionTone;
  to?: SectionTone;
}) {
  return (
    <m.section
      className={`cinematic-section scroll-mt-24 ${className}`}
      id={id}
      aria-label={ariaLabel}
    >
      <SectionTransition from={from} to={to} intensity="subtle" />
      {children}
    </m.section>
  );
}

function useReducedEffects() {
  const [reducedEffects, setReducedEffects] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const update = () => setReducedEffects(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedEffects;
}

function ImageReveal({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 900px) 100vw, 55vw",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={`image-reveal ${className}`}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{
        duration: reduceMotion ? 0 : motionDurations.image,
        ease: editorialEase,
      }}
    >
      <ResponsiveWatchImage
        src={src}
        alt={alt}
        sizes={sizes}
        priority={priority}
      />
    </m.div>
  );
}

function AuroraBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const reduceMotion = useReducedMotion();
  const reducedEffects = useReducedEffects();

  useEffect(() => {
    const element = containerRef.current;
    if (!element || reduceMotion || reducedEffects) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: "320px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reduceMotion, reducedEffects]);

  return (
    <div
      ref={containerRef}
      className="final-cta-aurora"
      style={{ width: "1080px", height: "1080px", position: "absolute" }}
      aria-hidden="true"
    >
      {isNearViewport && !reduceMotion && !reducedEffects && (
        <Aurora
          colorStops={["#07110d", "#3f7f5a", "#d8d7d0"]}
          amplitude={0.68}
          blend={0.72}
        />
      )}
    </div>
  );
}

function ProductGalleryShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = containerRef.current;
    if (!element || reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: "360px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <AnimatedSection className="collection-gallery-shell">
      <div className="gallery-caption">
        <div>
          <span className="gallery-caption-kicker">Relógios disponíveis</span>
          <strong>Arraste para explorar</strong>
        </div>
        <p>Use o gesto horizontal ou as setas do teclado.</p>
      </div>

      <div className="gallery-stage" ref={containerRef}>
        {reduceMotion ? (
          <div
            className="gallery-static"
            role="region"
            aria-label="Relógios disponíveis"
          >
            {products.map((product) => (
              <article key={`static-${product.brand}-${product.model}`}>
                <ResponsiveWatchImage
                  src={product.image}
                  alt={`${product.brand} ${product.model}`}
                  sizes="(max-width: 640px) 82vw, 38vw"
                />
                <span>{product.brand}</span>
                <strong>{product.model}</strong>
              </article>
            ))}
          </div>
        ) : isNearViewport ? (
          <CircularGallery
            items={galleryItems}
            bend={2.7}
            textColor="#f1efe8"
            borderRadius={0.055}
            scrollSpeed={2}
            scrollEase={0.065}
          />
        ) : (
          <div className="gallery-placeholder" aria-hidden="true" />
        )}
      </div>
    </AnimatedSection>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const reduceMotion = useReducedMotion();
  const reducedEffects = useReducedEffects();
  const { scrollY, scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.25,
  });
  useMotionValueEvent(scrollY, "change", (latest) => {
    const nextState = latest > 54;
    setScrolled((current) => (current === nextState ? current : nextState));
  });

  useEffect(() => {
    document.body.classList.toggle("is-locked", Boolean(selectedProduct));

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelectedProduct(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("is-locked");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedProduct]);

  return (
    <LazyMotion features={domAnimation}>
      <div className="site-shell">
        <m.div
          className="scroll-progress"
          style={{ scaleX: smoothProgress }}
          aria-hidden="true"
        />

        <StaggeredMenu
          items={menuItems}
          position="right"
          colors={["#0b2117", "#173629", "#294738"]}
          accentColor="#3f9b6b"
          menuButtonColor="#f1efe8"
          openMenuButtonColor="#f1efe8"
          displayItemNumbering
          displaySocials={false}
          closeOnClickAway
          isFixed
          scrolled={scrolled}
        />

        <main>
          <section className="hero signature-hero" id="inicio">
            <m.div
              className="signature-hero-media"
              initial={reduceMotion ? false : { opacity: 0, scale: 1.012 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: editorialEase }}
            >
              <ResponsiveWatchImage
                src="/og.png"
                alt="VYNE — Relógios originais. Escolhas com intenção."
                sizes="100vw"
                priority
              />
            </m.div>

            <div className="signature-hero-model-shade" aria-hidden="true" />

            {!reduceMotion && !reducedEffects && (
              <div className="signature-hero-floating-lines">
                <FloatingLines
                  linesGradient={heroLineGradient}
                  enabledWaves={heroEnabledWaves}
                  lineCount={heroLineCount}
                  lineDistance={heroLineDistance}
                  middleWavePosition={heroMiddleWavePosition}
                  bottomWavePosition={heroBottomWavePosition}
                  animationSpeed={0.42}
                  interactive
                  bendRadius={4.6}
                  bendStrength={-0.65}
                  mouseDamping={0.075}
                  parallax
                  parallaxStrength={0.12}
                  mixBlendMode="screen"
                />
              </div>
            )}

            <div className="signature-hero-model-positioner">
              <m.div
                className="signature-hero-model-stage"
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: 20, scale: 0.98 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : motionDurations.image,
                  delay: reduceMotion ? 0 : 0.16,
                  ease: editorialEase,
                }}
              >
                <div className="signature-hero-model-label">
                  <span>Visualização 3D</span>
                  <i />
                  <small>Arraste para explorar</small>
                </div>

                <iframe
                  className="signature-hero-sketchfab"
                  title="Relógio Seiko Coutura 3D interativo"
                  src={`https://sketchfab.com/models/0796e23ab5c0448c9bdf3fe5c3b3e362/embed?autostart=1&camera=0&scrollwheel=0&ui_infos=0&ui_stop=0&ui_hint=0&ui_help=0&ui_settings=0&ui_inspector=0&ui_vr=0&ui_ar=0&dnt=1&transparent=1&max_texture_size=${reducedEffects ? 1024 : 2048}&ui_theme=dark`}
                  loading="eager"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  allowFullScreen
                />
                <div className="signature-hero-viewer-mask" aria-hidden="true" />
              </m.div>
            </div>

            <div className="signature-mobile-copy">
              <i />
              <span>Relógios originais. Escolhas com intenção.</span>
              <a className="signature-mobile-cta button button-primary" href="#colecao">
                Explorar coleção
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </section>

          <CinematicSection
            className="editorial-intro"
            id="essencia"
            from="darkGreen"
            to="blackGreen"
          >
            <AnimatedSection className="editorial-intro-copy">
              <span className="section-index">01 / Essência</span>
              <h2>
                <span>Luxo acessível não é parecer mais.</span>
                <em>É escolher melhor.</em>
              </h2>
              <p>
                A VYNE aproxima você de relógios originais de marcas que já
                conquistaram confiança, com uma experiência serena, clara e
                visualmente precisa.
              </p>
            </AnimatedSection>
          </CinematicSection>

          <CinematicSection
            className="brand-rail"
            ariaLabel="Marcas disponíveis"
            from="black"
            to="black"
          >
            <span className="brand-rail-label">Marcas selecionadas</span>
            <div className="brand-rail-list">
              {brandNames.map((brand, index) => (
                <m.span
                  key={brand}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: reduceMotion ? 0 : motionDurations.content,
                    delay: reduceMotion ? 0 : staggerDelay(index),
                    ease: editorialEase,
                  }}
                >
                  {brand}
                </m.span>
              ))}
            </div>
          </CinematicSection>

          <CinematicSection
            className="collection-section"
            id="colecao"
            from="black"
            to="black"
          >
            <AnimatedSection className="collection-heading">
              <div>
                <span className="section-index">02 / Coleção</span>
                <span className="eyebrow">Uma curadoria para cada ritmo</span>
              </div>
              <h2>
                Relógios com história.
                <em>Escolhas com intenção.</em>
              </h2>
              <p>
                Modelos organizados por presença, mecanismo e ocasião — para
                você comparar menos ruído e mais significado.
              </p>
            </AnimatedSection>

            <ProductGalleryShowcase />

            <div className="product-grid">
              {products.map((product, index) => (
                <m.article
                  className={`product-card ${index === 0 ? "product-featured" : ""}`}
                  key={`${product.brand}-${product.model}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.14 }}
                  transition={{
                    duration: reduceMotion ? 0 : motionDurations.content,
                    delay: reduceMotion ? 0 : (index % 2) * 0.07,
                    ease: editorialEase,
                  }}
                >
                  <button
                    className="product-card-button"
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    aria-label={`Ver detalhes de ${product.brand} ${product.model}`}
                  >
                    <m.div
                      className="product-image"
                      layoutId={`watch-image-${product.brand}-${product.model}`}
                    >
                      <ResponsiveWatchImage
                        src={product.image}
                        alt={`Imagem ilustrativa do ${product.brand} ${product.model}`}
                        sizes={
                          index === 0
                            ? "(max-width: 900px) 100vw, 88vw"
                            : "(max-width: 900px) 100vw, 44vw"
                        }
                      />
                      <span className="product-shade" aria-hidden="true" />
                      <span className="product-tag">{product.tag}</span>
                      <span className="image-note">Imagem ilustrativa</span>
                    </m.div>
                    <div className="product-info">
                      <div>
                        <span className="product-brand">{product.brand}</span>
                        <h3>{product.model}</h3>
                        <p>{product.descriptor}</p>
                      </div>
                      <div className="product-price-wrap">
                        <span>A partir de</span>
                        <strong>{product.price}</strong>
                      </div>
                      <span className="product-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </div>
                  </button>
                </m.article>
              ))}
            </div>

            <p className="catalog-disclaimer">
              * Produtos, valores e disponibilidade são ilustrativos. A versão
              comercial deve refletir catálogo, estoque, garantia e condições
              reais da VYNE.
            </p>
          </CinematicSection>

          <CinematicSection
            className="manifesto-section"
            from="black"
            to="darkGreen"
          >
            <m.div
              className="manifesto-media"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: reduceMotion ? 0 : motionDurations.image,
                ease: editorialEase,
              }}
            >
              <ResponsiveWatchImage
                src="https://images.unsplash.com/photo-1654544705636-2b6ddd388d96?auto=format&fit=crop&w=2200&q=92"
                alt="Detalhe editorial de um relógio de aço"
                sizes="100vw"
              />
              <div className="manifesto-shade" aria-hidden="true" />
            </m.div>
            <AnimatedSection className="manifesto-copy">
              <span className="section-index section-index-light">03 / Perspectiva</span>
              <span className="eyebrow">O detalhe muda tudo</span>
              <h2>
                O relógio certo não exibe uma vida.
                <em>Ele acompanha a sua.</em>
              </h2>
              <p>
                No trabalho, nos encontros e nas conquistas, a escolha ideal
                equilibra proporção, materiais e personalidade. A VYNE torna
                essa decisão mais simples — sem tornar o produto comum.
              </p>
              <a className="text-link" href="#sobre">
                Conheça nossa visão
                <span aria-hidden="true">→</span>
              </a>
            </AnimatedSection>
          </CinematicSection>

          <CinematicSection
            className="confidence-section"
            id="confianca"
            from="darkGreen"
            to="black"
          >
            <AnimatedSection className="confidence-heading">
              <span className="section-index">04 / Autenticidade</span>
              <h2>
                Confiança não é um selo visual.
                <em>É uma prática verificável.</em>
              </h2>
              <p>
                Antes do acabamento, vem a clareza. Cada ponto da experiência
                deve reduzir dúvidas e sustentar a decisão.
              </p>
            </AnimatedSection>

            <div className="trust-grid">
              {trustPoints.map((point, index) => (
                <m.article
                  className="trust-card"
                  key={point.index}
                  initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: reduceMotion ? 0 : motionDurations.content,
                    delay: reduceMotion ? 0 : staggerDelay(index),
                    ease: editorialEase,
                  }}
                >
                  <span>{point.index}</span>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                  <i aria-hidden="true" />
                </m.article>
              ))}
            </div>
          </CinematicSection>

          <CinematicSection
            className="about-section"
            id="sobre"
            from="black"
            to="darkGreen"
          >
            <ImageReveal
              className="about-image"
              src="https://images.unsplash.com/photo-1708651145401-6be804cd02d4?auto=format&fit=crop&w=1800&q=90"
              alt="Relógio em composição editorial escura"
            />
            <AnimatedSection className="about-copy">
              <span className="section-index section-index-light">05 / A VYNE</span>
              <span className="eyebrow">Relojoaria digital independente</span>
              <h2>Reconhecimento de marca. Liberdade de escolha.</h2>
              <p>
                A VYNE não fabrica relógios. Seleciona originais de Seiko,
                Casio, Citizen, Orient e Timex para quem busca elegância
                autêntica e uma relação mais inteligente entre produto e preço.
              </p>
              <div className="about-signals" aria-label="Compromissos da VYNE">
                <div>
                  <strong>5</strong>
                  <span>marcas reconhecidas</span>
                </div>
                <div>
                  <strong>0</strong>
                  <span>réplicas no catálogo</span>
                </div>
                <div>
                  <strong>100%</strong>
                  <span>foco em originalidade</span>
                </div>
              </div>
            </AnimatedSection>
          </CinematicSection>

          <CinematicSection
            className="final-cta"
            from="darkGreen"
            to="black"
          >
            <AuroraBackdrop />
            <div className="final-cta-glow" aria-hidden="true" />
            <AnimatedSection className="final-cta-inner">
              <span className="eyebrow">A escolha certa começa com confiança</span>
              <h2>
                Sofisticação real.
                <em>Preço inteligente.</em>
              </h2>
              <p>
                Descubra relógios originais escolhidos para acompanhar o seu
                estilo, o seu momento e o seu ritmo.
              </p>
              <a className="button button-primary button-large" href="#colecao">
                Explorar a coleção
                <span aria-hidden="true">↗</span>
              </a>
            </AnimatedSection>
          </CinematicSection>
        </main>

        <footer className="site-footer">
          <div className="footer-brand">
            <a className="footer-logo" href="#inicio">
              VYNE
            </a>
            <p>Relógios originais. Escolhas com intenção.</p>
          </div>
          <div className="footer-links">
            <div>
              <span>Explorar</span>
              <a href="#colecao">Coleção</a>
              <a href="#confianca">Autenticidade</a>
              <a href="#sobre">A VYNE</a>
            </div>
            <div>
              <span>Marcas</span>
              <a href="#colecao">Seiko</a>
              <a href="#colecao">Casio</a>
              <a href="#colecao">Citizen · Orient · Timex</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 VYNE. Experiência digital independente.</span>
            <span>Imagens editoriais: Unsplash · Produtos ilustrativos</span>
            <span>
              Modelo 3D “Seiko Watch” por{" "}
              <a
                href="https://sketchfab.com/3d-models/seiko-watch-0796e23ab5c0448c9bdf3fe5c3b3e362"
                target="_blank"
                rel="noopener noreferrer"
              >
                carloshisserich, via Sketchfab
              </a>{" "}
              · Licença CC BY 4.0
            </span>
          </div>
        </footer>

        {!reducedEffects && !reduceMotion && (
          <GradualBlur
            className="page-gradual-blur"
            preset="subtle"
            target="page"
            position="bottom"
            height="5.5rem"
            tabletHeight="4.5rem"
            desktopHeight="5.5rem"
            strength={2.1}
            divCount={4}
            curve="ease-in-out"
            opacity={0.52}
            responsive
            gpuOptimized
            zIndex={-25}
          />
        )}

        <AnimatePresence>
          {selectedProduct && (
            <m.div
              className="product-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.3 }}
              onClick={() => setSelectedProduct(null)}
            >
              <m.div
                className="modal-panel"
                initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.99 }}
                transition={{ duration: reduceMotion ? 0 : 0.55, ease: editorialEase }}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  className="modal-close"
                  type="button"
                  aria-label="Fechar detalhes do produto"
                  onClick={() => setSelectedProduct(null)}
                >
                  <span />
                  <span />
                </button>
                <m.div
                  className="modal-image"
                  layoutId={`watch-image-${selectedProduct.brand}-${selectedProduct.model}`}
                >
                  <ResponsiveWatchImage
                    src={selectedProduct.image}
                    alt={`Imagem ilustrativa do ${selectedProduct.brand} ${selectedProduct.model}`}
                    sizes="(max-width: 900px) calc(100vw - 24px), 55vw"
                  />
                  <span>Imagem ilustrativa</span>
                </m.div>
                <div className="modal-copy">
                  <span className="product-brand">{selectedProduct.brand}</span>
                  <h2 id="modal-title">{selectedProduct.model}</h2>
                  <p>{selectedProduct.descriptor}</p>
                  <ul>
                    {selectedProduct.specs.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                  <div className="modal-price">
                    <span>Condição demonstrativa</span>
                    <strong>{selectedProduct.price}</strong>
                  </div>
                  <a
                    className="button button-primary"
                    href="#confianca"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Ver compromisso VYNE
                    <span aria-hidden="true">↗</span>
                  </a>
                  <small>
                    Confirme modelo, especificações, estoque, garantia e
                    condições antes da publicação comercial.
                  </small>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
