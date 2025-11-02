import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import ThemeToggle from "./ui/theme-toggle";
import GlobalToast from "@/app/ui/global-toast";
import ThemeProvider from "./theme-provider";

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
  description: "Sonirama webapp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
  <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <ThemeProvider>
          <div style={{position:'fixed', right: 16, top: 16, zIndex: 10}}>
            <ThemeToggle />
          </div>
          <GlobalToast />
          {children}
          </ThemeProvider>
      </body>
    </html>
  );
}
