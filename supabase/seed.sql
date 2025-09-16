-- This file contains sample data for development
-- Note: In production, games will be populated from the RAWG API

-- Sample game data (these will be replaced by actual RAWG API data)
INSERT INTO games (rawg_id, name, slug, description, released, rating, platforms, genres, tags, developers, publishers) VALUES
(3498, 'Grand Theft Auto V', 'grand-theft-auto-v', 'Grand Theft Auto V is an action-adventure game set within the fictional state of San Andreas, based on Southern California.', '2013-09-17', 4.47, 
 '[{"platform": {"id": 4, "name": "PC", "slug": "pc"}}, {"platform": {"id": 1, "name": "Xbox One", "slug": "xbox-one"}}, {"platform": {"id": 18, "name": "PlayStation 4", "slug": "playstation4"}}]',
 '[{"id": 4, "name": "Action", "slug": "action"}, {"id": 51, "name": "Indie", "slug": "indie"}]',
 '[{"id": 31, "name": "Singleplayer", "slug": "singleplayer"}, {"id": 7, "name": "Multiplayer", "slug": "multiplayer"}]',
 '[{"id": 1, "name": "Rockstar Games", "slug": "rockstar-games"}]',
 '[{"id": 1, "name": "Rockstar Games", "slug": "rockstar-games"}]')
ON CONFLICT (rawg_id) DO NOTHING;

INSERT INTO games (rawg_id, name, slug, description, released, rating, platforms, genres, tags, developers, publishers) VALUES
(4200, 'Portal 2', 'portal-2', 'Portal 2 is a puzzle-platform game developed and published by Valve Corporation.', '2011-04-18', 4.59,
 '[{"platform": {"id": 4, "name": "PC", "slug": "pc"}}, {"platform": {"id": 1, "name": "Xbox One", "slug": "xbox-one"}}, {"platform": {"id": 18, "name": "PlayStation 4", "slug": "playstation4"}}]',
 '[{"id": 4, "name": "Action", "slug": "action"}, {"id": 7, "name": "Adventure", "slug": "adventure"}]',
 '[{"id": 31, "name": "Singleplayer", "slug": "singleplayer"}, {"id": 7, "name": "Multiplayer", "slug": "multiplayer"}]',
 '[{"id": 1, "name": "Valve Corporation", "slug": "valve-corporation"}]',
 '[{"id": 1, "name": "Valve Corporation", "slug": "valve-corporation"}]')
ON CONFLICT (rawg_id) DO NOTHING;