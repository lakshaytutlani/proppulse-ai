import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalityLens — Compare Indian micro-markets before you buy",
  description:
    "LocalityLens compares Indian metro localities side by side: rents, rental yields, EMIs, stamp duty and upcoming infrastructure, grounded in a market dataset.",
  applicationName: "LocalityLens",
  openGraph: {
    title: "LocalityLens",
    description: "Compare Indian micro-markets side by side before you buy or invest.",
    siteName: "LocalityLens",
    locale: "en_IN",
    type: "website",
  },
};

function LensMark() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-ink">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="M15 15l5 5" strokeLinecap="round" />
        <path d="M8 12.5v-2M10.5 12.5v-4M13 12.5v-3" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </span>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className="antialiased">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <LensMark />
              <span>
                Locality<span className="text-accent">Lens</span>
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-muted">
              <Link href="/#how" className="hidden hover:text-ink sm:block">How it works</Link>
              <Link href="/#coverage" className="hidden hover:text-ink sm:block">Coverage</Link>
              <Link href="/#compare" className="rounded-md border border-accent/40 px-3 py-1.5 text-accent hover:bg-accent/10">
                Compare now
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-24">{children}</main>
        <footer className="border-t border-line py-8 text-center text-xs text-muted">
          <p className="font-medium text-ink/80">LocalityLens</p>
          <p className="mt-1">
            Indicative research, not financial or legal advice. Seed market data are approximate estimates — verify before you transact.
          </p>
        </footer>
      </body>
    </html>
  );
}
