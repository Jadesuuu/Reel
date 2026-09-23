-- Data fix: HN serves href attributes HTML-entity-encoded ("https:&#x2F;&#x2F;…", "&amp;"),
-- and the v1 parser stored them verbatim. Decode the two entities that occur in URLs.
UPDATE "postings"
SET "apply_url" = replace(replace("apply_url", '&#x2F;', '/'), '&amp;', '&')
WHERE "source" = 'HN' AND ("apply_url" LIKE '%&#x2F;%' OR "apply_url" LIKE '%&amp;%');

UPDATE "applications"
SET "url" = replace(replace("url", '&#x2F;', '/'), '&amp;', '&')
WHERE "url" LIKE '%&#x2F;%' OR "url" LIKE '%&amp;%';
