"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-brand font-sans selection:bg-brand-accent/30">
      {/* Hero Section */}
      <header className="relative w-full min-h-[70vh] flex flex-col items-center justify-center overflow-hidden border-b border-brand/10 bg-white pt-16">
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-brand/5 border border-brand/10 text-brand text-xs font-bold px-4 py-1.5 rounded-full mb-8 shadow-sm tracking-widest uppercase">
            <Sparkles size={14} className="text-brand-accent" />
            <span>Introducing Custom Refinements</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-playfair font-bold tracking-tight mb-8 text-brand leading-[1.1]">
            Standard Sizes. <br /> <span className="text-brand-accent italic">Perfected Fits.</span>
          </h1>
          <p className="text-brand/70 text-xl max-w-2xl mx-auto mb-4 font-inter leading-relaxed">
            Ashwaah elevates dual-gender apparel. Select your base size, then refine your waist, length, and sleeves down to the millimeter.
          </p>
        </div>
        
        {/* Subtle background element */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-brand/5 to-transparent"></div>
      </header>

      {/* Featured Collections Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <ProductGrid />
      </main>

      <footer className="w-full border-t border-brand/10 py-16 px-8 bg-brand text-white/60 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-8 md:mb-0">
            <span className="text-2xl font-playfair font-bold text-white tracking-tight">Ashwaah</span>
            <p className="mt-2 text-white/40">© 2026 Ashwaah Custom Fits. All rights reserved.</p>
          </div>
          <div className="flex space-x-10">
            <Link href="#" className="hover:text-brand-accent transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-brand-accent transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-brand-accent transition-colors">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

