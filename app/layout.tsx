import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

// Usamos a stack de fontes nativas do sistema (ver tailwind.config.ts) em vez
// de next/font/google: isso evita uma dependência de rede no momento do
// build (útil em ambientes de CI/sandbox sem acesso à internet) e ainda
// resulta em uma tipografia moderna e legível, como pedido no spec.

export const metadata: Metadata = {
  title: "Fin-Hub | Avante",
  description: "Central de solicitações financeiras da Avante",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
