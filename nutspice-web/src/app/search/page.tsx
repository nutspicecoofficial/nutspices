"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { Loader2, Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string;
  salePrice: number;
  basePrice: number;
  images: string; // JSON string
  category?: string;
  isFeatured: boolean | number | null;
  isCustomizable: boolean | number | null;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function performSearch() {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SearchIcon className="text-[#C5A059]" size={24} />
            <h1 className="text-3xl md:text-5xl font-playfair font-bold text-[#1B3022]">
              Search Results
            </h1>
          </div>
          <p className="text-[#1B3022]/60 italic">
            {loading ? "Searching..." : products.length > 0 
              ? `Found ${products.length} premium selections for "${query}"` 
              : `No results found for "${query}"`}
          </p>
        </div>

        {!loading && products.length > 0 && (
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#1B3022]/10 rounded-full text-[10px] font-black uppercase tracking-widest text-[#1B3022] hover:bg-[#FDFBF7] transition-all">
            <SlidersHorizontal size={14} />
            Filter & Sort
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-[#C5A059] mb-4" size={48} strokeWidth={1.5} />
          <p className="text-[#1B3022]/40 font-black uppercase tracking-[0.3em] text-[10px]">Scouring our harvest...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-32 text-center bg-[#FDFBF7] rounded-[3rem] border border-[#1B3022]/5">
          <div className="max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
              <SearchIcon size={32} className="text-[#1B3022]/20" />
            </div>
            <h3 className="text-2xl font-playfair font-bold text-[#1B3022] mb-4">No Matches Found</h3>
            <p className="text-[#1B3022]/60 mb-8 leading-relaxed">
              We couldn't find any products matching your search. Try checking your spelling or using more general terms.
            </p>
            <Link 
              href="/" 
              className="inline-block px-10 py-4 bg-[#C5A059] text-white rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-[#B38E46] transition-all shadow-lg"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {products.map((product: any) => {
            const images = JSON.parse(product.images || "[]");
            const firstImage = images.length > 0 ? images[0] : "/images/placeholder.png";
            
            return (
              <ProductCard 
                key={product.id} 
                product={{
                  id: product.id.toString(),
                  name: product.name,
                  description: product.description || "",
                  price: product.salePrice || product.basePrice,
                  mrp: product.basePrice,
                  imageUrl: firstImage,
                  categorySlug: product.category || "all"
                }} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-[#C5A059]" size={40} />
        </div>
      }>
        <SearchResults />
      </Suspense>
    </main>
  );
}
