# Changelog

## 0.2.3 — 2026-10-19
- Perfil → **Recomeçar do zero**: apaga perfil, treinos e análises e volta ao questionário, com confirmação na própria tela.
- Correção: em "exercícios a evitar", nomes separados por "e", "ou" ou "/" não eram reconhecidos (ex.: "agachamento livre e elevação pélvica").

## 0.2.2 — 2026-10-19
- Novo grupo muscular **Adutores** (parte interna da coxa): cadeira adutora, adução no cabo, prancha de Copenhagen, adução com elástico, adução deitado de lado e agachamento sumô.
- Entra no fim dos treinos de perna quando o tempo permite; pode ser marcado como prioridade e aparece no volume semanal.
- Agachamento e dobradiça de quadril contam 1/4 de série para adutores.

## 0.2.1 — 2026-10-19
- 11 máquinas novas com o nome usado nas academias: cadeira adutora, graviton (barra e mergulho), supino vertical (chest press), crucifixo na máquina, leg press vertical, glúteo na máquina, panturrilha sentado na máquina, remada baixa e cavalinho na máquina, extensão lombar.
- Sinônimos (voador = peck deck, gêmeos = panturrilha, pulley = tríceps no cabo…): aparecem no menu Trocar e valem no campo "exercícios a evitar".
- Dica de execução própria por exercício, quando existe.
- Removida rosca martelo na corda duplicada.

## 0.2.0 — 2026-10-19
- Base de dados separada do código: `data/*.json` (exercícios, padrões, divisões, objetivos, esportes, evidências).
- 343 exercícios (eram 204): 139 novos da free-exercise-db (domínio público), classificados por padrão de movimento e traduzidos.
- `data/evidencias.json`: 13 regras com tipo de estudo, força da evidência e fontes; a aba Guia passa a mostrar a base a partir dele.
- Motor separado da interface (`src/engine.js`) e 16 testes automáticos rodando no GitHub Actions.
- `dist/ficha-de-treino.html`: arquivo pronto para publicar no Claude.

## 0.1.0 — 2026-10-19
Primeira versão pública.
- Questionário que monta o plano pela rotina: objetivo, dias, tempo, local, dores, prioridades, outros esportes, cardio e relógio.
- 7 divisões de treino + automático, com frequência por grupo muscular e volume semanal.
- Organização dos dias em volta de outros esportes; desconto de cardio.
- Registro de séries com sugestão de carga (dupla progressão) e leitura do RPE da 1ª série.
- Rascunho à prova de perda (mesclagem campo a campo, cópia de segurança do dia).
- Whoop, Garmin e Apple Watch; cardio zona 2 e 4×4.
- Guia em linguagem simples e análise semanal pelo Claude.
