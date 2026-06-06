DROP TABLE IF EXISTS usuario_figurinhas CASCADE;
DROP TABLE IF EXISTS figurinhas CASCADE;
DROP TABLE IF EXISTS selecoes CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;

CREATE TABLE grupos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE selecoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    grupo_id INTEGER REFERENCES grupos(id) ON DELETE SET NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE figurinhas (
    id SERIAL PRIMARY KEY,

    numero_global INTEGER NOT NULL UNIQUE,
    numero_selecao INTEGER,

    codigo VARCHAR(20) NOT NULL UNIQUE,

    tipo VARCHAR(30) NOT NULL,
    raridade VARCHAR(20) NOT NULL,

    secao VARCHAR(50) NOT NULL,

    grupo_nome VARCHAR(50),
    selecao_id INTEGER REFERENCES selecoes(id) ON DELETE SET NULL,

    nome VARCHAR(150) NOT NULL,
    jogador VARCHAR(150),
    posicao VARCHAR(50),

    observacoes TEXT,
    url_fonte TEXT,
    status_cadastro VARCHAR(30) DEFAULT 'OK',

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_figurinhas_raridade
        CHECK (raridade IN ('NORMAL', 'SHINY')),

    CONSTRAINT chk_figurinhas_tipo
        CHECK (tipo IN (
            'jogador',
            'foto_do_time',
            'escudo_do_time',
            'FWC',
            'logo_panini'
        )),

    CONSTRAINT chk_figurinhas_secao
        CHECK (secao IN ('Seleções', 'Especiais')),

    CONSTRAINT chk_numero_selecao
        CHECK (
            numero_selecao IS NULL
            OR numero_selecao BETWEEN 1 AND 20
        )
);

CREATE TABLE usuario_figurinhas (
    id SERIAL PRIMARY KEY,

    figurinha_id INTEGER NOT NULL REFERENCES figurinhas(id) ON DELETE CASCADE,

    possui BOOLEAN NOT NULL DEFAULT FALSE,
    colada BOOLEAN NOT NULL DEFAULT FALSE,
    quantidade_repetida INTEGER NOT NULL DEFAULT 0,

    obtida_em TIMESTAMP,
    colada_em TIMESTAMP,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_usuario_figurinha UNIQUE (figurinha_id),

    CONSTRAINT chk_quantidade_repetida
        CHECK (quantidade_repetida >= 0)
);

CREATE INDEX idx_figurinhas_selecao_id
ON figurinhas(selecao_id);

CREATE INDEX idx_figurinhas_tipo
ON figurinhas(tipo);

CREATE INDEX idx_figurinhas_secao
ON figurinhas(secao);

CREATE INDEX idx_figurinhas_grupo_nome
ON figurinhas(grupo_nome);

CREATE INDEX idx_figurinhas_numero_selecao
ON figurinhas(numero_selecao);

CREATE INDEX idx_figurinhas_ordem_selecao
ON figurinhas(selecao_id, numero_selecao);

CREATE INDEX idx_usuario_figurinhas_figurinha_id
ON usuario_figurinhas(figurinha_id);

CREATE OR REPLACE FUNCTION atualizar_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_figurinhas_atualizado_em
BEFORE UPDATE ON figurinhas
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trg_usuario_figurinhas_atualizado_em
BEFORE UPDATE ON usuario_figurinhas
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();