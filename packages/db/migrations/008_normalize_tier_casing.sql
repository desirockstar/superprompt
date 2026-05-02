-- Normalize tier values to lowercase for consistency
UPDATE evaluations
SET level = LOWER(level)
WHERE level IS NOT NULL AND level != LOWER(level);
