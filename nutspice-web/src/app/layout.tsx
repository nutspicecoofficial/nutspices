import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "NutspiceCo - Nature's Finest Treasures",
  description: "Premium dry fruits, nuts, and hand-roasted seeds delivered to your doorstep.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} antialiased`}
    >
      <body className="min-h-screen bg-brand-light font-inter text-brand-dark flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
