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
import GradualBlur from "@/components/GradualBlur";

const Aurora = dynamic(() => import("@/components/Aurora"), {
  ssr: false,
});

const CircularGallery = dynamic(() => import("@/components/CircularGallery"), {
  ssr: false,
});

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

const editorialEase = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 38, filter: "blur(10px)" }
      }
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.9, delay, ease: editorialEase }}
    >
      {children}
    </m.div>
  );
}

function ImageReveal({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={`image-reveal ${className}`}
      initial={reduceMotion ? false : { opacity: 0, scale: 1.035 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 1.2, ease: editorialEase }}
    >
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
      {!reduceMotion && (
        <m.span
          className="image-reveal-curtain"
          aria-hidden="true"
          initial={{ scaleY: 1 }}
          whileInView={{ scaleY: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 1.05, delay: 0.08, ease: editorialEase }}
        />
      )}
    </m.div>
  );
}

function AuroraBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = containerRef.current;
    if (!element || reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: "320px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <div
      ref={containerRef}
      className="final-cta-aurora"
      style={{ width: "1080px", height: "1080px", position: "absolute" }}
      aria-hidden="true"
    >
      {isNearViewport && !reduceMotion && (
        <Aurora
          colorStops={["#ffffff", "#508000", "#bab1ff"]}
          amplitude={1.1}
          blend={0.5}
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
    <Reveal className="collection-gallery-shell">
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
                <img
                  src={product.image}
                  alt={`${product.brand} ${product.model}`}
                  loading="lazy"
                  decoding="async"
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
    </Reveal>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const reduceMotion = useReducedMotion();
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
    const locked = menuOpen || Boolean(selectedProduct);
    document.body.classList.toggle("is-locked", locked);

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setSelectedProduct(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("is-locked");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen, selectedProduct]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <LazyMotion features={domAnimation}>
      <div className="site-shell">
        <m.div
          className="scroll-progress"
          style={{ scaleX: smoothProgress }}
          aria-hidden="true"
        />

        <header
          className={`site-header ${scrolled ? "is-scrolled" : ""} ${
            menuOpen ? "menu-active" : ""
          }`}
        >
          <nav className="nav-wrap" aria-label="Navegação principal">
            <button
              className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
              type="button"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span />
              <span />
              <small>Menu</small>
            </button>

            <a className="wordmark" href="#inicio" aria-label="VYNE — início">
              VYNE
            </a>

            <div className="desktop-nav">
              <a href="#colecao">Relógios</a>
              <a href="#confianca">Autenticidade</a>
              <a href="#sobre">A VYNE</a>
            </div>

            <a className="nav-cta" href="#colecao">
              Explorar
              <span aria-hidden="true">↗</span>
            </a>
          </nav>

          <AnimatePresence>
            {menuOpen && (
              <m.div
                className="menu-panel"
                initial={{ opacity: 0, y: "-100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "-100%" }}
                transition={{ duration: reduceMotion ? 0 : 0.65, ease: editorialEase }}
              >
                <div className="menu-panel-inner">
                  <span className="menu-kicker">Navegue pela VYNE</span>
                  <div className="menu-links">
                    {[
                      ["01", "Início", "#inicio"],
                      ["02", "Coleção", "#colecao"],
                      ["03", "Autenticidade", "#confianca"],
                      ["04", "A VYNE", "#sobre"],
                    ].map(([number, label, href], index) => (
                      <m.a
                        key={href}
                        href={href}
                        onClick={closeMenu}
                        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.65,
                          delay: reduceMotion ? 0 : 0.18 + index * 0.08,
                          ease: editorialEase,
                        }}
                      >
                        <small>{number}</small>
                        <span>{label}</span>
                        <i aria-hidden="true">↗</i>
                      </m.a>
                    ))}
                  </div>
                  <div className="menu-foot">
                    <span>Relógios originais</span>
                    <span>Preço inteligente</span>
                    <span>Curadoria independente</span>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </header>

        <main>
          <section className="hero signature-hero" id="inicio">
            <m.div
              className="signature-hero-media"
              initial={reduceMotion ? false : { opacity: 0, scale: 1.012 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: editorialEase }}
            >
              <img
                src="/og.png"
                alt="VYNE — Relógios originais. Escolhas com intenção."
                fetchPriority="high"
                decoding="async"
              />
            </m.div>

            <div className="signature-mobile-copy" aria-hidden="true">
              <strong>VYNE</strong>
              <i />
              <span>Relógios originais. Escolhas com intenção.</span>
            </div>
          </section>

          <section className="editorial-intro" id="essencia">
            <Reveal className="editorial-intro-copy">
              <span className="section-index">01 / Essência</span>
              <h2>
                Luxo acessível não é parecer mais.
                <em>É escolher melhor.</em>
              </h2>
              <p>
                A VYNE aproxima você de relógios originais de marcas que já
                conquistaram confiança, com uma experiência serena, clara e
                visualmente precisa.
              </p>
            </Reveal>
          </section>

          <section className="brand-rail" aria-label="Marcas disponíveis">
            <span className="brand-rail-label">Marcas selecionadas</span>
            <div className="brand-rail-list">
              {brandNames.map((brand, index) => (
                <m.span
                  key={brand}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: reduceMotion ? 0 : index * 0.08,
                    ease: editorialEase,
                  }}
                >
                  {brand}
                </m.span>
              ))}
            </div>
          </section>

          <section className="collection-section" id="colecao">
            <Reveal className="collection-heading">
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
            </Reveal>

            <ProductGalleryShowcase />

            <div className="product-grid">
              {products.map((product, index) => (
                <m.article
                  className={`product-card ${index === 0 ? "product-featured" : ""}`}
                  key={`${product.brand}-${product.model}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 44 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.14 }}
                  transition={{
                    duration: 0.9,
                    delay: reduceMotion ? 0 : (index % 2) * 0.1,
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
                      <img
                        src={product.image}
                        alt={`Imagem ilustrativa do ${product.brand} ${product.model}`}
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
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
          </section>

          <section className="manifesto-section">
            <m.div
              className="manifesto-media"
              initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 1.25, ease: editorialEase }}
            >
              <img
                src="https://images.unsplash.com/photo-1654544705636-2b6ddd388d96?auto=format&fit=crop&w=2200&q=92"
                alt="Detalhe editorial de um relógio de aço"
                loading="lazy"
                decoding="async"
              />
              <div className="manifesto-shade" aria-hidden="true" />
            </m.div>
            <Reveal className="manifesto-copy">
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
            </Reveal>
          </section>

          <section className="confidence-section" id="confianca">
            <Reveal className="confidence-heading">
              <span className="section-index">04 / Autenticidade</span>
              <h2>
                Confiança não é um selo visual.
                <em>É uma prática verificável.</em>
              </h2>
              <p>
                Antes do acabamento, vem a clareza. Cada ponto da experiência
                deve reduzir dúvidas e sustentar a decisão.
              </p>
            </Reveal>

            <div className="trust-grid">
              {trustPoints.map((point, index) => (
                <m.article
                  className="trust-card"
                  key={point.index}
                  initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.75,
                    delay: reduceMotion ? 0 : index * 0.09,
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
          </section>

          <section className="about-section" id="sobre">
            <ImageReveal
              className="about-image"
              src="https://images.unsplash.com/photo-1708651145401-6be804cd02d4?auto=format&fit=crop&w=1800&q=90"
              alt="Relógio em composição editorial escura"
            />
            <Reveal className="about-copy">
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
            </Reveal>
          </section>

          <section className="final-cta">
            <AuroraBackdrop />
            <div className="final-cta-glow" aria-hidden="true" />
            <Reveal className="final-cta-inner">
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
            </Reveal>
          </section>
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
          </div>
        </footer>

        <GradualBlur
          className="page-gradual-blur"
          target="page"
          position="bottom"
          height="5.5rem"
          mobileHeight="4rem"
          tabletHeight="4.5rem"
          desktopHeight="5.5rem"
          strength={3.1}
          divCount={8}
          curve="bezier"
          exponential
          opacity={0.86}
          responsive
          gpuOptimized
          zIndex={-25}
        />

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
                  <img
                    src={selectedProduct.image}
                    alt={`Imagem ilustrativa do ${selectedProduct.brand} ${selectedProduct.model}`}
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
