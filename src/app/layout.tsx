import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropPulse AI — Real Estate Investment & Rental Yield Copilot",
  description:
    "Compare Indian metro micro-markets, estimate rental yields and weigh infrastructure catalysts before you buy.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className="antialiased">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-ink">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 12h4l3-7 4 14 3-7h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              PropPulse <span className="text-accent">AI</span>
            </Link>
            <span className="num hidden text-xs text-muted sm:block">
              DEL·NCR · BLR · MUM · HYD · PNQ
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-24">{children}</main>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          PropPulse AI provides indicative research, not financial or legal advice. Seed market data are approximate estimates.
        </footer>
      </body>
    </html>
  );
}
