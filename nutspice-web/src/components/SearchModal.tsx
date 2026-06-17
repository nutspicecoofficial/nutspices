"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  category: string | null;
  gender: string | null;
  basePrice: number;
  salePrice: number | null;
  images: string | null;
};

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      setQuery("");
      setResults([]);
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
        }
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand/10">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-4xl mx-auto flex items-center relative">
          <button type="submit" aria-label="Submit Search" className="absolute left-4 text-[#C5A059] h-5 w-5 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center bg-transparent border-none">
            <Search className="h-5 w-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for nuts, dry fruits, seeds or harvest..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-brand-dark border-none focus:outline-none focus:ring-0 text-lg md:text-2xl placeholder-brand-dark/40 pl-14 py-4 font-inter tracking-wide"
          />

          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-4 text-brand-dark/50 hover:text-brand-dark cursor-pointer flex items-center justify-center bg-transparent border-none">
              <X className="h-5 w-5" />
            </button>
          )}
        </form>
        <button onClick={onClose} className="p-2 text-brand-dark hover:text-[#C5A059] transition-colors ml-4 bg-brand/5 rounded-full cursor-pointer flex items-center justify-center border-none">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-[#C5A059] animate-spin" />
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-20 text-brand-dark/60 font-inter">
              No results found for "<span className="text-brand-dark font-semibold">{query}</span>"
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {results.map((product) => {
                const images = product.images ? JSON.parse(product.images) : [];
                const imgUrl = images.length > 0 ? images[0] : "/placeholder.png";
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={onClose}
                    className="group bg-brand/5 rounded-2xl overflow-hidden hover:bg-brand/10 transition-colors flex flex-col border border-brand/5"
                  >
                    <div className="aspect-[4/5] relative overflow-hidden bg-black/20">
                      <img src={imgUrl} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-xs md:text-sm font-bold text-brand-dark mb-1 uppercase tracking-wider truncate">{product.name}</h3>
                      <p className="text-[10px] md:text-xs text-brand-dark/60 mb-3 uppercase tracking-widest">{product.category || product.gender}</p>
                      <div className="mt-auto">
                        {product.salePrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[#C5A059] font-bold text-sm md:text-base">₹{product.salePrice}</span>
                            <span className="text-brand-dark/40 text-xs line-through">₹{product.basePrice}</span>
                          </div>
                        ) : (
                          <span className="text-[#C5A059] font-bold text-sm md:text-base">₹{product.basePrice}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
