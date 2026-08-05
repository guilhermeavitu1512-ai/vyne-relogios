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
import ResponsiveWatchImage from "@/components/ResponsiveWatchImage";
import SiteFooter from "@/components/SiteFooter";
import StaggeredMenu from "@/components/StaggeredMenu";
import { brandNames, products } from "@/lib/products";
import { editorialEase, motionDurations, staggerDelay } from "@/lib/motion";

const CircularGallery = dynamic(() => import("@/components/CircularGallery"), {
  ssr: false,
});

const FloatingLines = dynamic(() => import("@/components/FloatingLines"), {
  ssr: false,
});

const heroLineGradient = ["#07110d", "#173629", "#3f7f5a", "#a9b5ad"];
const heroEnabledWaves: Array<"middle" | "bottom"> = ["middle", "bottom"];
const heroLineCount = [6, 5];
const heroLineDistance = [5, 6];
const heroMiddleWavePosition = { x: 1.45, y: -0.08, rotate: 0.22 };
const heroBottomWavePosition = { x: 1.05, y: -0.72, rotate: -0.48 };

const menuItems = [
  { label: "Início", ariaLabel: "Ir para o início", link: "/#inicio" },
  { label: "Coleção", ariaLabel: "Ver o catálogo completo", link: "/catalogo" },
  {
    label: "Autenticidade",
    ariaLabel: "Conhecer os compromissos da VYNE",
    link: "/#confianca",
  },
  { label: "A VYNE", ariaLabel: "Conhecer a VYNE", link: "/#sobre" },
];

