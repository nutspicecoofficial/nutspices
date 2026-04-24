"use client";

import { useState } from "react";
import RefineDrawer from "../../../components/RefineDrawer";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

export default function ProductPage() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const addItem = useCartStore((state) => state.addItem);

  const sizes = ["S", "M", "L", "XL", "XXL"];

  const handleAddToCart = () => {
    addItem({
      id: `prod_1_${selectedSize}`, 
      productId: 1,
      name: "Midnight Oxford Button-Down",
      price: 4499,
      image: "https://via.placeholder.com/150?text=Midnight+Oxford",
      quantity: 1,
      size: selectedSize,
      customizations: { type: "Standard" },
    });
  };

  return (
    <div className="min-h-screen bg-brand-light text-brand font-sans selection:bg-brand-accent/30">
      <main className="max-w-6xl mx-auto px-8 pt-28 pb-10 md:pb-16">
        <Link href="/" className="inline-flex items-center space-x-3 text-[#1B3022]/60 hover:text-[#C5A059] transition-all mb-10 text-xs font-bold uppercase tracking-widest group">
          <div className="p-2 rounded-full bg-white shadow-sm border border-brand/5 group-hover:border-[#C5A059]/30">
            <ArrowLeft size={14} />
          </div>
          <span>Back to Collections</span>
        </Link>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left: Product Imagery */}
          <div className="relative aspect-square bg-white border-t-4 border-brand-accent rounded-md flex items-center justify-center shadow-sm">
            <div className="text-brand/30 text-lg font-medium absolute z-20 flex flex-col items-center">
              <span>Premium Apparel Imagery</span>
            </div>
          </div>

          {/* Right: Product Details & Customisation */}
          <div className="flex flex-col">
            <div className="text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">The Heritage Collection</div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight text-brand">
              Midnight Oxford <br/> Button-Down
            </h1>
            <p className="text-brand/70 mb-8 text-lg">
              Crafted from Egyptian cotton. Designed for a timeless look, but refined for your exact body.
            </p>

            <div className="text-3xl font-bold text-brand mb-10">₹4,499</div>

            {/* Size Selector */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-brand">1. Select Base Size</span>
                <a href="#" className="text-xs text-brand-accent hover:underline font-semibold">Size Guide</a>
              </div>
              <div className="flex space-x-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-md flex items-center justify-center text-sm font-bold transition-all shadow-sm border ${
                      selectedSize === size 
                        ? "bg-brand text-white border-brand scale-105" 
                        : "bg-white text-brand/70 border-brand/20 hover:border-brand"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Refine Fit Button */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-brand">2. Perfect The Fit (Optional)</span>
              </div>
              <button 
                onClick={() => setDrawerOpen(true)}
                className="w-full bg-white border-2 border-brand-accent/50 hover:border-brand-accent rounded-md p-5 flex items-center justify-between transition-all shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-brand-light p-2 rounded-full text-brand-accent">
                    <Sparkles size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-brand font-bold text-sm">Refine Your Fit</div>
                    <div className="text-brand/60 text-xs mt-0.5 font-medium">Adjust waist, length, and sleeves.</div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-brand-accent transition-colors group-hover:translate-x-1" />
              </button>
            </div>

            {/* Add to Cart */}
            <button 
              onClick={handleAddToCart}
              className="w-full bg-brand text-white font-bold py-4 rounded-md hover:bg-brand-hover transition-all text-lg active:scale-[0.98] shadow-md border border-transparent hover:border-brand-accent"
            >
              Add To Cart
            </button>
          </div>
        </div>
      </main>

      <RefineDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        baseSize={selectedSize}
      />
    </div>
  );
}

