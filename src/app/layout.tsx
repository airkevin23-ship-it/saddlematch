import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${TAGLINE}`,
  description:
    "Meet people who share your love of country music, rodeos, rural life, and real Texas connection — a dating app built for Houston, Austin, Dallas, and San Antonio.",
  icons: {
    icon: "/saddlematch-logo.png",
    apple: "/saddlematch-logo.png",
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
