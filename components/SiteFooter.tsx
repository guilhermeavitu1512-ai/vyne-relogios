import AccessibilityControls from "@/components/AccessibilityControls";
import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="footer-logo" href="/#inicio" aria-label="VYNE — início">
            <Image
              src="/media/vyne-logo-final.jpg"
              alt="VYNE"
              width={1365}
              height={960}
              sizes="(max-width: 640px) 128px, 150px"
            />
          </Link>
          <p>BUILT ON TRUST</p>
        </div>

        <nav className="footer-links" aria-label="Navegação do rodapé">
          <div>
            <span>Explorar</span>
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/#recomendados">Recomendados</Link>
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

      <div className="footer-signature-row">
        <Link className="footer-picture-logo" href="/#inicio" aria-label="VYNE — voltar ao início">
          <Image
            src="/media/vyne-logo-final.jpg"
            alt="Logo VYNE"
            width={1365}
            height={960}
            sizes="(max-width: 640px) 170px, 210px"
          />
        </Link>

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
      </div>
    </footer>
  );
}
