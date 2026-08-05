import AccessibilityControls from "@/components/AccessibilityControls";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="footer-logo" href="/#inicio" aria-label="VYNE — início">
            VYNE
          </Link>
          <p>Relógios originais. Escolhas com intenção.</p>
        </div>

        <nav className="footer-links" aria-label="Navegação do rodapé">
          <div>
            <span>Explorar</span>
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/#confianca">Autenticidade</Link>
            <Link href="/#sobre">A VYNE</Link>
          </div>
          <div>
            <span>Marcas</span>
            <Link href="/catalogo?marca=SEIKO">Seiko</Link>
            <Link href="/catalogo?marca=CASIO">Casio</Link>
            <Link href="/catalogo">Citizen · Orient · Timex</Link>
          </div>
        </nav>
      </div>

      <AccessibilityControls />

      <div className="footer-bottom">
        <span>© 2026 VYNE. Experiência digital independente.</span>
        <span>Imagens editoriais: Unsplash · Produtos ilustrativos.</span>
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
  );
}
