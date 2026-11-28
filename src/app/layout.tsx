import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import SmoothScroll from "../components/motion/SmoothScroll";
import PageTransition from "../components/motion/PageTransition";
import { THEME_SCRIPT } from "../components/theme/themeScript";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-head",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const TITLE = "Sadiya Bhawania · The model is the easy part.";
const DESCRIPTION =
  "The hard part is everything around it: retrieval, safety gates, evals, and the interface the answer lands in. That's the part I build.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
  // No share image exists, so this is the text-only card.
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The head script may change data-theme before React hydrates.
    <html lang="en" className="h-full antialiased" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} min-h-full flex flex-col`}
      >
        <SmoothScroll>
          <NavBar />
          <PageTransition>{children}</PageTransition>
          <Footer />
        </SmoothScroll>
        <Analytics />
      </body>
    </html>
  );
}
