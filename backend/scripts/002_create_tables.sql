BEGIN;

CREATE TABLE grupos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

CREATE INDEX ix_grupos_id ON grupos(id);

CREATE TABLE selecoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    sigla VARCHAR(10) NOT NULL UNIQUE,
    escudo_url VARCHAR(255),
    grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON DELETE CASCADE
);

CREATE INDEX ix_selecoes_id ON selecoes(id);
CREATE INDEX idx_selecoes_grupo_id ON selecoes(grupo_id);

CREATE TABLE jogadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    posicao VARCHAR(50),
    numero INTEGER,
    selecao_id INTEGER NOT NULL REFERENCES selecoes(id) ON DELETE CASCADE,
    CONSTRAINT uq_jogadores_nome_selecao UNIQUE (nome, selecao_id)
);

CREATE INDEX ix_jogadores_id ON jogadores(id);
CREATE INDEX ix_jogadores_nome ON jogadores(nome);
CREATE INDEX idx_jogadores_selecao_id ON jogadores(selecao_id);

CREATE TABLE figurinhas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    tipo VARCHAR(30) NOT NULL DEFAULT 'normal',
    imagem_url VARCHAR(255),
    numero_global INTEGER UNIQUE,
    numero_na_selecao INTEGER,
    nome VARCHAR(150),
    categoria VARCHAR(50),
    secao VARCHAR(50),
    observacoes TEXT,
    fonte_url VARCHAR(500),
    status_cadastro VARCHAR(50),
    jogador_id INTEGER REFERENCES jogadores(id) ON DELETE SET NULL,
    selecao_id INTEGER NOT NULL REFERENCES selecoes(id) ON DELETE CASCADE,
    CONSTRAINT ck_figurinhas_tipo CHECK (tipo IN ('normal', 'brilhante')),
    CONSTRAINT ck_figurinhas_numero_na_selecao CHECK (numero_na_selecao IS NULL OR numero_na_selecao BETWEEN 1 AND 20)
);

CREATE INDEX ix_figurinhas_id ON figurinhas(id);
CREATE INDEX ix_figurinhas_codigo ON figurinhas(codigo);
CREATE INDEX ix_figurinhas_numero_global ON figurinhas(numero_global);
CREATE INDEX ix_figurinhas_nome ON figurinhas(nome);
CREATE INDEX ix_figurinhas_tipo ON figurinhas(tipo);
CREATE INDEX ix_figurinhas_categoria ON figurinhas(categoria);
CREATE INDEX idx_figurinhas_jogador_id ON figurinhas(jogador_id);
CREATE INDEX idx_figurinhas_selecao_id ON figurinhas(selecao_id);

CREATE TABLE figurinhas_coladas (
    id SERIAL PRIMARY KEY,
    figurinha_id INTEGER NOT NULL UNIQUE REFERENCES figurinhas(id) ON DELETE CASCADE,
    data_colagem TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_figurinhas_coladas_id ON figurinhas_coladas(id);
CREATE INDEX idx_figurinhas_coladas_figurinha_id ON figurinhas_coladas(figurinha_id);
CREATE INDEX idx_figurinhas_coladas_data_colagem ON figurinhas_coladas(data_colagem);

CREATE TABLE figurinhas_repetidas (
    id SERIAL PRIMARY KEY,
    figurinha_id INTEGER NOT NULL UNIQUE REFERENCES figurinhas(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT ck_figurinhas_repetidas_quantidade CHECK (quantidade >= 1)
);

CREATE INDEX ix_figurinhas_repetidas_id ON figurinhas_repetidas(id);
CREATE INDEX idx_figurinhas_repetidas_figurinha_id ON figurinhas_repetidas(figurinha_id);

COMMIT;
