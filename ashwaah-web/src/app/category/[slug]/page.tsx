import { db } from "@/db";
import { navigationMenu, pageSections, products } from "@/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import ProductCarousel from "@/components/ProductCarousel";
import ProductGrid from "@/components/ProductGrid";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  
  // 1. Find the menu item by href
  const href = `/category/${slug}`;
  const menuResult = await db.select()
    .from(navigationMenu)
    .where(eq(navigationMenu.href, href))
    .limit(1);

  const menuItem = menuResult[0];

  if (!menuItem) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-playfair font-bold text-brand mb-4">Category Not Found</h1>
        <Link href="/" className="text-[#C5A059] font-bold uppercase tracking-widest text-xs hover:underline">Return Home</Link>
      </div>
    );
  }

  // 2. Fetch sections for this menu item
  const sections = await db.select()
    .from(pageSections)
    .where(eq(pageSections.menuId, menuItem.id))
    .orderBy(asc(pageSections.displayOrder));

  // 3. Hydrate products for each section
  const sectionsWithProducts = await Promise.all(
    sections.map(async (section) => {
      const productIds = section.productIds
        .split(",")
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      let hydratedProducts: any[] = [];
      if (productIds.length > 0) {
        hydratedProducts = await db.select()
          .from(products)
          .where(inArray(products.id, productIds));
      }

      return {
        ...section,
        products: hydratedProducts
      };
    })
  );

  const categoryName = menuItem.label;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-20 text-center">
        <h1 className="text-5xl md:text-6xl font-playfair font-bold text-brand mb-6 tracking-tight">{categoryName}</h1>
        <div className="w-24 h-1 bg-[#C5A059] mx-auto rounded-full mb-8"></div>
        <p className="mt-6 text-brand/70 max-w-2xl mx-auto font-inter leading-relaxed">
          Explore our curated selection of premium {categoryName.toLowerCase()} pieces, 
          each designed with meticulous attention to detail and crafted for an impeccable fit.
        </p>
      </div>
      
      {/* Dynamic Sections */}
      {sectionsWithProducts.length > 0 ? (
        <div className="space-y-16">
          {sectionsWithProducts.map((section) => (
            <ProductCarousel 
              key={section.id} 
              title={section.title} 
              products={section.products} 
            />
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-brand/5 rounded-[3rem] border border-brand/10 px-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShoppingBag className="text-[#C5A059]" size={32} />
          </div>
          <h2 className="text-2xl font-playfair font-bold text-brand mb-3">Collection Coming Soon</h2>
          <p className="text-brand/60 max-w-sm mx-auto">
            We are currently curating the perfect selection for this category. Check back soon for the latest arrivals.
          </p>
        </div>
      )}

      {/* Footer Grid - Optional/Default if no sections? Or just extra products? */}
      {/* For now, we'll just show the dynamic sections as requested */}
    </div>
  );
}
