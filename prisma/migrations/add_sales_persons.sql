-- Create sales_persons table
CREATE TABLE IF NOT EXISTS "sales_persons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "photo_path" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_persons_pkey" PRIMARY KEY ("id")
);

-- Insert default sales persons
INSERT INTO "sales_persons" ("id", "name", "phone", "email", "photo_path", "is_active", "sort_order", "created_at", "updated_at")
VALUES
    (gen_random_uuid()::text, 'Jimmy Martinez', '(305) 894-6062', 'ncsales5813@gmail.com', 'img/jimmy.jpeg', true, 1, NOW(), NOW()),
    (gen_random_uuid()::text, 'Cash', '(954) 647-3151', 'nicecar1977@gmail.com', 'img/cash.jpeg', true, 2, NOW(), NOW()),
    (gen_random_uuid()::text, 'Jeff Ouellette', '(954) 865-4820', 'usedcarjeff@gmail.com', 'img/jeff.jpeg', true, 3, NOW(), NOW()),
    (gen_random_uuid()::text, 'Franco', '786-667-2916', '', 'img/franco.jpeg', true, 4, NOW(), NOW())
ON CONFLICT DO NOTHING;
