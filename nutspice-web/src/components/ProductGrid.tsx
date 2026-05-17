"use client";

import { motion } from "framer-motion";
import ProductCard from './ProductCard';

interface Product {
  id: number;
  name: string;
  description: string;
  salePrice: number;
  basePrice: number;
  images: string; // JSON string
  category?: string;
  isCustomizable?: boolean | number | null;
}

interface ProductGridProps {
  initialProducts: any[];
  title?: string;
  showTitle?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function ProductGrid({ initialProducts, title = "NutspiceCo Specials", showTitle = true }: ProductGridProps) {
  return (
    <section className="py-0">
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center text-center mb-12 border-b border-brand/10 pb-6"
        >
          <div>
            <h2 className="text-4xl font-playfair font-bold mb-3 text-brand">{title}</h2>
            <p className="text-brand/60 italic">Sourced with care. Delivered with perfection.</p>
          </div>
        </motion.div>
      )}


      {initialProducts.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-brand/10 rounded-3xl">
          <p className="text-brand/30 font-bold uppercase tracking-widest text-xs">New arrivals coming soon</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {initialProducts.map((product) => {
            const images = JSON.parse(product.images || "[]");
            const firstImage = images.length > 0 ? images[0] : "/images/placeholder.png";

            return (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard
                  product={{
                    id: product.id.toString(),
                    name: product.name,
                    description: product.description || "",
                    price: product.salePrice || product.basePrice,
                    mrp: product.basePrice,
                    imageUrl: firstImage,
                    categorySlug: product.category || "all",
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </section>
  );
}
