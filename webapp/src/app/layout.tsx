import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// PrimeReact styles
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

// Sonirama theme overrides
import "@/styles/themes/sonirama-light.css";
import "@/styles/themes/sonirama-dark.css";
import "@/styles/globals.css";

import { AppProviders } from "@/providers/AppProviders";
import { GlobalToast } from "@/components/ui/GlobalToast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sonirama",
  description: "Sonirama Marketplace - Tu tienda de audio profesional",
  keywords: ["audio", "sonido", "equipos", "profesional", "marketplace"],
  authors: [{ name: "Sonirama" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppProviders>
          <GlobalToast />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
