BEGIN;

CREATE TEMP TABLE importacao_figurinhas_csv (
    number_global INTEGER,
    team_slot INTEGER,
    code VARCHAR(20),
    type VARCHAR(20),
    category VARCHAR(30),
    section VARCHAR(50),
    grupo VARCHAR(50),
    team VARCHAR(100),
    country_code VARCHAR(10),
    name VARCHAR(150),
    player VARCHAR(150),
    position VARCHAR(50),
    notes TEXT,
    source_url TEXT,
    status_cadastro VARCHAR(30)
);

\copy importacao_figurinhas_csv (number_global, team_slot, code, type, category, section, grupo, team, country_code, name, player, position, notes, source_url, status_cadastro) FROM '/mnt/data/tabela_figurinhas_album_copa_2026_atualizada.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

INSERT INTO grupos (nome)
SELECT DISTINCT grupo
FROM importacao_figurinhas_csv
WHERE grupo IS NOT NULL
  AND TRIM(grupo) <> ''
ON CONFLICT (nome) DO NOTHING;

INSERT INTO selecoes (nome, codigo, grupo_id)
SELECT DISTINCT
    i.team,
    i.country_code,
    g.id
FROM importacao_figurinhas_csv i
JOIN grupos g ON g.nome = i.grupo
WHERE i.team IS NOT NULL
  AND TRIM(i.team) <> ''
  AND i.country_code IS NOT NULL
  AND TRIM(i.country_code) <> ''
ON CONFLICT (codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    grupo_id = EXCLUDED.grupo_id;

INSERT INTO figurinhas (
    numero_global,
    numero_selecao,
    codigo,
    tipo,
    raridade,
    secao,
    grupo_nome,
    selecao_id,
    nome,
    jogador,
    posicao,
    observacoes,
    url_fonte,
    status_cadastro
)
SELECT
    i.number_global,
    i.team_slot,
    i.code,
    i.category,
    i.type,
    i.section,
    i.grupo,
    s.id,
    i.name,
    NULLIF(i.player, ''),
    NULLIF(i.position, ''),
    NULLIF(i.notes, ''),
    NULLIF(i.source_url, ''),
    COALESCE(NULLIF(i.status_cadastro, ''), 'OK')
FROM importacao_figurinhas_csv i
LEFT JOIN selecoes s ON s.codigo = i.country_code
ON CONFLICT (codigo) DO UPDATE SET
    numero_global = EXCLUDED.numero_global,
    numero_selecao = EXCLUDED.numero_selecao,
    tipo = EXCLUDED.tipo,
    raridade = EXCLUDED.raridade,
    secao = EXCLUDED.secao,
    grupo_nome = EXCLUDED.grupo_nome,
    selecao_id = EXCLUDED.selecao_id,
    nome = EXCLUDED.nome,
    jogador = EXCLUDED.jogador,
    posicao = EXCLUDED.posicao,
    observacoes = EXCLUDED.observacoes,
    url_fonte = EXCLUDED.url_fonte,
    status_cadastro = EXCLUDED.status_cadastro;

INSERT INTO usuario_figurinhas (figurinha_id)
SELECT f.id
FROM figurinhas f
LEFT JOIN usuario_figurinhas uf ON uf.figurinha_id = f.id
WHERE uf.id IS NULL;

COMMIT;

SELECT COUNT(*) AS total_grupos FROM grupos;
SELECT COUNT(*) AS total_selecoes FROM selecoes;
SELECT COUNT(*) AS total_figurinhas FROM figurinhas;

SELECT tipo, COUNT(*) AS total
FROM figurinhas
GROUP BY tipo
ORDER BY tipo;

SELECT codigo, nome, numero_selecao, tipo
FROM figurinhas
WHERE numero_selecao = 13
ORDER BY codigo;

SELECT codigo, nome, tipo, secao
FROM figurinhas
WHERE secao = 'Especiais'
ORDER BY numero_global;
