import type { Metadata, Viewport } from "next";
import { Work_Sans, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const nhaas = localFont({
  src: "../fonts/NHaasGroteskDSPro-95Blk.otf",
  variable: "--font-nhaas",
  weight: "900",
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Copa Solose",
  description: "Copa Solose",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${nhaas.variable} ${workSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