const trustPoints = [
  {
    index: "01",
    title: "Procedência clara",
    text: "Originais selecionados com informações apresentadas sem ambiguidade.",
  },
  {
    index: "02",
    title: "Garantia explicada",
    text: "Condições de garantia e suporte comunicadas antes da decisão.",
  },
  {
    index: "03",
    title: "Preço inteligente",
    text: "Modelos reconhecidos com uma relação mais equilibrada entre valor e escolha.",
  },
  {
    index: "04",
    title: "Atendimento humano",
    text: "Orientação para comparar mecanismos, proporções e estilos com segurança.",
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

function ProductGalleryShowcase() {
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
          <span>Exploração interativa</span>
          <strong>Arraste para descobrir</strong>
        </div>
        <p>Use o gesto horizontal ou as setas do teclado.</p>
      </div>
      <div className="gallery-stage" ref={containerRef}>
        {reduceMotion ? (
          <div className="gallery-static" role="region" aria-label="Relógios disponíveis">
            {products.map((product) => (
              <article key={`${product.brand}-${product.model}`}>
                <div>
                  <ResponsiveWatchImage
                    src={product.image}
                    alt={`${product.brand} ${product.model}`}
                    sizes="78vw"
                  />
                </div>
                <span>{product.brand}</span>
                <strong>{product.model}</strong>
              </article>
            ))}
          </div>
        ) : ready ? (
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
    </div>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
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

        <StaggeredMenu
          items={menuItems}
          headerLinks={[
            { label: "Catálogo", link: "/catalogo" },
            { label: "Buscar", link: "/catalogo#filtros" },
          ]}
          position="right"
          accentColor="#4c9b70"
          menuButtonColor="#f1efe8"
          openMenuButtonColor="#f1efe8"
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
                  animationSpeed={0.34}
                  interactive
                  bendRadius={4.8}
                  bendStrength={-0.58}
                  mouseDamping={0.08}
                  parallax
                  parallaxStrength={0.1}
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
                  transition={{ duration: reduceMotion ? 0 : 0.85, ease: editorialEase }}
                >
                  <span className="eyebrow">Curadoria independente · Relógios originais</span>
                  <h1 id="hero-title">
                    Sofisticação real.
                    <em>Preço inteligente.</em>
                  </h1>
                  <p>
                    Seiko, Casio, Citizen, Orient e Timex selecionados para quem procura
                    autenticidade, elegância e uma compra mais consciente.
                  </p>
                  <div className="hero-actions">
                    <a className="button button-primary" href="/catalogo">
                      Explorar coleção <span aria-hidden="true">↗</span>
                    </a>
                    <a className="text-link" href="#confianca">
                      Como garantimos confiança <span aria-hidden="true">↓</span>
                    </a>
                  </div>
                </m.div>

                <m.div
                  className="hero-model"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.9, delay: 0.12, ease: editorialEase }}
                >
                  <div className="model-caption">
                    <span>Visualização 3D</span>
                    <i />
                    <small>Arraste para explorar</small>
                  </div>
                  <div className="hero-model-viewport">
                    <iframe
                      className="hero-sketchfab"
                      title="Relógio Seiko em visualização 3D interativa"
                      src={`https://sketchfab.com/models/0796e23ab5c0448c9bdf3fe5c3b3e362/embed?autostart=1&camera=0&scrollwheel=0&ui_infos=0&ui_controls=0&ui_stop=0&ui_hint=0&ui_help=0&ui_settings=0&ui_inspector=0&ui_fullscreen=0&ui_watermark=0&ui_watermark_link=0&ui_vr=0&ui_ar=0&dnt=1&transparent=1&max_texture_size=${compactEffects ? 1024 : 2048}&ui_theme=dark`}
                      loading="eager"
                      allow="autoplay; fullscreen; xr-spatial-tracking"
                      allowFullScreen
                    />
                  </div>
                </m.div>
              </div>
            </div>

            <div className="hero-scroll-cue" aria-hidden="true">
              <span>Deslize para descobrir</span>
              <i />
            </div>
          </section>

          <Section id="essencia" className="essence-section">
            <AnimatedSection className="essence-copy">
              <span className="section-index">01 · Essência</span>
              <h2>Luxo acessível é escolher melhor.</h2>
              <p>
                A VYNE aproxima você de marcas reconhecidas com uma experiência clara,
                serena e precisa — sem transformar sofisticação em exagero.
              </p>
            </AnimatedSection>
            <div className="brand-line" aria-label="Marcas selecionadas">
              <span>Marcas selecionadas</span>
              <div>
                {brandNames.map((brand, index) => (
                  <m.strong
                    key={brand}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: reduceMotion ? 0 : motionDurations.content,
                      delay: reduceMotion ? 0 : staggerDelay(index, 0.05),
                      ease: editorialEase,
                    }}
                  >
                    {brand}
                  </m.strong>
                ))}
              </div>
            </div>
          </Section>

          <Section id="colecao" className="collection-section">
            <AnimatedSection className="section-heading split-heading">
              <div>
                <span className="section-index">02 · Coleção</span>
                <h2>Uma curadoria para cada ritmo.</h2>
              </div>
              <div>
                <p>
                  Modelos organizados por presença, mecanismo e ocasião para você comparar
                  menos ruído e mais significado.
                </p>
                <a className="text-link" href="/catalogo">
                  Ver catálogo completo <span aria-hidden="true">→</span>
                </a>
              </div>
            </AnimatedSection>

            <ProductGalleryShowcase />

            <div className="featured-products" aria-label="Produtos em destaque">
              {products.slice(0, 3).map((product, index) => (
                <m.article
                  className="featured-card"
                  key={`${product.brand}-${product.model}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{
                    duration: reduceMotion ? 0 : motionDurations.content,
                    delay: reduceMotion ? 0 : index * 0.07,
                    ease: editorialEase,
                  }}
                >
                  <a href={`/catalogo?busca=${encodeURIComponent(`${product.brand} ${product.model}`)}`}>
                    <div className="featured-image">
                      <ResponsiveWatchImage
                        src={product.image}
                        alt={`Imagem ilustrativa do ${product.brand} ${product.model}`}
                        sizes="(max-width: 700px) 82vw, 31vw"
                      />
                      <span>{product.tag}</span>
                    </div>
                    <div className="featured-info">
                      <span>{product.brand}</span>
                      <h3>{product.model}</h3>
                      <p>{product.descriptor}</p>
                      <strong>{product.price}</strong>
                    </div>
                  </a>
                </m.article>
              ))}
            </div>

            <div className="collection-action">
              <a className="button button-secondary" href="/catalogo">
                Ver todos os relógios <span aria-hidden="true">→</span>
              </a>
              <small>* Valores e disponibilidade são ilustrativos.</small>
            </div>
          </Section>

          <Section id="confianca" className="trust-section">
            <div className="trust-media">
              <ResponsiveWatchImage
                src="https://images.unsplash.com/photo-1654544705636-2b6ddd388d96?auto=format&fit=crop&w=2200&q=92"
                alt="Detalhe editorial de um relógio de aço"
                sizes="(max-width: 900px) 100vw, 50vw"
              />
              <span aria-hidden="true" />
            </div>
            <div className="trust-content">
              <AnimatedSection className="section-heading">
                <span className="section-index">03 · Autenticidade</span>
                <h2>Confiança é uma prática verificável.</h2>
                <p>Cada ponto da experiência deve reduzir dúvidas e sustentar a decisão.</p>
              </AnimatedSection>
              <div className="trust-list">
                {trustPoints.map((point, index) => (
                  <m.article
                    key={point.index}
                    initial={reduceMotion ? false : { opacity: 0, y: 18 }}
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
          </Section>

          <Section id="sobre" className="about-section">
            <AnimatedSection className="about-copy">
              <span className="section-index">04 · A VYNE</span>
              <h2>Reconhecimento de marca. Liberdade de escolha.</h2>
              <p>
                A VYNE não fabrica relógios. Seleciona originais de marcas reconhecidas
                para quem busca elegância autêntica e uma relação mais inteligente entre
                produto e preço.
              </p>
              <a className="text-link" href="/catalogo">
                Conhecer a curadoria <span aria-hidden="true">→</span>
              </a>
            </AnimatedSection>
            <div className="brand-principles" aria-label="Compromissos da VYNE">
              <div><strong>5</strong><span>marcas reconhecidas</span></div>
              <div><strong>0</strong><span>réplicas no catálogo</span></div>
              <div><strong>100%</strong><span>foco em originalidade</span></div>
            </div>
          </Section>

          <Section className="final-cta">
            <div className="final-cta-glow" aria-hidden="true" />
            <AnimatedSection className="final-cta-inner">
              <span className="eyebrow">A escolha certa começa com confiança</span>
              <h2>Sofisticação real. <em>Preço inteligente.</em></h2>
              <p>Descubra relógios originais escolhidos para acompanhar o seu ritmo.</p>
              <a className="button button-primary" href="/catalogo">
                Explorar coleção <span aria-hidden="true">↗</span>
              </a>
            </AnimatedSection>
          </Section>
        </main>

        <SiteFooter />
      </div>
    </LazyMotion>
  );
}
