"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import ProductCard from "./ProductCard";

interface Product {
  id: any;
  name: string;
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
}

interface ProductCarouselProps {
  title: string;
  products: Product[];
}

export default function ProductCarousel({ title, products }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="py-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-playfair font-bold text-brand tracking-tight">{title}</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => scroll("left")}
            className="p-3 rounded-full bg-brand/5 text-brand hover:bg-brand hover:text-white transition-all shadow-sm border border-brand/10 active:scale-95"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => scroll("right")}
            className="p-3 rounded-full bg-brand/5 text-brand hover:bg-brand hover:text-white transition-all shadow-sm border border-brand/10 active:scale-95"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product: any) => {
          let firstImage = "/images/placeholder.png";
          try {
            if (product.images) {
              const parsed = JSON.parse(product.images);
              if (Array.isArray(parsed) && parsed.length > 0) {
                firstImage = parsed[0];
              }
            } else if (product.imageUrl) {
              firstImage = product.imageUrl;
            }
          } catch (e) {}

          return (
            <div key={product.id} className="w-[140px] md:w-[160px] flex-shrink-0 snap-start h-auto flex">
              <ProductCard 
                product={{
                  id: product.id.toString(),
                  name: product.name,
                  description: product.description || "",
                  price: product.salePrice || product.basePrice || 0,
                  mrp: product.basePrice || 0,
                  imageUrl: firstImage,
                  categorySlug: product.category || ""
                }} 
              />
            </div>
          );

        })}


      </div>
    </section>
  );
}
