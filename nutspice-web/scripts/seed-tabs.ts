import { db } from "../src/db";
import { homeTabs } from "../src/db/schema";

async function seed() {
  const tabs = [
    {
      title: "Premium Quality",
      description: "Carefully selected from the world's finest harvests.",
      imageUrl: "/images/icons/premium.svg",
      displayOrder: 0,
    },
    {
      title: "Direct Sourcing",
      description: "Directly from farmers to ensure freshness and fair price.",
      imageUrl: "/images/icons/source.svg",
      displayOrder: 1,
    },
    {
      title: "Fast Delivery",
      description: "Quick and secure shipping to your doorstep.",
      imageUrl: "/images/icons/shipping.svg",
      displayOrder: 2,
    },
    {
      title: "Hygienic Packing",
      description: "Packed with care in a temperature-controlled environment.",
      imageUrl: "/images/icons/packing.svg",
      displayOrder: 3,
    },
    {
      title: "Bulk Orders",
      description: "Special pricing for corporate and wedding gifts.",
      imageUrl: "/images/icons/bulk.svg",
      displayOrder: 4,
    },
    {
      title: "Satisfaction Guaranteed",
      description: "If you're not happy, we'll make it right.",
      imageUrl: "/images/icons/satisfaction.svg",
      displayOrder: 5,
    }
  ];

  for (const tab of tabs) {
    await db.insert(homeTabs).values(tab);
  }
  console.log("Seeded Home Tabs");
}

seed();
