BEGIN;

CREATE TEMP TABLE tmp_album_stickers_import (
    number_global INTEGER,
    team_slot INTEGER,
    code VARCHAR(30),
    type VARCHAR(20),
    category VARCHAR(30),
    section VARCHAR(50),
    group_name VARCHAR(20),
    team_name VARCHAR(100),
    country_code VARCHAR(10),
    name VARCHAR(150),
    player VARCHAR(150),
    position VARCHAR(80),
    notes TEXT,
    source_url TEXT,
    status_cadastro VARCHAR(40)
);

\copy tmp_album_stickers_import (
    number_global,
    team_slot,
    code,
    type,
    category,
    section,
    group_name,
    team_name,
    country_code,
    name,
    player,
    position,
    notes,
    source_url,
    status_cadastro
) FROM :'csv_path'
WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8');

INSERT INTO album_groups (name)
SELECT DISTINCT group_name
FROM tmp_album_stickers_import
WHERE group_name IS NOT NULL AND group_name <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO album_teams (group_id, name, country_code)
SELECT DISTINCT
    g.id,
    t.team_name,
    t.country_code
FROM tmp_album_stickers_import t
JOIN album_groups g ON g.name = t.group_name
WHERE t.team_name IS NOT NULL AND t.team_name <> ''
  AND t.country_code IS NOT NULL AND t.country_code <> ''
ON CONFLICT (country_code) DO UPDATE SET
    group_id = EXCLUDED.group_id,
    name = EXCLUDED.name,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO album_stickers (
    team_id,
    number_global,
    team_slot,
    code,
    type,
    category,
    section,
    name,
    player,
    position,
    notes,
    source_url,
    status_cadastro
)
SELECT
    team.id,
    t.number_global,
    t.team_slot,
    t.code,
    t.type,
    t.category,
    COALESCE(NULLIF(t.section, ''), 'Seleções'),
    t.name,
    NULLIF(t.player, ''),
    NULLIF(t.position, ''),
    NULLIF(t.notes, ''),
    NULLIF(t.source_url, ''),
    COALESCE(NULLIF(t.status_cadastro, ''), 'OK')
FROM tmp_album_stickers_import t
JOIN album_teams team ON team.country_code = t.country_code
ON CONFLICT (code) DO UPDATE SET
    team_id = EXCLUDED.team_id,
    number_global = EXCLUDED.number_global,
    team_slot = EXCLUDED.team_slot,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    section = EXCLUDED.section,
    name = EXCLUDED.name,
    player = EXCLUDED.player,
    position = EXCLUDED.position,
    notes = EXCLUDED.notes,
    source_url = EXCLUDED.source_url,
    status_cadastro = EXCLUDED.status_cadastro,
    updated_at = CURRENT_TIMESTAMP;

COMMIT
