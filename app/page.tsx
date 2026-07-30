"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import GradualBlur from "@/components/GradualBlur";

const MagicRings = dynamic(() => import("@/components/MagicRings"), {
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
      "https://images.unsplash.com/photo-1654544705636-2b6ddd388d96?auto=format&fit=crop&w=1400&q=88",
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
      "https://images.unsplash.com/photo-1753620022899-f0aa1c34e331?auto=format&fit=crop&w=1400&q=88",
    tag: "Novo ritmo",
    specs: ["Movimento automático", "Mostrador marcante", "Aço integrado"],
  },
  {
    brand: "ORIENT",
    model: "Bambino",
    descriptor: "Clássico · elegância sem excesso",
    price: "R$ 1.890*",
    image:
      "https://images.unsplash.com/photo-1654544705636-2b6ddd388d96?auto=format&fit=crop&w=1400&q=88&sat=-25",
    tag: "Essencial clássico",
    specs: ["Estética clássica", "Perfil refinado", "Uso social"],
  },
  {
    brand: "TIMEX",
    model: "Q Reissue",
    descriptor: "Quartzo · herança reinterpretada",
    price: "R$ 1.290*",
    image:
      "https://images.unsplash.com/photo-1708651145401-6be804cd02d4?auto=format&fit=crop&w=1400&q=88",
    tag: "Design de arquivo",
    specs: ["Movimento a quartzo", "Caixa em aço", "Visual atemporal"],
  },
];

const trustPoints = [
  {
    index: "01",
    title: "Originalidade sem atalhos",
    text: "Somente relógios originais. Nunca réplicas, cópias ou procedência ambígua.",
  },
  {
    index: "02",
    title: "Informação que orienta",
    text: "Detalhes importantes explicados com clareza, sem jargão para impressionar.",
  },
  {
    index: "03",
    title: "Preço com contexto",
    text: "Condições transparentes e comparação responsável — sem urgência artificial.",
  },
  {
    index: "04",
    title: "Responsabilidade real",
    text: "Uma experiência pensada para continuar coerente depois da compra.",
  },
];

const benefits = [
  {
    number: "01",
    title: "Curadoria, não acúmulo",
    text: "Modelos selecionados por estilo, ocasião e qualidade — não apenas por volume de catálogo.",
  },
  {
    number: "02",
    title: "Técnica traduzida",
    text: "Mecanismo, proporção e materiais explicados pelo impacto que fazem no seu uso.",
  },
  {
    number: "03",
    title: "Sofisticação próxima",
    text: "Uma experiência premium que respeita seu repertório, seu tempo e seu orçamento.",
  },
  {
    number: "04",
    title: "Escolha com significado",
    text: "O relógio certo não é necessariamente o mais caro. É aquele que acompanha o seu ritmo.",
  },
];

