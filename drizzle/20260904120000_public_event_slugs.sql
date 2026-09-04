-- Permanent public event URLs. Nullable keeps incomplete future drafts valid.
ALTER TABLE `events` ADD COLUMN `slug` text;
WITH RECURSIVE
characters(event_id,title,event_date,position,output) AS (
  SELECT id,lower(title),event_date,1,'' FROM events
  UNION ALL
  SELECT event_id,title,event_date,position+1,output || CASE
    WHEN substr(title,position,1) GLOB '[a-z0-9]' THEN substr(title,position,1)
    WHEN substr(title,position,1) IN (' ','-','_') AND substr(output,-1)<>'-' THEN '-'
    ELSE '' END
  FROM characters WHERE position<=length(title)
), title_bases AS (
  SELECT event_id,event_date,CASE WHEN trim(output,'-') LIKE '%-trunk-show' THEN substr(trim(output,'-'),1,length(trim(output,'-'))-11) ELSE trim(output,'-') END title_base
  FROM characters WHERE position=length(title)+1
), bases AS (
  SELECT event_id,title_base || CASE WHEN event_date GLOB '[0-1][0-9]/[0-3][0-9]/[0-9][0-9]'
    THEN '-'||substr(event_date,7,2)||'-'||substr(event_date,1,2)||'-'||substr(event_date,4,2) ELSE '' END base
  FROM title_bases
), ranked AS (
  SELECT event_id,CASE WHEN base='' THEN 'event' ELSE base END base,
    row_number() OVER (PARTITION BY base ORDER BY event_id) occurrence FROM bases
)
UPDATE events SET slug=(SELECT base||CASE WHEN occurrence>1 THEN '-'||occurrence ELSE '' END FROM ranked WHERE ranked.event_id=events.id);
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);
