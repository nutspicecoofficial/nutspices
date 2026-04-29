"use client";

import { useEffect, useState } from "react";
import ProductCard from './ProductCard';
import { Loader2 } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  salePrice: number;
  basePrice: number;
  images: string; // JSON string
  category?: string;
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/products/featured");
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch featured products", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-accent mb-4" size={40} />
        <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">Curating Collections...</p>
      </div>
    );
  }

  return (
    <section className="py-20">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-brand/10 pb-6">
        <div>
          <h2 className="text-4xl font-playfair font-bold mb-3 text-brand">Featured Collections</h2>
          <p className="text-brand/60 italic">Crafted for elegance. Tailored for you.</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-brand/10 rounded-3xl">
          <p className="text-brand/30 font-bold uppercase tracking-widest text-xs">New collections coming soon</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {products.map((product: any) => {
            const images = JSON.parse(product.images || "[]");
            const firstImage = images.length > 0 ? images[0] : (product.imageUrl || "/images/placeholder.png");
            
            return (
              <ProductCard 
                key={product.id} 
                product={{
                  id: product.id.toString(),
                  name: product.name,
                  description: product.description || "",
                  price: product.salePrice || product.basePrice,
                  imageUrl: firstImage,
                  categorySlug: product.category || "all"
                }} 
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
