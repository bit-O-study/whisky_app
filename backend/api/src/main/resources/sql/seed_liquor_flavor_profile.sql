BEGIN;

WITH scored AS (
    SELECT
        l.id,
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
UPDATE liquor l
SET
    sweet = s.sweet,
    smoky = s.smoky,
    fruity = s.fruity,
    spicy = s.spicy,
    woody = s.woody,
    body = s.body
FROM scored s
WHERE l.id = s.id;

COMMIT;
