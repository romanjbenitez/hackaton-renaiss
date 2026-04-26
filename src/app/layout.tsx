import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropTech Plataforma Inmobiliaria",
  description: "POC de hackathon para inquilinos, inmobiliarias y administradores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
