\set ON_ERROR_STOP on

BEGIN;

DROP TABLE IF EXISTS tmp_album_stickers_import;

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

\copy tmp_album_stickers_import (number_global, team_slot, code, type, category, section, group_name, team_name, country_code, name, player, position, notes, source_url, status_cadastro) FROM '/srv/album_copa/Album_Copa_2026/backend/scripts/tabela_figurinhas_album_copa_2026_atualizada.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8')

INSERT INTO grupos (nome)
SELECT DISTINCT group_name
FROM tmp_album_stickers_import
WHERE group_name IS NOT NULL
  AND group_name <> ''
ON CONFLICT (nome) DO NOTHING;

INSERT INTO selecoes (nome, sigla, escudo_url, grupo_id)
SELECT DISTINCT
    t.team_name,
    t.country_code,
    NULL,
    g.id
FROM tmp_album_stickers_import t
JOIN grupos g ON g.nome = t.group_name
WHERE t.team_name IS NOT NULL
  AND t.team_name <> ''
  AND t.country_code IS NOT NULL
  AND t.country_code <> ''
ON CONFLICT (sigla) DO UPDATE SET
    nome = EXCLUDED.nome,
    grupo_id = EXCLUDED.grupo_id;

INSERT INTO jogadores (nome, posicao, numero, selecao_id)
SELECT DISTINCT
    t.player,
    NULLIF(t.position, ''),
    t.team_slot,
    s.id
FROM tmp_album_stickers_import t
JOIN selecoes s ON s.sigla = t.country_code
WHERE t.category = 'PLAYER'
  AND t.player IS NOT NULL
  AND t.player <> ''
ON CONFLICT (nome, selecao_id) DO UPDATE SET
    posicao = EXCLUDED.posicao,
    numero = EXCLUDED.numero;

INSERT INTO figurinhas (
    codigo,
    tipo,
    imagem_url,
    numero_global,
    numero_na_selecao,
    nome,
    categoria,
    secao,
    observacoes,
    fonte_url,
    status_cadastro,
    jogador_id,
    selecao_id
)
SELECT
    t.code,
    CASE
        WHEN t.type = 'SHINY' THEN 'brilhante'
        ELSE 'normal'
    END AS tipo,
    NULL AS imagem_url,
    t.number_global,
    t.team_slot,
    NULLIF(t.name, ''),
    CASE
        WHEN t.category = 'PLAYER' THEN 'jogador'
        WHEN t.category = 'TEAM_BADGE' THEN 'escudo'
        WHEN t.category = 'TEAM_PHOTO' THEN 'foto_selecao'
        ELSE LOWER(NULLIF(t.category, ''))
    END AS categoria,
    NULLIF(t.section, ''),
    NULLIF(t.notes, ''),
    NULLIF(t.source_url, ''),
    NULLIF(t.status_cadastro, ''),
    j.id AS jogador_id,
    s.id AS selecao_id
FROM tmp_album_stickers_import t
JOIN selecoes s ON s.sigla = t.country_code
LEFT JOIN jogadores j
    ON j.nome = t.player
   AND j.selecao_id = s.id
WHERE t.code IS NOT NULL
  AND t.code <> ''
ON CONFLICT (codigo) DO UPDATE SET
    tipo = EXCLUDED.tipo,
    imagem_url = EXCLUDED.imagem_url,
    numero_global = EXCLUDED.numero_global,
    numero_na_selecao = EXCLUDED.numero_na_selecao,
    nome = EXCLUDED.nome,
    categoria = EXCLUDED.categoria,
    secao = EXCLUDED.secao,
    observacoes = EXCLUDED.observacoes,
    fonte_url = EXCLUDED.fonte_url,
    status_cadastro = EXCLUDED.status_cadastro,
    jogador_id = EXCLUDED.jogador_id,
    selecao_id = EXCLUDED.selecao_id;

COMMIT;
