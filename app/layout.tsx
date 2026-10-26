
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Our Little Story | A Memory Museum",
  description: "A tiny romantic universe made of memories, moments, and love.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
