import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categorySlug: string;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link 
      href={`/product/${product.id}`} 
      className="group flex flex-col h-full w-full bg-white rounded-md overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border-t-2 border-brand-accent border-x border-b border-brand/5"
    >

      <div className="aspect-[4/5] bg-brand-light overflow-hidden relative flex items-center justify-center flex-shrink-0">
        <img 
          src={product.imageUrl || "/images/placeholder.png"} 
          alt={product.name} 
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700" 
        />
        <div className="absolute inset-0 bg-brand/5 group-hover:bg-transparent transition-colors duration-500"></div>
      </div>
      <div className="px-6 py-6 flex flex-col flex-1">
        <h3 className="text-xl font-playfair font-bold text-brand mb-2 group-hover:text-brand-accent transition-colors duration-300 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-brand/70 text-sm mb-4 line-clamp-2 italic flex-1">
          {product.description}
        </p>
        <div className="flex justify-between items-center mt-auto">
          <div className="text-brand font-bold text-lg">₹{(product.price || 0).toLocaleString()}</div>
          <div className="text-brand-accent text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
}
