import 'dotenv/config';
import { getDb } from './client.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const db = getDb();
  console.log('Seeding fishing categories and products...');

  // Categories
  const categories = [
    {
      id: uuidv4(),
      name_en: 'Fishing Rods',
      name_ar: 'صنارات الصيد',
      slug: 'fishing-rods',
    },
    {
      id: uuidv4(),
      name_en: 'Spinning Reels',
      name_ar: 'بكرات الصيد',
      slug: 'spinning-reels',
    },
    {
      id: uuidv4(),
      name_en: 'Hooks & Lines',
      name_ar: 'خيوط وسنارات',
      slug: 'hooks-and-lines',
    },
    {
      id: uuidv4(),
      name_en: 'Lures & Baits',
      name_ar: 'طعوم صناعية ولورات',
      slug: 'lures-and-baits',
    },
    {
      id: uuidv4(),
      name_en: 'Tackle Boxes & Accessories',
      name_ar: 'حقائب وصناديق المعدات',
      slug: 'tackle-boxes',
    },
  ];

  for (const cat of categories) {
    const existing = await db.execute({
      sql: 'SELECT id FROM categories WHERE slug = ?',
      args: [cat.slug],
    });
    if (existing.rows.length === 0) {
      await db.execute({
        sql: 'INSERT INTO categories (id, name_en, name_ar, slug) VALUES (?, ?, ?, ?)',
        args: [cat.id, cat.name_en, cat.name_ar, cat.slug],
      });
    } else {
      cat.id = existing.rows[0].id;
    }
  }

  // Products
  const sampleProducts = [
    {
      name_en: 'Carbon Pro Telescopic Surfcasting Rod 3.6m',
      name_ar: 'صنارة صيد تلسكوبية كاربون برو 3.6 متر للشاطئ',
      description_en: 'High-modulus carbon fiber construction with stainless steel guides and comfortable EVA handle. Designed for beach and surfcasting in saltwater.',
      description_ar: 'مصنوعة من ألياف الكربون عالية المقاومة مع حلقات من الفولاذ المقاوم للصدأ ومقبض مريح من مادة EVA. مثالية لصيد الشواطئ والبحار.',
      category_slug: 'fishing-rods',
      price: 1250.0,
      main_image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=600&auto=format&fit=crop&q=80',
      ],
    },
    {
      name_en: 'Saltwater Spinning Reel 5000 Series (9+1 BB)',
      name_ar: 'ماكينة صيد غزل بحرية فئة 5000 (9+1 رولمان بلي)',
      description_en: 'Heavy-duty CNC aluminum spool, triple carbon drag washers delivering up to 15kg max drag. Sealed water-resistant body.',
      description_ar: 'حلة ألومنيوم CNC متينة، فرامل كربونية ثلاثية بقوة سحب تصل إلى 15 كجم، وجسم مقاوم للمياه المالحة لمنع الصدأ.',
      category_slug: 'spinning-reels',
      price: 1850.0,
      main_image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      images: [],
    },
    {
      name_en: 'Premium 8-Strand Braided Line 300m (30LB)',
      name_ar: 'خيط حرير مضفر 8 فتلات 300 متر (قوة 30 رطل)',
      description_en: 'Ultra-smooth surface for longer casts, zero stretch for maximum sensitivity, abrasion resistant PE fiber in moss green.',
      description_ar: 'سطح أملس وفائق النعومة لرميات أبعد بدون تشابك، صفر استطالة لحساسية فائقة عند عض السمكة، ومقاوم للاحتكاك بالصخور.',
      category_slug: 'hooks-and-lines',
      price: 420.0,
      main_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      images: [],
    },
    {
      name_en: 'Laser Minnow Sinking Lures Set (5-Pack)',
      name_ar: 'مجموعة لورات مينو ليزرية غاطسة (5 قطع)',
      description_en: 'Realistic 3D holographic eyes, durable ABS body, with high-pitch rattling sound and sharp treble hooks for predator fish.',
      description_ar: 'عيون هولوغرافية ثلاثية الأبعاد وعاكسة للضوء تحت الماء مع كرات صوتية داخلية وسنانير ثلاثية حادة جداً لصيد الأسماك المفترسة كالقاروص.',
      category_slug: 'lures-and-baits',
      price: 360.0,
      main_image_url: 'https://images.unsplash.com/photo-1520690214124-2405c5217036?w=600&auto=format&fit=crop&q=80',
      images: [],
    },
    {
      name_en: 'Double-Sided Waterproof Tackle Box Organizer',
      name_ar: 'صندوق معدات صيد مضاد للماء ذو وجهين',
      description_en: 'Reinforced silicone sealing ring keeps all hooks, lures, and swivels dry. Removable dividers allow flexible storage.',
      description_ar: 'مزود بإطار سيليكون محكم الغلق لمنع تسرب المياه نهائياً إلى السنانير والمعدات. فواصل متحركة تتيح تقسيم الصندوق حسب الحاجة.',
      category_slug: 'tackle-boxes',
      price: 290.0,
      main_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      images: [],
    },
    {
      name_en: 'Heavy-Duty Boat Jigging Rod 1.8m (100-250g)',
      name_ar: 'صنارة جيجينج للمراكب والصيد العميق 1.8 متر',
      description_en: 'Solid fiberglass core with high-tensile graphite wrap. Built specifically for deep water vertical jigging.',
      description_ar: 'قلب صلب من الفايبر جلاس المعزز بطبقات الجرافيت. مخصصة للصيد العميق من القوارب واليخوت في البحر الأحمر والمتوسط.',
      category_slug: 'fishing-rods',
      price: 1650.0,
      main_image_url: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=600&auto=format&fit=crop&q=80',
      images: [],
    },
  ];

  for (const item of sampleProducts) {
    const cat = categories.find((c) => c.slug === item.category_slug);
    const existing = await db.execute({
      sql: 'SELECT id FROM products WHERE name_en = ?',
      args: [item.name_en],
    });

    if (existing.rows.length === 0) {
      const pid = uuidv4();
      await db.execute({
        sql: `INSERT INTO products (id, name_en, name_ar, description_en, description_ar, category_id, price, main_image_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          pid,
          item.name_en,
          item.name_ar,
          item.description_en,
          item.description_ar,
          cat?.id || null,
          item.price,
          item.main_image_url,
        ],
      });

      for (let i = 0; i < item.images.length; i++) {
        await db.execute({
          sql: 'INSERT INTO product_images (id, product_id, url, sort_order) VALUES (?, ?, ?, ?)',
          args: [uuidv4(), pid, item.images[i], i],
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);
