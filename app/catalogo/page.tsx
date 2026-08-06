"use client";

import { useEffect, useMemo, useState } from "react";
import FreeShippingBanner from "@/components/FreeShippingBanner";
import ProductQuickView from "@/components/ProductQuickView";
import ResponsiveWatchImage from "@/components/ResponsiveWatchImage";
import SiteFooter from "@/components/SiteFooter";
import SpotlightCard from "@/components/SpotlightCard";
import StaggeredMenu from "@/components/StaggeredMenu";
import { brandNames, products, type Product } from "@/lib/products";

const menuItems = [
  { label: "Início", ariaLabel: "Voltar ao início", link: "/#inicio" },
  { label: "Recomendados", ariaLabel: "Ver relógios recomendados", link: "/#recomendados" },
  { label: "Coleção", ariaLabel: "Ver a coleção", link: "/#colecao" },
  { label: "A VYNE", ariaLabel: "Conhecer a VYNE", link: "/#sobre" },
];

const categories = ["Todos", "Automático", "Digital", "Quartzo"] as const;

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("Todas");
  const [category, setCategory] = useState<(typeof categories)[number]>("Todos");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSearch = params.get("busca");
    const requestedBrand = params.get("marca");
    const saved = localStorage.getItem("vyne-favorites");
    const syncState = window.requestAnimationFrame(() => {
      if (requestedSearch) setSearch(requestedSearch);
      if (requestedBrand && brandNames.includes(requestedBrand)) setBrand(requestedBrand);
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch {
          localStorage.removeItem("vyne-favorites");
        }
      }
    });
    return () => window.cancelAnimationFrame(syncState);
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        `${product.brand} ${product.model} ${product.descriptor}`
          .toLocaleLowerCase("pt-BR")
          .includes(term);
      const matchesBrand = brand === "Todas" || product.brand === brand;
      const matchesCategory = category === "Todos" || product.category === category;
      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [brand, category, search]);

  const toggleFavorite = (key: string) => {
    setFavorites((current) => {
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];
      localStorage.setItem("vyne-favorites", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="site-shell catalog-shell">
      <FreeShippingBanner />
      <StaggeredMenu
        items={menuItems}
        headerLinks={[
          { label: "Início", link: "/#inicio" },
          { label: "A VYNE", link: "/#sobre" },
        ]}
        accentColor="#a3fb06"
        menuButtonColor="#ffffff"
        openMenuButtonColor="#ffffff"
        closeOnClickAway
        isFixed
        scrolled
      />

      <main id="conteudo" className="catalog-main">
        <header className="catalog-hero">
          <span className="section-index">Coleção VYNE</span>
          <h1>Relógios escolhidos com intenção.</h1>
          <p>
            Explore modelos de marcas reconhecidas e encontre a combinação certa de
            mecanismo, presença e preço.
          </p>
        </header>

        <section className="catalog-tools" id="filtros" aria-label="Filtros do catálogo">
          <label className="catalog-search">
            <span>Buscar por marca ou modelo</span>
            <div>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex.: Seiko automático"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}>
                  Limpar
                </button>
              )}
            </div>
          </label>

          <div className="filter-group">
            <span>Marca</span>
            <div role="group" aria-label="Filtrar por marca">
              {["Todas", ...brandNames].map((item) => (
                <button
                  type="button"
                  aria-pressed={brand === item}
                  onClick={() => setBrand(item)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span>Mecanismo</span>
            <div role="group" aria-label="Filtrar por mecanismo">
              {categories.map((item) => (
                <button
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="catalog-results" aria-live="polite">
          <div className="catalog-results-bar">
            <span>
              {filteredProducts.length} {filteredProducts.length === 1 ? "resultado" : "resultados"}
            </span>
            <span id="favoritos">
              {favorites.length} {favorites.length === 1 ? "favorito" : "favoritos"}
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="catalog-grid">
              {filteredProducts.map((product) => {
                const key = `${product.brand}-${product.model}`;
                const isFavorite = favorites.includes(key);
                return (
                  <SpotlightCard as="article" className="catalog-card" key={key}>
                    <button
                      className="catalog-card-trigger"
                      type="button"
                      aria-label={`Ver detalhes e comprar ${product.brand} ${product.model}`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="catalog-card-image">
                        <ResponsiveWatchImage
                          src={product.image}
                          alt={`Imagem ilustrativa do ${product.brand} ${product.model}`}
                          sizes="(max-width: 700px) 100vw, 50vw"
                        />
                        <span className="catalog-card-tag">{product.tag}</span>
                      </div>
                      <div className="catalog-card-copy">
                        <span>{product.brand}</span>
                        <h2>{product.model}</h2>
                        <p>{product.descriptor}</p>
                        <ul>
                          {product.specs.map((spec) => <li key={spec}>{spec}</li>)}
                        </ul>
                        <div>
                          <span className="catalog-card-price">
                            <small>A partir de</small>
                            <strong>{product.price}</strong>
                          </span>
                          <span className="catalog-card-action">
                            Ver detalhes <span aria-hidden="true">→</span>
                          </span>
                        </div>
                      </div>
                    </button>
                    <button
                      className="favorite-button"
                      type="button"
                      aria-label={`${isFavorite ? "Remover" : "Adicionar"} ${product.brand} ${product.model} ${isFavorite ? "dos" : "aos"} favoritos`}
                      aria-pressed={isFavorite}
                      onClick={() => toggleFavorite(key)}
                    >
                      <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
                    </button>
                  </SpotlightCard>
                );
              })}
            </div>
          ) : (
            <div className="catalog-empty">
              <h2>Nenhum relógio encontrado.</h2>
              <p>Experimente limpar a busca ou selecionar outra combinação de filtros.</p>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setSearch("");
                  setBrand("Todas");
                  setCategory("Todos");
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}

          <p className="catalog-disclaimer">
            * Produtos, valores e disponibilidade são ilustrativos. A versão comercial
            deve refletir catálogo, estoque, garantia e condições reais da VYNE.
          </p>
        </section>
      </main>

      <SiteFooter />
      <ProductQuickView
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
