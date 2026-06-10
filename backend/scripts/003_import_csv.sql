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

\copy tmp_album_stickers_import (number_global, team_slot, code, type, category, section, group_name, team_name, country_code, name, player, position, notes, source_url, status_cadastro) FROM '/srv/album_copa/Album_Copa_2026/backend/scripts/tabela_figurinhas_album_copa_2026.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8')

INSERT INTO grupos (nome)
SELECT DISTINCT NULLIF(TRIM(group_name), '')
FROM tmp_album_stickers_import
WHERE NULLIF(TRIM(group_name), '') IS NOT NULL
ON CONFLICT (nome) DO NOTHING;

INSERT INTO grupos (nome)
VALUES ('Especiais')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO selecoes (nome, sigla, escudo_url, grupo_id)
SELECT DISTINCT
    TRIM(t.team_name),
    TRIM(t.country_code),
    NULL,
    g.id
FROM tmp_album_stickers_import t
JOIN grupos g ON g.nome = TRIM(t.group_name)
WHERE NULLIF(TRIM(t.team_name), '') IS NOT NULL
  AND NULLIF(TRIM(t.country_code), '') IS NOT NULL
ON CONFLICT (sigla) DO UPDATE SET
    nome = EXCLUDED.nome,
    grupo_id = EXCLUDED.grupo_id;

INSERT INTO selecoes (nome, sigla, escudo_url, grupo_id)
SELECT 'Figurinhas Especiais', 'SPECIAL', NULL, g.id
FROM grupos g
WHERE g.nome = 'Especiais'
ON CONFLICT (sigla) DO UPDATE SET
    nome = EXCLUDED.nome,
    grupo_id = EXCLUDED.grupo_id;

INSERT INTO jogadores (nome, posicao, numero, selecao_id)
SELECT DISTINCT
    TRIM(t.player),
    NULLIF(TRIM(t.position), ''),
    t.team_slot,
    s.id
FROM tmp_album_stickers_import t
JOIN selecoes s ON s.sigla = TRIM(t.country_code)
WHERE LOWER(TRIM(t.category)) IN ('player', 'jogador')
  AND NULLIF(TRIM(t.player), '') IS NOT NULL
  AND NULLIF(TRIM(t.country_code), '') IS NOT NULL
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
    TRIM(t.code),
    CASE
        WHEN UPPER(TRIM(t.type)) = 'SHINY' THEN 'brilhante'
        ELSE 'normal'
    END AS tipo,
    NULL AS imagem_url,
    t.number_global,
    t.team_slot,
    NULLIF(TRIM(t.name), ''),
    CASE
        WHEN LOWER(TRIM(t.category)) IN ('player', 'jogador') THEN 'jogador'
        WHEN LOWER(TRIM(t.category)) IN ('team_badge', 'escudo_do_time') THEN 'escudo'
        WHEN LOWER(TRIM(t.category)) IN ('team_photo', 'foto_do_time') THEN 'foto_selecao'
        WHEN LOWER(TRIM(t.category)) = 'logo_panini' THEN 'logo_panini'
        WHEN LOWER(TRIM(t.category)) = 'fwc' THEN 'fwc'
        ELSE LOWER(NULLIF(TRIM(t.category), ''))
    END AS categoria,
    NULLIF(TRIM(t.section), ''),
    NULLIF(TRIM(t.notes), ''),
    NULLIF(TRIM(t.source_url), ''),
    NULLIF(TRIM(t.status_cadastro), ''),
    j.id AS jogador_id,
    s.id AS selecao_id
FROM tmp_album_stickers_import t
JOIN selecoes s ON s.sigla = COALESCE(NULLIF(TRIM(t.country_code), ''), 'SPECIAL')
LEFT JOIN jogadores j
    ON j.nome = TRIM(t.player)
   AND j.selecao_id = s.id
WHERE NULLIF(TRIM(t.code), '') IS NOT NULL
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

DO $$
DECLARE
    total_figurinhas INTEGER;
    total_especiais INTEGER;
    total_fwc INTEGER;
    total_panini_00 INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_figurinhas FROM figurinhas;
    SELECT COUNT(*) INTO total_especiais FROM figurinhas f JOIN selecoes s ON s.id = f.selecao_id WHERE s.sigla = 'SPECIAL';
    SELECT COUNT(*) INTO total_fwc FROM figurinhas WHERE categoria = 'fwc';
    SELECT COUNT(*) INTO total_panini_00 FROM figurinhas WHERE codigo = '00' AND categoria = 'logo_panini';

    IF total_figurinhas <> 980 THEN
        RAISE EXCEPTION 'Importação inválida: esperado 980 figurinhas, encontrado %.', total_figurinhas;
    END IF;

    IF total_especiais <> 20 THEN
        RAISE EXCEPTION 'Importação inválida: esperado 20 figurinhas especiais, encontrado %.', total_especiais;
    END IF;

    IF total_fwc <> 19 THEN
        RAISE EXCEPTION 'Importação inválida: esperado 19 figurinhas FWC, encontrado %.', total_fwc;
    END IF;

    IF total_panini_00 <> 1 THEN
        RAISE EXCEPTION 'Importação inválida: figurinha 00 da Panini não encontrada corretamente.';
    END IF;
END $$;

COMMIT;