const brandNames = ["SEIKO", "CASIO", "CITIZEN", "ORIENT", "TIMEX"];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    revealItems.forEach((item) => observer.observe(item));

    const updateProgress = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      document.documentElement.style.setProperty(
        "--scroll-progress",
        String(progress),
      );
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProduct(null);
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedProduct]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <div className="scroll-progress" aria-hidden="true" />

      <header className="site-header">
        <div className="prototype-note">
          <span>CONCEITO V1.0</span>
          <span>Catálogo e condições ilustrativos</span>
        </div>

        <nav className="nav-wrap" aria-label="Navegação principal">
          <a className="wordmark" href="#inicio" aria-label="VYNE — início">
            VYNE
          </a>

          <div className="desktop-nav">
            <a href="#colecao">Coleção</a>
            <a href="#marcas">Marcas</a>
            <a href="#confianca">Confiança</a>
            <a href="#sobre">A VYNE</a>
          </div>

          <a className="nav-cta" href="#colecao">
            Explorar relógios
            <span aria-hidden="true">↗</span>
          </a>

          <button
            className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span />
            <span />
          </button>
        </nav>

        <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
          <a href="#colecao" onClick={closeMenu}>
            Coleção
          </a>
          <a href="#marcas" onClick={closeMenu}>
            Marcas
          </a>
          <a href="#confianca" onClick={closeMenu}>
            Confiança
          </a>
          <a href="#sobre" onClick={closeMenu}>
            A VYNE
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-grid-overlay" aria-hidden="true" />
          <div className="hero-orb hero-orb-one" aria-hidden="true" />
          <div className="hero-orb hero-orb-two" aria-hidden="true" />

          <div className="hero-copy">
            <div className="eyebrow hero-enter hero-enter-one">
              <span className="eyebrow-line" />
              Relojoaria digital multimarcas
            </div>

            <h1 className="hero-title hero-enter hero-enter-two">
              O tempo passa.
              <br />
              <em>Seu estilo fica.</em>
            </h1>

            <p className="hero-lead hero-enter hero-enter-three">
              Relógios originais de marcas reconhecidas, escolhidos com
              critério para quem busca sofisticação real e preço inteligente.
            </p>

            <div className="hero-actions hero-enter hero-enter-four">
              <a className="button button-primary" href="#colecao">
                Conhecer a seleção
                <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href="#confianca">
                Como construímos confiança
                <span aria-hidden="true">→</span>
              </a>
            </div>

            <div className="hero-proof hero-enter hero-enter-five">
              <div className="proof-stamp">
                <span className="proof-dot" />
                Compromisso VYNE
              </div>
              <p>
                Originalidade, clareza e responsabilidade em cada escolha.
              </p>
            </div>
          </div>

          <figure className="hero-visual" aria-label="Relógio em destaque">
            <div className="visual-halo" aria-hidden="true" />
            <div className="hero-magic-rings" aria-hidden="true">
              <MagicRings
                color="#53b8a9"
                colorTwo="#195b55"
                ringCount={7}
                speed={0.34}
                attenuation={13}
                lineThickness={1.15}
                baseRadius={0.2}
                radiusStep={0.072}
                scaleRate={0.055}
                opacity={0.58}
                blur={0.2}
                noiseAmount={0.018}
                rotation={-12}
                ringGap={1.38}
                fadeIn={0.85}
                fadeOut={1.08}
                followMouse={false}
                hoverScale={1}
                parallax={0.02}
                clickBurst={false}
              />
            </div>
            <img
              src="https://images.unsplash.com/photo-1753620022899-f0aa1c34e331?auto=format&fit=crop&w=1800&q=92"
              alt="Relógio de aço com mostrador verde sobre superfície escura"
              fetchPriority="high"
            />
            <div className="image-vignette" aria-hidden="true" />
            <GradualBlur
              className="hero-gradual-blur"
              target="parent"
              position="bottom"
              height="10rem"
              strength={2.4}
              divCount={7}
              curve="bezier"
              exponential
              opacity={0.82}
              zIndex={4}
            />

            <div className="hero-index">
              <span>01</span>
              <span className="index-line" />
              <span>05</span>
            </div>

            <figcaption>
              <span>Ritmo autêntico</span>
              <span>Precisão que acompanha a vida real</span>
            </figcaption>
          </figure>

          <a className="scroll-cue" href="#marcas" aria-label="Rolar para marcas">
            <span>Descobrir</span>
            <span className="scroll-line" aria-hidden="true" />
          </a>
        </section>

        <section className="trust-ribbon" aria-label="Compromissos da VYNE">
          <div className="trust-ribbon-inner">
            <span>100% originais</span>
            <i />
            <span>Marcas reconhecidas</span>
            <i />
            <span>Curadoria especializada</span>
            <i />
            <span>Condições transparentes</span>
          </div>
        </section>

        <section className="brands-section section-pad" id="marcas">
          <div className="section-heading reveal">
            <div>
              <span className="section-number">01</span>
              <span className="eyebrow">Marcas que atravessam o tempo</span>
            </div>
            <p>
              Cinco nomes reconhecidos. Uma curadoria independente para ajudar
              você a escolher pelo que realmente importa.
            </p>
          </div>

          <div className="brand-list reveal">
            {brandNames.map((brand, index) => (
              <div className="brand-name" key={brand}>
                <span>{brand}</span>
                <small>0{index + 1}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="collection-section section-pad" id="colecao">
          <div className="collection-intro reveal">
            <div>
              <span className="section-number">02</span>
              <span className="eyebrow">Seleção em destaque</span>
            </div>
            <h2>
              Relógios com presença.
              <br />
              <em>Escolhas com critério.</em>
            </h2>
            <p>
              Uma prévia conceitual de como a VYNE organiza modelos por
              intenção, estilo e momento — não apenas por preço.
            </p>
          </div>

          <div className="product-grid">
            {products.map((product, index) => (
              <article
                className={`product-card reveal ${
                  index === 0 || index === 3 ? "product-card-wide" : ""
                }`}
                key={`${product.brand}-${product.model}`}
              >
                <div className="product-image">
                  <img
                    src={product.image}
                    alt={`Imagem ilustrativa do ${product.brand} ${product.model}`}
                    loading="lazy"
                  />
                  <div className="product-shade" aria-hidden="true" />
                  <span className="product-tag">{product.tag}</span>
                  <span className="image-note">Imagem ilustrativa</span>
                </div>

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
                </div>

                <button
                  className="product-action"
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                >
                  Ver referência
                  <span aria-hidden="true">↗</span>
                </button>
              </article>
            ))}
          </div>

          <p className="catalog-disclaimer reveal">
            * Produtos, preços e disponibilidade apresentados apenas para
            demonstração do conceito visual. A publicação comercial depende do
            catálogo real e das condições aprovadas pela VYNE.
          </p>
        </section>

        <section className="story-section">
          <div className="story-image reveal">
            <img
              src="https://images.unsplash.com/photo-1654544705636-2b6ddd388d96?auto=format&fit=crop&w=1800&q=90"
              alt="Detalhe de relógio sobre superfície escura"
              loading="lazy"
            />
            <div className="story-image-overlay" aria-hidden="true" />
            <GradualBlur
              className="story-gradual-blur story-gradual-blur-desktop"
              target="parent"
              position="right"
              width="10rem"
              strength={2.1}
              divCount={7}
              curve="bezier"
              exponential
              opacity={0.72}
              zIndex={4}
            />
            <GradualBlur
              className="story-gradual-blur story-gradual-blur-mobile"
              target="parent"
              position="bottom"
              height="9rem"
              strength={2.1}
              divCount={7}
              curve="bezier"
              exponential
              opacity={0.76}
              zIndex={4}
            />
            <span>O detalhe muda tudo.</span>
          </div>

          <div className="story-copy reveal">
            <span className="section-number">03</span>
            <span className="eyebrow">Ritmo autêntico</span>
            <h2>
              O relógio certo não exibe uma vida.
              <br />
              <em>Ele acompanha a sua.</em>
            </h2>
            <p>
              Trabalho, movimento, encontros, conquistas. A VYNE aproxima você
              de relógios originais que combinam com a sua intenção — sem
              transformar conhecimento ou renda em códigos de exclusão.
            </p>
            <a className="text-link text-link-light" href="#sobre">
              Conheça a nossa visão
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section className="confidence-section section-pad" id="confianca">
          <div className="confidence-header reveal">
            <div>
              <span className="section-number">04</span>
              <span className="eyebrow">Confiança acima do discurso</span>
            </div>
            <h2>
              Originalidade precisa de evidência.
              <br />
              <em>Não de repetição.</em>
            </h2>
          </div>

          <div className="trust-grid">
            {trustPoints.map((point) => (
              <article className="trust-card reveal" key={point.index}>
                <span>{point.index}</span>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
                <div className="trust-card-line" />
              </article>
            ))}
          </div>

          <div className="confidence-statement reveal">
            <div className="statement-mark" aria-hidden="true">
              V
            </div>
            <p>
              “A VYNE não usa sofisticação para esconder informação. O cuidado
              percebido antes da compra precisa continuar depois dela.”
            </p>
            <span>Padrão de experiência VYNE</span>
          </div>
        </section>

        <section className="benefits-section section-pad">
          <div className="benefits-title reveal">
            <span className="section-number">05</span>
            <span className="eyebrow">Por que escolher a VYNE</span>
            <h2>
              Menos dúvida.
              <br />
              <em>Mais intenção.</em>
            </h2>
          </div>

          <div className="benefit-list">
            {benefits.map((benefit) => (
              <article className="benefit-item reveal" key={benefit.number}>
                <span>{benefit.number}</span>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
                <span className="benefit-arrow" aria-hidden="true">
                  ↗
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section section-pad" id="sobre">
          <div className="about-copy reveal">
            <span className="section-number">06</span>
            <span className="eyebrow">A VYNE</span>
            <h2>
              Uma relojoaria digital para quem escolhe com os próprios
              critérios.
            </h2>
            <p>
              A VYNE seleciona relógios originais de marcas reconhecidas para
              tornar uma compra cercada de dúvidas em uma escolha clara,
              contemporânea e confiável.
            </p>
          </div>

          <div className="signal-grid reveal" aria-label="Indicadores da VYNE">
            <div className="signal-card signal-card-accent">
              <strong>5</strong>
              <span>marcas em foco</span>
            </div>
            <div className="signal-card">
              <strong>1</strong>
              <span>especialidade: relógios</span>
            </div>
            <div className="signal-card">
              <strong>0</strong>
              <span>réplicas no catálogo</span>
            </div>
            <div className="signal-card">
              <strong>100%</strong>
              <span>produtos originais</span>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="cta-glow" aria-hidden="true" />
          <div className="cta-rings" aria-hidden="true" />
          <div className="final-cta-inner reveal">
            <span className="eyebrow">Seu próximo relógio começa pela escolha certa</span>
            <h2>
              Sofisticação real.
              <br />
              <em>Preço inteligente.</em>
            </h2>
            <p>
              Descubra uma seleção de relógios originais pensada para o seu
              estilo, o seu momento e o seu ritmo.
            </p>
            <a className="button button-primary button-large" href="#colecao">
              Explorar a seleção
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <a className="footer-logo" href="#inicio">
              VYNE
            </a>
            <p>Relógios originais. Ritmo autêntico.</p>
          </div>

          <div className="footer-links">
            <div>
              <span>Explorar</span>
              <a href="#colecao">Coleção</a>
              <a href="#marcas">Marcas</a>
              <a href="#confianca">Confiança</a>
            </div>
            <div>
              <span>Institucional</span>
              <a href="#sobre">A VYNE</a>
              <a href="#confianca">Autenticidade</a>
              <a href="#inicio">Atendimento</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 VYNE. Conceito de experiência digital.</span>
          <span>
            Imagens editoriais: Unsplash · Produtos e condições ilustrativos
          </span>
        </div>
      </footer>

      <GradualBlur
        className="page-gradual-blur"
        target="page"
        position="bottom"
        height="6rem"
        mobileHeight="4.5rem"
        tabletHeight="5rem"
        desktopHeight="6rem"
        strength={3.4}
        divCount={8}
        curve="bezier"
        exponential
        opacity={0.94}
        responsive
        gpuOptimized
        zIndex={-25}
      />

      {selectedProduct && (
        <div
          className="product-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setSelectedProduct(null)}
        >
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              aria-label="Fechar detalhes do produto"
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>

            <div className="modal-image">
              <img
                src={selectedProduct.image}
                alt={`Imagem ilustrativa do ${selectedProduct.brand} ${selectedProduct.model}`}
              />
              <span>Imagem ilustrativa</span>
            </div>

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
                Ver padrão de confiança
                <span aria-hidden="true">↗</span>
              </a>

              <small>
                Confirme modelo, especificações, estoque, garantia e condições
                antes da publicação comercial.
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
