import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";

export const metadata: Metadata = {
  title: "AviatorWinn - Your bet, your flight!",
  description: "Play Aviator - an exciting crash game where you place a bet and watch the multiplier grow. Cash out before the plane flies away to win big!",
  keywords: "aviator, crash game, betting, casino, multiplier, win",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased touch-manipulation">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
