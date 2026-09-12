import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Big_Shoulders } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { MarcasProvider } from "@/components/MarcasProvider";
import { ToastProvider } from "@/components/Toast";
import { ThemeInit } from "@/components/ThemeInit";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });
const bigShoulders = Big_Shoulders({ variable: "--font-big-shoulders", subsets: ["latin"], weight: ["700", "800"] });

export const metadata: Metadata = {
  title: "Panel de Servicio · Multimarca",
  description: "Cotizador, comparador y plan de mantenimiento — BAIC, ARCFOX, FIAT, PEUGEOT, CITROEN",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} ${jetbrainsMono.variable} ${bigShoulders.variable}`} suppressHydrationWarning>
      <body>
        <ThemeInit />
        <ToastProvider>
          <AuthProvider>
            <MarcasProvider>{children}</MarcasProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
