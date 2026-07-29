import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VYNE — Relógios originais. Ritmo autêntico.",
  description:
    "Curadoria de relógios originais de marcas reconhecidas, com clareza, confiança e preço inteligente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
