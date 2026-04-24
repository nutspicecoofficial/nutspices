import ProductCard from './ProductCard';

const mockProducts = [
  {
    id: "men-linen-shirt",
    name: "Premium Linen Shirt",
    description: "Custom fit premium cotton and linen blend. Breathable and elegant.",
    price: 4499,
    imageUrl: "/images/men_linen_shirt.png",
    categorySlug: "men"
  },
  {
    id: "men-trousers",
    name: "Tailored Trousers",
    description: "Perfectly proportioned, custom-tailored trousers for a sharp look.",
    price: 5299,
    imageUrl: "/images/men_trousers.png",
    categorySlug: "men"
  },
  {
    id: "women-kurti",
    name: "Sophisticated Kurti",
    description: "Elegant styling with gold accents and a tailored fit.",
    price: 3899,
    imageUrl: "/images/women_kurti.png",
    categorySlug: "ethnic-wear"
  },
  {
    id: "women-bodycon",
    name: "Crimson Bodycon",
    description: "Enhances your natural glow with perfectly formulated proportions.",
    price: 6299,
    imageUrl: "/images/women_bodycon.png",
    categorySlug: "women"
  }
];

export default function ProductGrid() {
  return (
    <section className="py-20">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-brand/10 pb-6">
        <div>
          <h2 className="text-4xl font-playfair font-bold mb-3 text-brand">Featured Collections</h2>
          <p className="text-brand/60 italic">Crafted for elegance. Tailored for you.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="text-brand-accent font-bold tracking-widest text-sm uppercase cursor-pointer hover:text-brand transition-colors">
            Explore All Collections
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
