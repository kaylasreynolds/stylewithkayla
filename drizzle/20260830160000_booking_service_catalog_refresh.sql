-- Align the public booking catalog with the current Style with Kayla service menu.
-- Existing service codes remain stable so historical bookings and routing continue to work.

UPDATE services
SET name = 'Events and Occasions', duration_minutes = 60, sort_order = 10, updated_at = unixepoch() * 1000
WHERE code = 'women_event';

UPDATE services
SET name = 'Everyday Styling', duration_minutes = 120, sort_order = 20, updated_at = unixepoch() * 1000
WHERE code = 'women_everyday';

INSERT INTO services (id, code, audience, name, duration_minutes, routing_mode, active, sort_order)
SELECT 'svc_women_seasonal', 'women_seasonal', 'women', 'Seasonal Update', 120, 'age', 1, 30
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'women_seasonal');

UPDATE services
SET name = 'Seasonal Update', duration_minutes = 120, routing_mode = 'age', active = 1, sort_order = 30, updated_at = unixepoch() * 1000
WHERE code = 'women_seasonal';

UPDATE services
SET name = 'Full Closet Refresh', duration_minutes = 180, sort_order = 40, updated_at = unixepoch() * 1000
WHERE code = 'women_closet';

UPDATE services
SET name = 'Events and Occasions', duration_minutes = 60, sort_order = 50, updated_at = unixepoch() * 1000
WHERE code = 'men_event';

UPDATE services
SET name = 'Everyday Styling', duration_minutes = 120, sort_order = 60, updated_at = unixepoch() * 1000
WHERE code = 'men_everyday';

INSERT INTO services (id, code, audience, name, duration_minutes, routing_mode, active, sort_order)
SELECT 'svc_men_seasonal', 'men_seasonal', 'men', 'Seasonal Update', 120, 'mens_styling', 1, 70
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'men_seasonal');

UPDATE services
SET name = 'Seasonal Update', duration_minutes = 120, routing_mode = 'mens_styling', active = 1, sort_order = 70, updated_at = unixepoch() * 1000
WHERE code = 'men_seasonal';

UPDATE services
SET name = 'Full Closet Refresh', duration_minutes = 180, sort_order = 80, updated_at = unixepoch() * 1000
WHERE code = 'men_closet';
