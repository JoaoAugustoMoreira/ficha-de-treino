# Changelog

## 0.5.0 — 2026-10-19
- Questionário em 4 passos (Objetivo, Agenda, Local e metas, Sobre você); ajustes finos ficam em "Mais ajustes".
- Nova tela "Seu plano está pronto": dias, tempo, cardio, por que assim e como usar.
- Navegação com 4 abas (Treino, Progresso, Ajuda, Perfil) e chips de dia dentro de Treino.
- Tela do treino mais limpa: ⓘ único (por quê + como fazer), troca com ícone, opções do dia no menu ⋯.
- RPE mantido, com escala explicada ao tocar em "RPE ⓘ" (aberta no 1º exercício do 1º treino).
- Troca de exercício mostra as 5 melhores opções + "Ver todas".
- Avisos viraram toasts no topo; rodapé do questionário com fundo (não cobre conteúdo).
- Progresso com estado vazio; texto de 1ª vez mais prático.

## 0.4.0 — 2026-10-19
**Esportes com base científica própria**
- Cada esporte tem recomendações com fonte: futebol (Nordic e Copenhagen: −51% lesão de posterior, −41% virilha), corrida (força pesada + saltos melhoram a economia), ciclismo (força pesada nas pernas), natação, tênis/vôlei/handebol (rotação externa do ombro: −28% problemas de ombro), lutas (core), coletivos (saltos melhoram sprint), escalada, remo, dança, caminhada.
- O plano inclui o exercício de prevenção do esporte 1× por semana no dia certo, coloca saltos para quem corre/joga, usa carga alta (4–6 reps) nas pernas de corredores e ciclistas e dá preferência aos exercícios recomendados.
- 9 evidências novas com DOI (agora 27); 3 exercícios de rotação externa do ombro.

**Recuperação sem corte automático**
- Sono curto e estresse alto não reduzem mais o volume: viram um aviso. Nova pergunta: volume que você prefere (menor, padrão, alto).

**Mais limpo e mais rápido**
- Questionário em 7 telas curtas com barra de progresso; escolha de divisão recolhida.
- Cartão do exercício enxuto: nome, "3 × 6–10 · RPE 8 · 2 min", sugestão em uma linha; "ⓘ Por quê" recolhido.
- Sem o tutorial longo na tela do treino (fica no Guia e em Dúvidas); Perfil com blocos recolhidos.
- Correção: no navegador fora do Claude, elementos ocultos apareciam.

## 0.3.0 — 2026-10-19
**Novo planejador: o plano é calculado, não copiado de um molde.**
1. Recuperação: sono, estresse e idade ajustam o volume inicial.
2. Metas de séries por músculo na semana, por objetivo, nível, prioridades, habilidades e esportes.
3. Distribuição das séries nos dias e dentro do tempo do treino (duração estimada por exercício: séries × (execução + descanso)).
4. Escolha do exercício: local, dores, "evitar", nível técnico (iniciante começa em máquinas e halteres) e variação entre os treinos da semana.
5. Cada decisão tem o motivo e a evidência: "Por que este exercício" em cada cartão e "Como o plano foi montado" no Perfil.
- Pergunta nova: **O que você quer conseguir?** Fazer barra fixa, saltar mais, correr 5 km, proteger as costas, ganhar mobilidade e render mais no esporte. Cada uma muda o plano (bloco de progressão de barra, potência no início do treino, plano de corrida semana a semana, core de estabilidade, mobilidade de 5 min, ênfase por esporte).
- Novo padrão **Potência** (saltos, swing, arremesso) e 5 evidências novas (potência, aquecimento, sono/estresse, séries por treino, máquinas × pesos livres).
- Aba **Dúvidas** com as 17 perguntas mais comuns, também disponível antes do questionário.
- 28 testes (eram 22), incluindo "perfis diferentes geram planos diferentes" e "cada exercício explica o porquê".

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
