import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp?: number;
  imageUrl: string;
  categorySlug: string;
  isCustomizable?: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const mrp = product.mrp || Math.round(product.price * 1.2);
  const discount = Math.round(((mrp - product.price) / mrp) * 100);

  return (
    <div className="group flex flex-col h-full w-full bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">

      {/* Image Area */}
      <div className="relative aspect-square w-full bg-white flex items-center justify-center p-4">
        {/* Badge - Top Left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-[#E93B3B] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm shadow-sm">
            {discount}% OFF
          </span>
        </div>

        <Link href={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={product.imageUrl || "/images/placeholder.png"}
            alt={product.name}
            className="object-contain w-full h-full transform group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>
      </div>

      {/* Content Area */}
      <div className="px-4 pb-4 pt-1 flex flex-col flex-1 text-center">
        <Link href={`/product/${product.id}`} className="block mb-2">
          <h3 className="text-[14px] font-bold text-gray-900 line-clamp-2 leading-snug hover:text-[#005B41] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5 mb-4 mt-auto">
          <span className="text-[#005B41] font-bold text-xl whitespace-nowrap">
            ₹ {(product.price || 0).toLocaleString()}
          </span>
          <span className="text-gray-400 text-xs font-medium line-through whitespace-nowrap">
            MRP ₹ {mrp.toLocaleString()}
          </span>
        </div>

        {/* Action Button */}
        <Link
          href={`/product/${product.id}`}
          className="w-full bg-[#005B41] hover:bg-[#004230] text-white text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center shadow-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
