import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, TAGLINE } from "@/lib/constants";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: "SaddleMatch — Dating for the Western Lifestyle",
  description:
    "Meet people who share your love of country music, rodeos, rural life, and real Texas connection — a dating app built for Houston, Austin, Dallas, and San Antonio.",
  verification: {
    google: "Z3Av3uQVkE7i5PEZX3V-PagHve9JEdGUJNM3kLYVbeQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
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
