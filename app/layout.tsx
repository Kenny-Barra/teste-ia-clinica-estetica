import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel da Clínica — Atendimento WhatsApp",
  description:
    "Dashboard das conversas do agente de WhatsApp da clínica de estética.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
