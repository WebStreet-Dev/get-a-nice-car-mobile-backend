-- Seed script to insert default sales persons
-- Run this directly on your database if the table is empty

INSERT INTO "sales_persons" ("id", "name", "phone", "email", "photo_path", "is_active", "sort_order", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    'Jimmy Martinez',
    '(305) 894-6062',
    'ncsales5813@gmail.com',
    'img/jimmy.jpeg',
    true,
    1,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sales_persons" WHERE "name" = 'Jimmy Martinez')
ON CONFLICT DO NOTHING;

INSERT INTO "sales_persons" ("id", "name", "phone", "email", "photo_path", "is_active", "sort_order", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    'Cash',
    '(954) 647-3151',
    'nicecar1977@gmail.com',
    'img/cash.jpeg',
    true,
    2,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sales_persons" WHERE "name" = 'Cash')
ON CONFLICT DO NOTHING;

INSERT INTO "sales_persons" ("id", "name", "phone", "email", "photo_path", "is_active", "sort_order", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    'Jeff Ouellette',
    '(954) 865-4820',
    'usedcarjeff@gmail.com',
    'img/jeff.jpeg',
    true,
    3,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sales_persons" WHERE "name" = 'Jeff Ouellette')
ON CONFLICT DO NOTHING;

INSERT INTO "sales_persons" ("id", "name", "phone", "email", "photo_path", "is_active", "sort_order", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    'Franco',
    '786-667-2916',
    '',
    'img/franco.jpeg',
    true,
    4,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM "sales_persons" WHERE "name" = 'Franco')
ON CONFLICT DO NOTHING;
