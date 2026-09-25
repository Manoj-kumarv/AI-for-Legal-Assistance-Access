import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexAI — Legal Document Assistant",
  description:
    "AI-powered legal document analysis. Simplify, summarize, find risks, and understand your legal documents — powered by Google Gemini.",
  keywords: ["legal AI", "contract analysis", "legal document", "AI lawyer"],
  openGraph: {
    title: "LexAI — Legal Document Assistant",
    description: "Understand legal documents instantly with AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0f1117] antialiased">{children}</body>
    </html>
  );
}
