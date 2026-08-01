import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, TAGLINE } from "@/lib/constants";

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
      <body className="antialiased bg-cream text-ink min-h-screen">
        {children}
      </body>
    </html>
  );
}
