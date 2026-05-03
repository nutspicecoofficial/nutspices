import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-brand-light px-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center p-4 bg-brand/5 rounded-full mb-8 relative">
          <div className="text-brand-accent animate-pulse">
            <Sparkles size={40} />
          </div>
          <div className="absolute -top-1 -right-1 bg-brand text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">404</div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand mb-4 tracking-tighter">
          Lost in Style?
        </h1>
        
        <p className="text-brand/60 text-base mb-12 leading-relaxed">
          The collection or page you are looking for has been moved or doesn't exist. Let's get you back to the perfect fit.
        </p>
        
        <div className="flex flex-col space-y-4">
          <Link 
            href="/" 
            className="flex items-center justify-center space-x-3 bg-brand text-white font-bold py-4 rounded-2xl hover:bg-brand-hover transition-all shadow-xl"
          >
            <ArrowLeft size={18} />
            <span>Back to Collections</span>
          </Link>
          
          <Link 
            href="/search" 
            className="text-sm font-bold text-brand-accent uppercase tracking-[0.2em] hover:underline underline-offset-8 transition-all"
          >
            Search Products
          </Link>
        </div>
      </div>
    </div>
  );
}
