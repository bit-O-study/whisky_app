BEGIN;

CREATE TABLE IF NOT EXISTS whisky (
    id BIGSERIAL PRIMARY KEY,
    seed_key VARCHAR(500) NOT NULL UNIQUE,
    product_code VARCHAR(255),
    normalized_name VARCHAR(255),
    product_name VARCHAR(255),
    brand VARCHAR(255),
    category VARCHAR(255),
    class VARCHAR(255),
    alcohol_percent DOUBLE PRECISION,
    sweet DOUBLE PRECISION,
    smoky DOUBLE PRECISION,
    fruity DOUBLE PRECISION,
    spicy DOUBLE PRECISION,
    woody DOUBLE PRECISION,
    body DOUBLE PRECISION,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

WITH base AS (
    SELECT
        l.id,
        COALESCE(NULLIF(TRIM(l.product_code), ''), CONCAT(COALESCE(NULLIF(TRIM(l.normalized_name), ''), 'unknown'), ':', COALESCE(NULLIF(TRIM(l.class), ''), 'na'), ':', COALESCE(l.volume_ml::TEXT, '0'))) AS seed_key,
        l.product_code,
        l.normalized_name,
        l.product_name,
        l.brand,
        l.category,
        l.class,
        l.alcohol_percent,
        LEAST(95.0, GREATEST(5.0,
            18.0
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%bourbon%' OR LOWER(COALESCE(l.class, '')) LIKE '%bourbon%' THEN 18 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.product_name, '')) LIKE '%sherry%' THEN 16 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%irish%' OR LOWER(COALESCE(l.class, '')) LIKE '%irish%' THEN 10 ELSE 0 END
            + CASE WHEN COALESCE(l.alcohol_percent, 40) <= 40 THEN 6 ELSE 0 END
            - CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%rye%' OR LOWER(COALESCE(l.class, '')) LIKE '%rye%' THEN 5 ELSE 0 END
            - CASE WHEN LOWER(COALESCE(l.product_name, '')) LIKE '%islay%' OR LOWER(COALESCE(l.product_name, '')) LIKE '%peat%' OR LOWER(COALESCE(l.product_name, '')) LIKE '%peated%' THEN 8 ELSE 0 END
        )) AS sweet,
        LEAST(95.0, GREATEST(5.0,
            14.0
            + CASE WHEN LOWER(COALESCE(l.product_name, '')) LIKE '%islay%' OR LOWER(COALESCE(l.product_name, '')) LIKE '%peat%' OR LOWER(COALESCE(l.product_name, '')) LIKE '%peated%' THEN 34 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%smok%' OR LOWER(COALESCE(l.class, '')) LIKE '%smok%' THEN 16 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%single malt%' OR LOWER(COALESCE(l.class, '')) LIKE '%single malt%' THEN 6 ELSE 0 END
            - CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%irish%' OR LOWER(COALESCE(l.class, '')) LIKE '%irish%' THEN 8 ELSE 0 END
        )) AS smoky,
        LEAST(95.0, GREATEST(5.0,
            18.0
            + CASE WHEN LOWER(COALESCE(l.product_name, '')) LIKE '%sherry%' THEN 18 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%single malt%' OR LOWER(COALESCE(l.class, '')) LIKE '%single malt%' THEN 10 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%irish%' OR LOWER(COALESCE(l.class, '')) LIKE '%irish%' THEN 8 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.product_name, '')) LIKE '%port%' OR LOWER(COALESCE(l.product_name, '')) LIKE '%wine%' THEN 8 ELSE 0 END
            - CASE WHEN LOWER(COALESCE(l.product_name, '')) LIKE '%islay%' OR LOWER(COALESCE(l.product_name, '')) LIKE '%peat%' OR LOWER(COALESCE(l.product_name, '')) LIKE '%peated%' THEN 6 ELSE 0 END
        )) AS fruity,
        LEAST(95.0, GREATEST(5.0,
            14.0
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%rye%' OR LOWER(COALESCE(l.class, '')) LIKE '%rye%' THEN 22 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%bourbon%' OR LOWER(COALESCE(l.class, '')) LIKE '%bourbon%' THEN 8 ELSE 0 END
            + CASE WHEN COALESCE(l.alcohol_percent, 40) >= 50 THEN 10 ELSE 0 END
            + CASE WHEN COALESCE(l.alcohol_percent, 40) BETWEEN 45 AND 49.999 THEN 5 ELSE 0 END
            - CASE WHEN COALESCE(l.alcohol_percent, 40) <= 40 THEN 4 ELSE 0 END
        )) AS spicy,
        LEAST(95.0, GREATEST(5.0,
            16.0
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%bourbon%' OR LOWER(COALESCE(l.class, '')) LIKE '%bourbon%' THEN 12 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.product_name, '')) LIKE '%oak%' THEN 12 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.product_name, '')) LIKE '%islay%' OR LOWER(COALESCE(l.product_name, '')) LIKE '%peat%' OR LOWER(COALESCE(l.product_name, '')) LIKE '%peated%' THEN 8 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%single malt%' OR LOWER(COALESCE(l.class, '')) LIKE '%single malt%' THEN 5 ELSE 0 END
        )) AS woody,
        LEAST(95.0, GREATEST(5.0,
            16.0
            + CASE WHEN COALESCE(l.alcohol_percent, 40) >= 50 THEN 16 ELSE 0 END
            + CASE WHEN COALESCE(l.alcohol_percent, 40) BETWEEN 45 AND 49.999 THEN 10 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%single malt%' OR LOWER(COALESCE(l.class, '')) LIKE '%single malt%' THEN 8 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%bourbon%' OR LOWER(COALESCE(l.class, '')) LIKE '%bourbon%' THEN 7 ELSE 0 END
            + CASE WHEN LOWER(COALESCE(l.category, '')) LIKE '%rye%' OR LOWER(COALESCE(l.class, '')) LIKE '%rye%' THEN 4 ELSE 0 END
            - CASE WHEN COALESCE(l.alcohol_percent, 40) <= 40 THEN 5 ELSE 0 END
        )) AS body
    FROM liquor l
)
INSERT INTO whisky (
    seed_key,
    product_code,
    normalized_name,
    product_name,
    brand,
    category,
    class,
    alcohol_percent,
    sweet,
    smoky,
    fruity,
    spicy,
    woody,
    body,
    created_at,
    updated_at
)
SELECT
    b.seed_key,
    b.product_code,
    b.normalized_name,
    b.product_name,
    b.brand,
    b.category,
    b.class,
    b.alcohol_percent,
    b.sweet,
    b.smoky,
    b.fruity,
    b.spicy,
    b.woody,
    b.body,
    NOW(),
    NOW()
FROM base b
ON CONFLICT (seed_key)
DO UPDATE SET
    product_code = EXCLUDED.product_code,
    normalized_name = EXCLUDED.normalized_name,
    product_name = EXCLUDED.product_name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    class = EXCLUDED.class,
    alcohol_percent = EXCLUDED.alcohol_percent,
    sweet = EXCLUDED.sweet,
    smoky = EXCLUDED.smoky,
    fruity = EXCLUDED.fruity,
    spicy = EXCLUDED.spicy,
    woody = EXCLUDED.woody,
    body = EXCLUDED.body,
    updated_at = NOW();

COMMIT;
