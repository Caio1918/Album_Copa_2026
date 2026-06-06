SELECT COUNT(*) AS total_grupos FROM grupos;
SELECT COUNT(*) AS total_selecoes FROM selecoes;
SELECT COUNT(*) AS total_jogadores FROM jogadores;
SELECT COUNT(*) AS total_figurinhas FROM figurinhas;
SELECT COUNT(*) AS total_coladas FROM figurinhas_coladas;
SELECT COUNT(*) AS total_repetidas FROM figurinhas_repetidas;

SELECT tipo, COUNT(*) AS total
FROM figurinhas
GROUP BY tipo
ORDER BY tipo;

SELECT categoria, COUNT(*) AS total
FROM figurinhas
GROUP BY categoria
ORDER BY categoria;

SELECT
    g.nome AS grupo,
    COUNT(DISTINCT s.id) AS total_selecoes,
    COUNT(f.id) AS total_figurinhas
FROM grupos g
LEFT JOIN selecoes s ON s.grupo_id = g.id
LEFT JOIN figurinhas f ON f.selecao_id = s.id
GROUP BY g.nome
ORDER BY g.nome;

SELECT
    s.nome AS selecao,
    s.sigla,
    COUNT(f.id) AS total_figurinhas,
    COUNT(j.id) AS total_jogadores
FROM selecoes s
LEFT JOIN figurinhas f ON f.selecao_id = s.id
LEFT JOIN jogadores j ON j.selecao_id = s.id
GROUP BY s.nome, s.sigla
ORDER BY s.nome;
