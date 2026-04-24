import { db } from "./index";
import { navigationMenu, products, users } from "./schema";

async function seed() {
  console.log("Seeding database...");
  
  try {
    // Admin User
    await db.insert(users).values({
      phoneNumber: "9876543210",
      fullName: "System Admin",
      role: "admin",
    }).onConflictDoNothing();


    // Navigation
    await db.insert(navigationMenu).values([
      { label: "Men", href: "/category/men", order: 1 },
      { label: "Women", href: "/category/women", order: 2 },
      { label: "Ethnic Wear", href: "/category/ethnic-wear", order: 3 },
    ]);

    // Products
    await db.insert(products).values([
      { 
        name: "Premium Linen Shirt", 
        description: "Custom fit premium cotton and linen blend. Breathable and elegant.",
        gender: "men", 
        category: "Shirts", 
        basePrice: 4499,
        imageUrl: "/images/men_linen_shirt.png"
      },
      { 
        name: "Tailored Trousers", 
        description: "Perfectly proportioned, custom-tailored trousers for a sharp look.",
        gender: "men", 
        category: "Trousers", 
        basePrice: 5299,
        imageUrl: "/images/men_trousers.png"
      },
      { 
        name: "Sophisticated Kurti", 
        description: "Elegant styling with gold accents and a tailored fit.",
        gender: "women", 
        category: "Ethnic", 
        basePrice: 3899,
        imageUrl: "/images/women_kurti.png"
      },
      { 
        name: "Crimson Bodycon", 
        description: "Enhances your natural glow with perfectly formulated proportions.",
        gender: "women", 
        category: "Dresses", 
        basePrice: 6299,
        imageUrl: "/images/women_bodycon.png"
      },
    ]);

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

seed();
