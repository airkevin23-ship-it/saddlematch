import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { APP_NAME, TAGLINE } from "@/lib/constants";
import SiteFooter from "@/components/site-footer";

// Home-screen behaviour sits alongside the usual SEO metadata. Together
// with src/app/manifest.ts, this is what lets someone add SaddleMatch to
// their home screen and have it open full screen — no address bar, no
// tabs — rather than reopening in the browser.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets content reach into the notch and home-indicator areas so the app
  // fills the glass. Pages opt back out with env(safe-area-inset-*) padding,
  // which the bottom tab bar already does.
  viewportFit: "cover",
  // Tints the phone status bar and browser chrome cream, instead of leaving
  // a white band sitting above the header.
  themeColor: "#fff8f3",
};

export const metadata: Metadata = {
  title: "SaddleMatch — Dating for the Western Lifestyle",
  description:
    "Meet people who share your love of country music, rodeos, rural life, and real Texas connection — a dating app built for Austin, Texas.",
  appleWebApp: {
    // The flag iOS reads to launch the installed icon without Safari chrome.
    capable: true,
    title: "SaddleMatch",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/saddlematch-logo.png",
    apple: "/saddlematch-logo.png",
  },
  verification: {
    google: "Z3Av3uQVkE7i5PEZX3V-PagHve9JEdGUJNM3kLYVbeQ",
  },
};

// A display serif for headlines only, loaded through next/font so Next
// self-hosts it at build time: no extra network request, no flash of
// unstyled text, no layout shift. Body copy stays in the sans.
const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-playfair",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={display.variable}>
      {/*
        The footer lives here rather than on each page so the policy links are
        genuinely reachable everywhere. Stripe and App Store review both check
        that these are linked, not just that the URLs resolve. Bottom padding
        clears the fixed tab bar on the signed-in screens.
      */}
      <body className="antialiased bg-cream text-ink min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <SiteFooter inApp />
      </body>
    </html>
  );
}
