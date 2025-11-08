-- Trigger function to maintain Products."MinBulkQuantity" based on active, valid bulk discounts.
-- Active discount criteria: IsActive = true AND (StartsAt IS NULL OR StartsAt <= NOW()) AND (EndsAt IS NULL OR EndsAt >= NOW())
-- After any change in BulkDiscounts, we recompute the minimum quantity threshold; if none, set NULL.

CREATE OR REPLACE FUNCTION update_min_bulk_quantity() RETURNS TRIGGER AS $$
DECLARE
    v_product_id uuid;
    v_min_qty int;
BEGIN
    v_product_id := COALESCE(NEW."ProductId", OLD."ProductId");

    SELECT MIN("MinQuantity") INTO v_min_qty
    FROM "BulkDiscounts" bd
    WHERE bd."ProductId" = v_product_id
      AND bd."IsActive" = TRUE
      AND (bd."StartsAt" IS NULL OR bd."StartsAt" <= NOW())
      AND (bd."EndsAt" IS NULL OR bd."EndsAt" >= NOW());

    UPDATE "Products"
    SET "MinBulkQuantity" = v_min_qty
    WHERE "Id" = v_product_id;

    RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bulk_discount_after_change ON "BulkDiscounts";
CREATE TRIGGER bulk_discount_after_change
AFTER INSERT OR UPDATE OR DELETE ON "BulkDiscounts"
FOR EACH ROW EXECUTE FUNCTION update_min_bulk_quantity();
