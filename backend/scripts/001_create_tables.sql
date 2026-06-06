BEGIN;

CREATE TABLE IF NOT EXISTS album_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS album_teams (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES album_groups(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_album_teams_group_name UNIQUE (group_id, name)
);

CREATE TABLE IF NOT EXISTS album_stickers (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES album_teams(id) ON DELETE RESTRICT,
    number_global INTEGER NOT NULL UNIQUE,
    team_slot INTEGER NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(30) NOT NULL,
    section VARCHAR(50) NOT NULL DEFAULT 'Seleções',
    name VARCHAR(150) NOT NULL,
    player VARCHAR(150),
    position VARCHAR(80),
    notes TEXT,
    source_url TEXT,
    status_cadastro VARCHAR(40) NOT NULL DEFAULT 'OK',
    is_collected BOOLEAN NOT NULL DEFAULT FALSE,
    collected_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_album_stickers_type CHECK (type IN ('NORMAL', 'SHINY')),
    CONSTRAINT ck_album_stickers_category CHECK (category IN ('PLAYER', 'TEAM_BADGE', 'TEAM_PHOTO')),
    CONSTRAINT ck_album_stickers_status CHECK (status_cadastro IN ('OK', 'PENDENTE_CONFERENCIA')),
    CONSTRAINT ck_album_stickers_team_slot CHECK (team_slot BETWEEN 1 AND 20)
);

CREATE TABLE IF NOT EXISTS album_duplicate_stickers (
    id SERIAL PRIMARY KEY,
    sticker_id INTEGER NOT NULL REFERENCES album_stickers(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_album_duplicate_stickers_sticker UNIQUE (sticker_id),
    CONSTRAINT ck_album_duplicate_stickers_quantity CHECK (quantity >= 1)
);

CREATE INDEX IF NOT EXISTS idx_album_teams_group_id ON album_teams(group_id);
CREATE INDEX IF NOT EXISTS idx_album_stickers_team_id ON album_stickers(team_id);
CREATE INDEX IF NOT EXISTS idx_album_stickers_code ON album_stickers(code);
CREATE INDEX IF NOT EXISTS idx_album_stickers_type ON album_stickers(type);
CREATE INDEX IF NOT EXISTS idx_album_stickers_category ON album_stickers(category);
CREATE INDEX IF NOT EXISTS idx_album_stickers_is_collected ON album_stickers(is_collected);
CREATE INDEX IF NOT EXISTS idx_album_duplicate_stickers_sticker_id ON album_duplicate_stickers(sticker_id);

COMMIT;
