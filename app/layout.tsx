import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard Hari Sukan | SK Pulau Sibu",
  description:
    "Papan skor langsung Hari Sukan SK Pulau Sibu: kedudukan rumah sukan, acara dan keputusan terkini.",
  icons: {
    icon: "/skps-logo-512.png",
    shortcut: "/skps-logo-512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms">
      <body className="antialiased">{children}</body>
    </html>
  );
}
