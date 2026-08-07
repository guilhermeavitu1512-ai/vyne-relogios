"use client";

import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import FreeShippingBanner from "@/components/FreeShippingBanner";
import ProductQuickView from "@/components/ProductQuickView";
import RecommendedMarquee from "@/components/RecommendedMarquee";
import SiteFooter from "@/components/SiteFooter";
import StaggeredMenu from "@/components/StaggeredMenu";
import { products, type Product } from "@/lib/products";
import { editorialEase, motionDurations, staggerDelay } from "@/lib/motion";
import VyneNeonLogo from "@/components/VyneNeonLogo";

const menuItems = [
  { label: "Início", ariaLabel: "Ir para o início", link: "/#inicio" },
  {
    label: "Recomendados",
    ariaLabel: "Ver relógios recomendados",
    link: "/#recomendados",
  },
  { label: "Coleção", ariaLabel: "Explorar a coleção", link: "/#colecao" },
  { label: "Confiança", ariaLabel: "Conhecer os compromissos da VYNE", link: "/#sobre" },
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

function HeroIntro({ reduceMotion }: { reduceMotion: boolean }) {
  const [contentVisible, setContentVisible] = useState(reduceMotion);

  const revealContent = useCallback(() => {
    setContentVisible(true);
  }, []);

  return (
    <div className="hero-container hero-intro-container">
      <div className="hero-intro-stack">
        <m.div
          className="hero-video-lockup pointer-events-none"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: editorialEase }}
        >
          <VyneNeonLogo 
            onComplete={() => {
              if (!reduceMotion) {
                revealContent();
              }
            }} 
          />
        </m.div>

        <m.div
          className="hero-intro-copy"
          initial={false}
          animate={
            contentVisible
              ? { opacity: 1, y: 0, visibility: "visible" }
              : { opacity: 0, y: 18, visibility: "hidden" }
          }
          transition={{ duration: reduceMotion ? 0 : 0.65, ease: editorialEase }}
        >
          <span className="eyebrow">CURADORIA INDEPENDENTE · RELÓGIOS ORIGINAIS</span>
          <h1 id="hero-title">QUEM SOMOS NÓS?</h1>
          <p>
            A VYNE É UMA CURADORIA INDEPENDENTE DE RELÓGIOS ORIGINAIS, CRIADA PARA QUEM
            BUSCA PERSONALIDADE, QUALIDADE E ESCOLHAS MAIS INTELIGENTES.
          </p>
          <a className="button button-primary hero-intro-action" href="#recomendados">
            EXPLORAR RELÓGIOS
          </a>
        </m.div>
      </div>
    </div>
  );
}

function ProductGalleryShowcase({
  onSelectProduct,
}: {
  onSelectProduct: (product: Product) => void;
}) {
  return (
    <div className="gallery-module">
      <div className="gallery-caption">
        <div>
          <span>EXPLORAÇÃO INTERATIVA</span>
          <strong>ARRASTE PARA DESCOBRIR</strong>
        </div>
        <p>USE O GESTO HORIZONTAL OU AS SETAS DO TECLADO.</p>
      </div>
      <RecommendedMarquee
        products={products}
        onSelectProduct={onSelectProduct}
        variant="gallery"
      />
    </div>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
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
          <section
            className="hero vyne-intro-hero"
            id="inicio"
            aria-labelledby="hero-title"
          >
            <div className="hero-intro-glow" aria-hidden="true" />
            <HeroIntro reduceMotion={reduceMotion} />
          </section>

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

          <Section id="sobre" className="brand-unified-section confidence-section">
            <div className="brand-unified-grid confidence-grid">
              <AnimatedSection className="brand-unified-copy">
                <span className="section-index">CONFIANÇA VYNE</span>
                <h2>ESCOLHAS SEGURAS, DO CATÁLOGO À COMPRA.</h2>
                <p>
                  CADA MODELO É APRESENTADO COM CLAREZA PARA VOCÊ COMPARAR, ESCOLHER E
                  COMPRAR COM MAIS SEGURANÇA.
                </p>
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
        <ProductQuickView product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      </div>
    </LazyMotion>
  );
}
