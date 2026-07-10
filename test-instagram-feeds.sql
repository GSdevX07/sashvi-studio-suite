-- Insert 10 test Instagram feed items for testing
-- Run this in Supabase SQL Editor

INSERT INTO instagram_feed (title, instagram_url, type, thumbnail_image, caption, linked_products, is_active) VALUES
('Festive Silk Saree', 'https://www.instagram.com/reel/DaCZM87yzEW/', 'reel', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', 'Beautiful festive silk saree perfect for celebrations', '[]'::jsonb, true),
('Kanjivaram Collection', 'https://www.instagram.com/p/Cxyz123/', 'post', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800', 'Traditional Kanjivaram silk sarees', '[]'::jsonb, true),
('Bridal Jewellery', 'https://www.instagram.com/reel/Def456/', 'reel', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', 'Exquisite bridal jewellery collection', '[]'::jsonb, true),
('Banarasi Silk', 'https://www.instagram.com/p/Ghi789/', 'post', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800', 'Pure Banarasi silk sarees', '[]'::jsonb, true),
('Temple Jewellery', 'https://www.instagram.com/reel/Jkl012/', 'reel', 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=800', 'Traditional temple jewellery designs', '[]'::jsonb, true),
('Wedding Collection', 'https://www.instagram.com/p/Mno345/', 'post', 'https://images.unsplash.com/photo-1610030469668-98e550d6193c?w=800', 'Complete wedding collection', '[]'::jsonb, true),
('Gold Kundan', 'https://www.instagram.com/reel/Pqr678/', 'reel', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', 'Gold Kundan jewellery pieces', '[]'::jsonb, true),
('Designer Sarees', 'https://www.instagram.com/p/Stu901/', 'post', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800', 'Designer saree collection', '[]'::jsonb, true),
('Antique Jewellery', 'https://www.instagram.com/reel/Vwx234/', 'reel', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', 'Antique jewellery designs', '[]'::jsonb, true),
('Party Wear Sarees', 'https://www.instagram.com/p/Yza567/', 'post', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800', 'Party wear saree collection', '[]'::jsonb, true);
