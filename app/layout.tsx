import type { Metadata } from "next";
import { headers } from "next/headers";
import "@fontsource/barlow-condensed/600.css";
import "./globals.css";

const title = "VYNE — Relógios originais. Preço inteligente.";
const description =
  "Curadoria independente de relógios originais Seiko, Casio, Citizen, Orient e Timex, com autenticidade, elegância e preço inteligente.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = host
    ? `${protocol}://${host}`
    : "https://vyne-relogios.vercel.app";
  const socialImage = `${origin}/og.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "pt_BR",
      siteName: "VYNE",
      images: [
        {
          url: socialImage,
          width: 1536,
          height: 1024,
          alt: "VYNE — Relógios originais. Preço inteligente.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Ir para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
