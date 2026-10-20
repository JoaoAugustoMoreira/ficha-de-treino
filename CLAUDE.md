# Kora — guia do projeto para o Claude

Kora (core + cor, "coração" em latim) é um app de treino de musculação para leigos: monta o plano pela rotina de cada pessoa, acompanha os treinos e avalia a progressão, sempre com base em evidência científica. Slogan: *Treino com ciência e coração.* Dono: João Augusto Camargo Moreira. Idioma do app e do código: português do Brasil.

## Como rodar
- `npm test` — roda todos os testes (`node --test tests/*.test.mjs`). Rode antes de qualquer commit.
- `npm run build` — gera `index.html` (página completa, GitHub Pages/navegador) e `dist/ficha-de-treino.html` (versão publicada como artifact no claude.ai). **Sempre rebuild e commit os dois arquivos**: o CI falha se estiverem desatualizados.
- Abrir `index.html` no navegador funciona sem servidor (dados ficam no localStorage).

## Estrutura
- `src/engine.js` — motor sem DOM: gera o plano (`buildPlan`) a partir do perfil. Testado em `tests/`.
- `src/app.js` — interface (telas, registro de treino, rascunho, histórico, análise semanal com o Claude).
- `src/charts.js` — Desempenho: mapa muscular, treinos/semana, dias de treino, volume semanal, equilíbrio muscular.
- `src/corpo.js` — contornos anatômicos do boneco (gerado por `scripts/importar-corpo.mjs` a partir de react-native-body-highlighter, MIT; licença em `vendor/`). Não edite à mão.
- `src/styles.css`, `src/shell.html` — estilo e casca da página.
- `data/*.json` — base: `exercicios.json` (366 exercícios), `padroes.json`, `divisoes.json`, `objetivos.json`, `esportes.json`, `habilidades.json`, `evidencias.json` (45 evidências com DOI).
- `scripts/gerar-dicas.mjs` — gera a dica de execução de cada exercício (regras por família de movimento). Rode depois de adicionar exercícios.
- `scripts/importar-free-exercise-db.mjs` — importa exercícios do free-exercise-db (domínio público).

## Regras do motor (não quebrar)
1. Recuperação (sono/estresse) só avisa; **nunca corta volume** (decisão do dono).
2. Metas de séries por músculo por objetivo × nível; contagem fracionada (auxiliar = meia série).
3. Distribuição por treino em passes A–E dentro do tempo: compostos → prioridades → completa compostos → demais acessórios → completa treino curto. `exMinutes = sets*(0.75+rest/60)+1`, mais 5 min de aquecimento.
4. Bíceps e tríceps têm metas separadas; hipertrofia garante 2 séries diretas de cada na semana.
5. Escolha do exercício: local (casa/básica/completa) e dores respeitados; sem repetir exercício no mesmo dia; iniciante prefere variações estáveis.
6. Toda decisão grava `why: [{t, ev}]` com o id de uma evidência existente em `evidencias.json`.
7. Iniciante limitado a RPE 8; perna longe de esporte forte de pernas.

## Regras de conteúdo
- Toda afirmação científica nova precisa de fonte verificada (PubMed, com DOI) em `evidencias.json`. Marque como "convenção prática" o que for costume e não evidência, e como "extrapolação" o que vier de outra população ou esporte.
- Público leigo: textos curtos, diretos, sem jargão; RPE sempre explicado.
- Visual: creme e verde-oliva, títulos em Fraunces, texto e números em Inter, cartões contornados. Sem "cara de arcade".
- Não copiar arte, textos ou marcas de outros apps (ex.: GRIPT).

## Versões e entrega
- Versão em `package.json` + entrada no topo do `CHANGELOG.md` a cada mudança.
- Commits em português, com o que mudou e por quê.
- Link de teste para os amigos: artifact do claude.ai publicado a partir de `dist/ficha-de-treino.html` (atualizado pelo Claude no app, não pelo repositório).

## Fora deste repositório
A ficha pessoal do João ("Ficha Força + BJJ") é outro artifact, com outro código. **Não alterar a partir deste projeto.**
