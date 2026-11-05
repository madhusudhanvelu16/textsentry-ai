import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TextSentry AI — Regex & DFA Text Correction Lab",
  description:
    "Intelligent Text Error Detection and Automata Analysis for Theory of Computation Academic Case Study",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy-950 text-slate-100 antialiased selection:bg-electric-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}

