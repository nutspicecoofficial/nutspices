import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { homeCategoryBanners } from './schema';

const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite);

async function main() {
  console.log('Seeding home_category_banners...');
  
  const banners = [
    { title: 'Premium Almonds', imageUrl: 'https://images.unsplash.com/photo-1508817612393-20d937ac2e45?w=800&q=80', linkHref: '/category/almonds', displayOrder: 0 },
    { title: 'Luxury Cashews', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80', linkHref: '/category/cashews', displayOrder: 1 },
    { title: 'Exotic Walnuts', imageUrl: 'https://images.unsplash.com/photo-1585238341267-1cfec2046a55?w=800&q=80', linkHref: '/category/walnuts', displayOrder: 2 },
    { title: 'Pistachio Delight', imageUrl: 'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?w=800&q=80', linkHref: '/category/pistachios', displayOrder: 3 },
    { title: 'Dried Apricots', imageUrl: 'https://images.unsplash.com/photo-1596567182325-c3ffaed7f0f9?w=800&q=80', linkHref: '/category/apricots', displayOrder: 4 },
    { title: 'Mixed Nut Blends', imageUrl: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=800&q=80', linkHref: '/category/blends', displayOrder: 5 },
  ];


  try {
    // Clear existing banners
    await db.delete(homeCategoryBanners);
    
    for (const banner of banners) {
      await db.insert(homeCategoryBanners).values(banner);
    }
    console.log('Seeding complete.');

  } catch (error) {
    console.error('Error seeding banners:', error);
  } finally {
    sqlite.close();
  }
}

main();
