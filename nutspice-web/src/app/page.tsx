// Homepage - Server Component for maximum performance
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ChevronDown } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import BannerCarousel from "@/components/BannerCarousel";
import HomeTabs from "@/components/HomeTabs";
import { db } from "@/db";
import { products, productVariations, pageSections, homeCategoryBanners, homeTabs } from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";

async function getFeaturedProducts() {
  try {
    return await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      basePrice: products.basePrice,
      salePrice: products.salePrice,
      images: products.images,
      category: products.category,
      isFeatured: products.isFeatured,
      totalStock: sql<number>`SUM(${productVariations.stock})`.mapWith(Number)
    })
    .from(products)
    .leftJoin(productVariations, eq(products.id, productVariations.productId))
    .where(sql`${products.isFeatured} = 1`)
    .groupBy(products.id);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

async function getHomeSections() {
  try {
    const sections = await db.select().from(pageSections).orderBy(pageSections.displayOrder);
    
    const sectionsWithProducts = await Promise.all(sections.map(async (section) => {
      const productIds = section.productIds.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (productIds.length === 0) return { ...section, products: [] };

      const sectionProducts = await db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        basePrice: products.basePrice,
        salePrice: products.salePrice,
        images: products.images,
        category: products.category,
      })
      .from(products)
      .where(inArray(products.id, productIds));

      return {
        ...section,
        products: sectionProducts
      };
    }));

    return sectionsWithProducts;
  } catch (error) {
    console.error("Error fetching home sections:", error);
    return [];
  }
}

async function getHomeBanners() {
  try {
    return await db.select()
      .from(homeCategoryBanners)
      .where(eq(homeCategoryBanners.isActive, true))
      .orderBy(homeCategoryBanners.displayOrder);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
}

async function getHomeTabs() {
  try {
    return await db.select()
      .from(homeTabs)
      .where(eq(homeTabs.isActive, true))
      .orderBy(homeTabs.displayOrder);
  } catch (error) {
    console.error("Error fetching home tabs:", error);
    return [];
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();
  const homeSections = await getHomeSections();
  const banners = await getHomeBanners();
  const tabs = await getHomeTabs();

  return (
    <div className="min-h-screen bg-white text-brand font-sans selection:bg-brand-accent/30">
      {/* Hero Section */}
      <header className="relative w-full min-h-[85vh] flex flex-col items-center justify-center overflow-hidden border-b border-brand/10 bg-black pt-16">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero_bg_v2.png" 
            alt="Premium Dry Fruits" 
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/80"></div>
        </div>

        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto -mt-20">
          <div className="inline-flex items-center space-x-2 bg-[#C5A059]/10 backdrop-blur-md border border-[#C5A059]/30 text-[#C5A059] text-[10px] font-black px-5 py-2 rounded-full mb-8 shadow-2xl tracking-[0.3em] uppercase">
            <Sparkles size={14} className="text-[#C5A059]" />
            <span>Direct from the Source</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-playfair font-bold tracking-tight mb-8 text-white leading-[1.1]">
            Nature's Finest. <br /> <span className="text-[#C5A059] italic">Handpicked Quality.</span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-4xl mx-auto mb-4 font-inter leading-relaxed">
            Premium dry fruits and hand-roasted nuts, delivered directly to your doorstep.
          </p>
        </div>
        
        <Link 
          href="#featured-harvest"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 text-white/40 hover:text-[#C5A059] transition-colors cursor-pointer outline-none"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Scroll</span>
            <ChevronDown size={24} />
          </div>
        </Link>
      </header>

      {/* Banner Carousel */}
      {banners.length > 0 && (
        <div className="w-full pb-8">
          <BannerCarousel banners={banners} />
        </div>
      )}

      <main id="featured-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-12">
        {/* Home Tabs */}
        {tabs.length > 0 && (
          <HomeTabs tabs={tabs as any} />
        )}

        {/* Static Featured Section */}
        <div id="featured-harvest" className="scroll-mt-28">
          <ProductGrid initialProducts={featuredProducts} />
        </div>

        {/* Dynamic Sections (Grids) */}
        {homeSections.map((section) => (
          section.products.length > 0 && (
            <div key={section.id} id={section.title.toLowerCase().replace(/\s+/g, '-')} className="scroll-mt-28">
              <ProductGrid title={section.title} initialProducts={section.products as any} />
            </div>
          )
        ))}
      </main>

      <footer className="w-full bg-[#1B3022] py-20 px-8 text-white/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block transition-transform hover:scale-105 duration-300">
              <Image
                src="/images/logo.png"
                alt="NutspiceCo Logo"
                width={120}
                height={35}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="mt-6 text-white/40 max-w-sm leading-relaxed font-inter text-sm">
              Bringing you nature's finest treasures. From premium Californian almonds to handcrafted spice blends, we ensure every bite is a journey of quality and taste.
            </p>
          </div>


          <div>
            <h4 className="text-white font-bold uppercase tracking-[0.2em] text-xs mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/about" className="hover:text-[#C5A059] transition-colors">Our Store</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-[#C5A059] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-[#C5A059] transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.2em]">
          <p className="text-white/20">© 2026 NutspiceCo Boutique. All rights reserved.</p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <span className="text-white/20">Crafted with Excellence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
