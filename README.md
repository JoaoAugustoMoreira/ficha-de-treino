# Kora

*Treino com ciência e coração.*

Kora (core + cor, "coração" em latim) monta e acompanha seu treino de musculação com base em evidências científicas.

Ficha de musculação que **monta o treino a partir da sua rotina**: objetivo, dias livres, tempo por sessão, local, dores, prioridades e as outras atividades da semana (jiu-jitsu, corrida, futebol...). Também registra cargas e RPE, sugere a carga de cada treino, mostra gráficos de evolução e lê dados de Whoop, Garmin ou Apple Watch.

O app final é um único arquivo HTML, sem instalação e sem servidor.

## Como usar

### Opção 1: dentro do Claude (recomendado)
1. Baixe o arquivo [`dist/ficha-de-treino.html`](dist/ficha-de-treino.html).
2. No Claude (app ou claude.ai), abra uma conversa nova, anexe o arquivo e escreva:
   > Publique este arquivo como artifact, sem alterar nada no código, com as capabilities db, user e sample. Depois fixe na barra lateral.
3. Abra a ficha e responda o questionário.

Assim, os treinos ficam salvos na sua conta (em qualquer aparelho) e o botão **Analisar meu treino** funciona.

### Opção 2: no navegador (GitHub Pages ou arquivo local)
Abra o `index.html` no navegador ou publique pelo GitHub Pages (Settings → Pages → branch `main`, pasta raiz). Tudo funciona, mas os dados ficam **só naquele navegador** e a análise pelo Claude não aparece. Para não perder nada, use **Perfil → Backup dos dados** de vez em quando.

## O que a ficha faz

| Recurso | Como funciona |
|---|---|
| Planejador | Calcula metas de séries por músculo, ajusta por sono, estresse, idade e esportes, distribui nos dias dentro do tempo do treino e escolhe cada exercício pelo nível. Cada decisão mostra o motivo e a evidência |
| Habilidades | Fazer barra fixa, saltar mais, correr 5 km, proteger as costas, mobilidade, render no esporte |
| Questionário | Objetivo (hipertrofia, força, saúde, emagrecimento, misto), experiência, dias, tempo, local, dores, prioridades, rotina, outras atividades, cardio e relógio |
| Divisões | Automático ou escolha: corpo inteiro, superior/inferior, superior/inferior + corpo inteiro, empurrar/puxar/pernas, ABC, ABCD, ABCDE. Mostra a frequência de cada grupo muscular antes de confirmar |
| Outros esportes | Organiza os dias para não colocar perna no mesmo dia ou na véspera de atividade forte de pernas, reduz séries quando o esporte já cansa a região e desconta do cardio |
| Exercícios | 353 exercícios em 17 padrões de movimento (curados + free-exercise-db), com máquinas, cabo, barra, halteres, kettlebell, elástico e peso do corpo, e sinônimos populares (voador, gêmeos, pulley…), filtradas pelo local (academia completa, básica ou casa) e trocadas por versões mais seguras quando há dor no joelho, ombro ou lombar |
| Volume | Conta as séries semanais por músculo (contagem fracionada) e compara com a meta do objetivo |
| Progressão | Dupla progressão: sobe a carga (+2,5% tronco, +5% pernas) quando todas as séries chegam ao topo da faixa |
| RPE | Lê a 1ª série e diz se deve subir, manter ou reduzir a carga nas próximas |
| Iniciante | RPE máximo 8, 2 semanas de técnica, no máximo 4 dias de musculação no automático |
| Relógios | Whoop (Strain, Recovery, HRV), Garmin (Training Effect, carga, Prontidão, VFC), Apple Watch, outro ou nenhum |
| Cardio | Zona 2 e 4×4, com avaliação do tempo em cada zona |
| Análise semanal | Pelo Claude, guardada semana a semana |
| Rascunho | Nada do que é digitado se perde ao bloquear o celular, trocar de app ou de aba |
| Dúvidas | As perguntas mais comuns, também antes do questionário |
| Guia | Aba explicando RPE, progressão, divisões, volume, descanso, cardio, relógios e alimentação, em linguagem simples |

## Base científica
- Frequência: Schoenfeld, Ogborn & Krieger (2016, *Sports Medicine*); Schoenfeld, Grgic & Krieger (2019, *Journal of Sports Sciences*)
- Volume: Schoenfeld, Ogborn & Krieger (2017, *Journal of Sports Sciences*); Pelland et al. (2025, *Sports Medicine*)
- Proximidade da falha: Refalo et al. (2023); Robinson et al. (2024), *Sports Medicine*
- Faixa de repetições: Schoenfeld et al. (2017, *JSCR*)
- RPE por repetições na reserva: Zourdos et al. (2016, *JSCR*); Halperin et al. (2022)
- Variação de exercícios: Kassiano et al. (2022, *JSCR*)
- Treino concorrente: Wilson et al. (2012, *JSCR*)
- Intervalado 4×4: Helgerud et al. (2007, *MSSE*)
- Proteína: Morton et al. (2018, *British Journal of Sports Medicine*)
- Atividade física: Organização Mundial da Saúde (2020)

## Para quem vai mexer no código

```
data/
  exercicios.json   exercícios: padrão de movimento, locais (completa/basica/casa), opções seguras por dor, fonte
  padroes.json      padrões de movimento: músculo principal e auxiliares (peso fracionado), dica de execução
  divisoes.json     modelos de treino e divisões (corpo inteiro, superior/inferior, ABC...)
  objetivos.json    séries, repetições, RPE, descanso e cardio por objetivo
  esportes.json     quanto cada esporte cansa pernas e tronco, e músculos que cada um exige
  habilidades.json  o que a pessoa quer conseguir e como isso muda o plano
  evidencias.json   cada regra do app com tipo de estudo, força da evidência e fonte
  fontes/           free-exercise-db original, candidatos classificados e traduções
src/
  engine.js         motor: gera o plano (sem DOM, testado)
  app.js            interface
  styles.css, shell.html
scripts/
  build.mjs                         gera index.html e dist/ficha-de-treino.html
  classificar-free-exercise-db.mjs  classifica a base aberta nos padrões da ficha
  importar-free-exercise-db.mjs     junta os aprovados em data/exercicios.json
tests/              testes do motor (node --test)
```

```bash
npm test     # gera o app e roda os testes
```

**Adicionar um exercício:** inclua um item em `data/exercicios.json` com `padrao`, `locais` (a ordem define a posição no menu) e, se for seguro para dor, `seguroPara`. Rode `npm test` e faça o commit de `index.html` e `dist/` junto.

**Mudar uma regra:** altere o dado e registre a fonte em `data/evidencias.json`.

## Créditos
Parte dos exercícios vem da [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domínio público), classificada e traduzida para esta ficha.

## Aviso
Ferramenta **educacional**. Não substitui avaliação médica nem o acompanhamento de um profissional de educação física. Quem marcar sinais de alerta no questionário deve procurar um médico antes de começar.

## Licença
MIT. Veja [LICENSE](LICENSE).

## Licenças de terceiros

- Contornos anatômicos do mapa muscular (`src/corpo.js`): adaptados de [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter), licença MIT — texto em `vendor/react-native-body-highlighter.LICENSE`.
- Exercícios importados: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), domínio público.
