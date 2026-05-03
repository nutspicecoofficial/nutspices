"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-brand font-sans selection:bg-brand-accent/30">
      {/* Hero Section */}
      <header className="relative w-full min-h-[70vh] flex flex-col items-center justify-center overflow-hidden border-b border-brand/10 bg-white pt-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-20 text-center px-4 max-w-5xl mx-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-brand/5 border border-brand/10 text-brand text-xs font-bold px-4 py-1.5 rounded-full mb-8 shadow-sm tracking-widest uppercase"
          >
            <Sparkles size={14} className="text-brand-accent" />
            <span>Introducing Custom Refinements</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-6xl md:text-8xl font-playfair font-bold tracking-tight mb-8 text-brand leading-[1.1]"
          >
            Standard Sizes. <br /> <span className="text-brand-accent italic">Perfected Fits.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-brand/70 text-xl max-w-2xl mx-auto mb-4 font-inter leading-relaxed"
          >
            Ashwaah elevates dual-gender apparel. Select your base size, then refine your waist, length, and sleeves down to the millimeter.
          </motion.p>
        </motion.div>
        
        {/* Subtle background element */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-brand/5 to-transparent"></div>
      </header>

      {/* Featured Collections Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <ProductGrid />
      </main>

      <footer className="w-full bg-[#1B3022] py-20 px-8 text-white/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-3xl font-playfair font-bold text-white tracking-tighter">Ashwaah</span>
            <p className="mt-6 text-white/40 max-w-sm leading-relaxed font-inter text-sm">
              Elevating the standard of dual-gender apparel through precision tailoring and bespoke craftsmanship. Your fit, perfected down to the millimeter.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase tracking-[0.2em] text-xs mb-6">Collections</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/category/mens" className="hover:text-[#C5A059] transition-colors">Men's Bespoke</Link></li>
              <li><Link href="/category/womens" className="hover:text-[#C5A059] transition-colors">Women's Couture</Link></li>
              <li><Link href="/category/accessories" className="hover:text-[#C5A059] transition-colors">Luxury Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase tracking-[0.2em] text-xs mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/my-story" className="hover:text-[#C5A059] transition-colors">Our Story</Link></li>
              <li><Link href="#" className="hover:text-[#C5A059] transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-[#C5A059] transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.2em]">
          <p className="text-white/20">© 2026 Ashwaah Boutique. All rights reserved.</p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <span className="text-white/20">Crafted with Excellence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

