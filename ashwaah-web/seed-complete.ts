import { db } from "./src/db";
import { products, pageSections, navigationMenu } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding completion data...");

  // Get current products to use as templates
  const allProducts = await db.select().from(products);
  const mensTemplate = allProducts.find(p => p.category?.toUpperCase() === "MENS") || allProducts[0];
  const womensTemplate = allProducts.find(p => p.category?.toUpperCase() === "WOMENS") || allProducts[0];
  const gadgetsTemplate = allProducts.find(p => p.category?.toUpperCase() === "GADGETS") || allProducts[0];
  const homeTemplate = allProducts.find(p => p.category?.toUpperCase() === "HOME ACCESSORIES") || allProducts[0];

  const categories = [
    { 
      name: "mens", 
      template: mensTemplate, 
      items: [
        "Royal Navy Bespoke Suit", "Classic Ivory Linen Shirt", "Midnight Charcoal Blazer", 
        "Artisan Wool Overcoat", "Heritage Tan Trench", "Oxford Blue Formal Shirt", "Slate Grey Lounge Suit"
      ] 
    },
    { 
      name: "womens", 
      template: womensTemplate, 
      items: [
        "Midnight Rose Silk Saree", "Golden Zari Wedding Lehenga", "Ivory Lace Designer Dress", 
        "Crimson Velvet Gala Gown", "Sapphire Chiffon Anarkali", "Pearl White Evening Gown", "Emerald Silk Kaftan"
      ] 
    },
    { 
      name: "gadgets", 
      template: gadgetsTemplate, 
      items: [
        "Stellar Silver Smartwatch", "Titanium Grey Digital Watch", "Obsidian Leather Tech Pouch", 
        "Aura Wireless Sound Pods", "Midnight Matte Power Hub", "Artisan Leather Laptop Sleeve", "Rose Gold Fitness Tracker"
      ] 
    },
    { 
      name: "home-accessories", 
      template: homeTemplate, 
      items: [
        "Silk Embroidered Cushion", "Handcrafted Brass Vase Set", "Velvet Midnight Throw", 
        "Artisan Leather Duffel", "Marbled Stone Desk Organizer", "Luxury Scented Candle Set", "Woven Heritage Rug"
      ] 
    }
  ];

  for (const cat of categories) {
    console.log(`Processing category: ${cat.name}`);
    const menu = await db.select().from(navigationMenu).where(eq(navigationMenu.href, `/category/${cat.name}`)).limit(1);
    if (menu.length === 0) continue;
    
    const menuId = menu[0].id;
    const newProductIds: number[] = [];

    for (const itemName of cat.items) {
      const result = await db.insert(products).values({
        name: itemName,
        description: cat.template.description,
        basePrice: cat.template.basePrice + (Math.random() * 2000 - 1000),
        salePrice: cat.template.salePrice,
        images: cat.template.images,
        imageUrl: cat.template.imageUrl,
        category: cat.name.toUpperCase(),
        stock: 50,
        isBespoke: cat.template.isBespoke,
      });
      // result[0].insertId is for mysql
      // In drizzle with mysql2, it's usually returned in the result
      // But let's just fetch the last inserted ID or similar
      const lastInserted = await db.select().from(products).where(eq(products.name, itemName)).orderBy(products.id).limit(1);
      if (lastInserted.length > 0) {
        newProductIds.push(lastInserted[0].id);
      }
    }

    // Update Section
    const section = await db.select().from(pageSections).where(eq(pageSections.menuId, menuId)).limit(1);
    if (section.length > 0) {
      const existingIds = section[0].productIds.split(",").filter(id => id.trim());
      const allIds = [...existingIds, ...newProductIds.map(id => id.toString())].join(",");
      await db.update(pageSections).set({ productIds: allIds }).where(eq(pageSections.id, section[0].id));
      console.log(`Updated section for ${cat.name} with ${newProductIds.length} new products.`);
    }
  }

  console.log("Seeding complete!");
}

main().catch(console.error);
