import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categorySlug: string;
  isCustomizable?: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link 
      href={`/product/${product.id}`} 
      className="group flex flex-col h-full w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 border border-brand/5 relative"
    >
      {product.isCustomizable && (
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-brand/10 shadow-sm">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand">Customizable</span>
        </div>
      )}

      <div className="aspect-[4/5] bg-brand-light overflow-hidden relative flex items-center justify-center flex-shrink-0">
        <img 
          src={product.imageUrl || "/images/placeholder.png"} 
          alt={product.name} 
          className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-1000" 
        />
        <div className="absolute inset-0 bg-brand/5 group-hover:bg-transparent transition-colors duration-700"></div>
      </div>
      <div className="px-6 py-8 flex flex-col flex-1">
        <h3 className="text-xl font-playfair font-bold text-brand mb-2 group-hover:text-[#C5A059] transition-colors duration-500 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-brand/50 text-xs mb-6 line-clamp-2 leading-relaxed flex-1">
          {product.description}
        </p>
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-brand/5">
          <div className="text-brand font-bold text-lg tracking-tighter">₹{(product.price || 0).toLocaleString()}</div>
          <div className="w-8 h-8 rounded-full bg-brand/5 flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-white transition-all duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
