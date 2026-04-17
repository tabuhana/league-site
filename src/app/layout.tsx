import type { Metadata } from "next";
import { Rajdhani, Cinzel, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SearchBar } from "@/components/search/SearchBar";

const rajdhani = Rajdhani({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Riven GG — Matchup database for Riven mains",
  description:
    "Deep matchup data, guides, and performance analytics for Riven top lane.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${rajdhani.variable} ${cinzel.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <header className="sticky top-0 z-40 border-b border-riven-border bg-(--bg-primary)/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-6 py-3">
            <Link
              href="/"
              className="font-(family-name:--font-display) text-xl font-bold uppercase tracking-[0.2em] text-accent-gold hover:text-text-primary transition-colors"
            >
              Riven<span className="text-text-primary">.gg</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm uppercase tracking-wider text-text-secondary">
              <Link
                href="/matchups"
                className="hover:text-accent-gold transition-colors"
              >
                Matchups
              </Link>
            </nav>
            <div className="ml-auto w-full max-w-md">
              <SearchBar variant="nav" />
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
