# Auditoria dos planos do Kora

Versão 0.11.0 · 2000 perfis aleatórios (semente fixa) + 16 perfis-gabarito. Gerado por `npm run auditar`.

A régua está em `auditoria/referencias.json`, separada do motor. Cada critério diz se é **evidência** (com fonte) ou **convenção prática**.

## Resumo

| | |
|---|---|
| Nota média | **95/100** |
| Mediana | 97 |
| 10% piores abaixo de | 87 |
| Pior nota | 67 |
| Planos com pelo menos 1 erro | 33 (1.7%) |
| Perfis-gabarito aprovados | 16 de 16 |

## Por critério

| Critério | Peso | Nota média | Planos com achado | Base |
|---|---|---|---|---|
| Volume semanal por músculo | 25 | 91 | 67.7% | evidência (`volume`) |
| Frequência por músculo | 10 | 91 | 17.3% | evidência (`frequencia`) |
| Faixa de repetições | 10 | 100 | 0% | evidência (`faixa-reps`) |
| Proximidade da falha (RPE) | 10 | 100 | 0% | evidência (`falha`) |
| Descanso entre séries | 5 | 96 | 3.9% | evidência (`descanso`) |
| Equilíbrio entre músculos | 10 | 89 | 20.8% | convenção prática (`volume`) |
| Organização do treino | 10 | 98 | 11.1% | convenção prática (`volume-sessao`) |
| Coerência com o perfil | 15 | 100 | 0.5% | regras do app |
| Motivo e evidência | 5 | 100 | 0% | regras do app |

## Achados mais comuns

| Gravidade | Critério | Planos | Exemplo |
|---|---|---|---|
| erro | Volume semanal por músculo | 21 (1.1%) | posterior: 3 séries/semana, abaixo de 10 |
| erro | Volume semanal por músculo | 14 (0.7%) | glúteos: 3 séries/semana, abaixo de 10 |
| erro | Volume semanal por músculo | 4 (0.2%) | pernas: 4 séries/semana, abaixo de 10 |
| erro | Volume semanal por músculo | 3 (0.2%) | peito: 2 séries/semana, abaixo de 6 |
| erro | Volume semanal por músculo | 2 (0.1%) | ombros: 4.5 séries/semana, abaixo de 10 |
| alerta | Volume semanal por músculo | 692 (34.6%) | ombros: 16.3 séries/semana, acima de 14 |
| alerta | Volume semanal por músculo | 402 (20.1%) | peito: 15 séries/semana, acima de 14 |
| alerta | Equilíbrio entre músculos | 341 (17.1%) | costas/peito = 0.6 (11 × 18 séries; esperado 0.75–1.6) |
| alerta | Volume semanal por músculo | 237 (11.9%) | costas: 16 séries/semana, acima de 14 |
| alerta | Frequência por músculo | 211 (10.6%) | 1× por semana: pernas, posterior, glúteos (divisão escolhida pela pessoa) |
| alerta | Volume semanal por músculo | 204 (10.2%) | posterior: 3 séries/semana, abaixo de 4 |
| alerta | Volume semanal por músculo | 189 (9.5%) | glúteos: 12 séries/semana, acima de 10 |
| alerta | Volume semanal por músculo | 184 (9.2%) | glúteos: 3.5 séries/semana, abaixo de 4 |
| alerta | Volume semanal por músculo | 166 (8.3%) | peito: 6 séries/semana, abaixo de 8 |
| alerta | Organização do treino | 160 (8%) | Costas e bíceps: 11 séries diretas de costas num treino |
| alerta | Volume semanal por músculo | 150 (7.5%) | pernas: 6 séries/semana, abaixo de 8 |
| alerta | Organização do treino | 140 (7%) | Peito: 13 séries diretas de peito num treino |
| alerta | Volume semanal por músculo | 132 (6.6%) | ombros: 6.3 séries/semana, abaixo de 8 |
| alerta | Volume semanal por músculo | 122 (6.1%) | pernas: 15 séries/semana, acima de 14 |
| alerta | Equilíbrio entre músculos | 112 (5.6%) | posterior/pernas = 0 (0 × 6 séries; esperado 0.5–1.6) |
| alerta | Volume semanal por músculo | 85 (4.3%) | posterior: 12 séries/semana, acima de 10 |
| alerta | Volume semanal por músculo | 82 (4.1%) | posterior: 3 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| alerta | Volume semanal por músculo | 82 (4.1%) | ombros: 2.5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| alerta | Volume semanal por músculo | 82 (4.1%) | glúteos: 3 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| alerta | Volume semanal por músculo | 79 (4%) | costas: 6 séries/semana, abaixo de 8 |

## Perfis-gabarito

### ✅ Iniciante, 3 dias, hipertrofia — nota 99
Nunca treinou, academia completa, seg/qua/sex, 60 min.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (7 ex, 55 min), Corpo inteiro B (7 ex, 59 min), Corpo inteiro C (6 ex, 52 min)
- Séries/semana: peito 8, costas 9, pernas 8, posterior 5, ombros 8, glúteos 10.5
- Alertas: posterior: 5 séries/semana, abaixo de 6

### ✅ Saúde depois dos 50, 2 dias — nota 100
55 anos, quer saúde, academia básica, ter/qui, 45 min.

- Plano: Corpo inteiro (full body), 2 dias · Corpo inteiro A (7 ex, 45 min), Corpo inteiro B (7 ex, 41 min)
- Séries/semana: peito 4, costas 4, pernas 4, posterior 5, ombros 6, glúteos 5

### ✅ Intermediário, 4 dias, hipertrofia — nota 95
6–12 meses de treino, academia completa, seg/ter/qui/sex, 75 min.

- Plano: Superior / Inferior, 4 dias · Superior A (7 ex, 70 min), Inferior A (8 ex, 75 min), Superior B (7 ex, 66 min), Inferior B (7 ex, 65 min)
- Séries/semana: peito 17, costas 12, pernas 14, posterior 14, ombros 14, glúteos 14
- Alertas: costas/peito = 0.7 (12 × 17 séries; esperado 0.75–1.6)

### ✅ Avançado, 6 dias, hipertrofia — nota 96
Mais de 1 ano, seg a sáb, 75 min.

- Plano: Empurrar / Puxar / Pernas, 6 dias · Empurrar A (6 ex, 58 min), Puxar A (6 ex, 62 min), Pernas A (7 ex, 75 min), Empurrar B (5 ex, 50 min), Puxar B (4 ex, 49 min), Pernas B (6 ex, 65 min)
- Séries/semana: peito 20, costas 24, pernas 16, posterior 16, ombros 23.5, glúteos 16
- Alertas: costas: 24 séries/semana, acima de 20; ombros: 23.5 séries/semana, acima de 20; Empurrar A: 11 séries diretas de peito num treino; Puxar A: 12 séries diretas de costas num treino; Puxar B: 12 séries diretas de costas num treino

### ✅ Força, 4 dias — nota 97
Mais de 1 ano, quer ficar mais forte, 90 min.

- Plano: Superior / Inferior, 4 dias · Superior A (8 ex, 87 min), Inferior A (8 ex, 75 min), Superior B (5 ex, 73 min), Inferior B (7 ex, 71 min)
- Séries/semana: peito 13, costas 14, pernas 13, posterior 13, ombros 14.5, glúteos 12
- Alertas: peito: 13 séries/semana, acima de 12; costas: 14 séries/semana, acima de 12; pernas: 13 séries/semana, acima de 12; posterior: 13 séries/semana, acima de 12; ombros: 14.5 séries/semana, acima de 12

### ✅ Emagrecimento em casa — nota 100
Iniciante, treina em casa, 3 dias, 45 min.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (5 ex, 41 min), Corpo inteiro B (6 ex, 44 min), Corpo inteiro C (5 ex, 37 min)
- Séries/semana: peito 8, costas 9, pernas 8, posterior 6, ombros 9, glúteos 7.5

### ✅ Iniciante com dor no joelho e na lombar — nota 99
Nunca treinou, 3 dias, 60 min, joelho e lombar doem.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (7 ex, 55 min), Corpo inteiro B (7 ex, 59 min), Corpo inteiro C (6 ex, 52 min)
- Séries/semana: peito 8, costas 9, pernas 8, posterior 5, ombros 8, glúteos 10.5
- Alertas: posterior: 5 séries/semana, abaixo de 6

### ✅ Jiu-jitsu forte ter/qui — nota 97
Intermediário, musculação seg/qua/sex 60 min, jiu-jitsu forte ter e qui.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (7 ex, 56 min), Corpo inteiro C (7 ex, 55 min), Corpo inteiro B (6 ex, 58 min)
- Séries/semana: peito 12, costas 9, pernas 8, posterior 5, ombros 10.5, glúteos 10.5
- Alertas: costas: 9 séries/semana, abaixo de 10; pernas: 8 séries/semana, abaixo de 10; posterior: 5 séries/semana, abaixo de 10

### ✅ Corredor, provas no sábado — nota 99
Mais de 1 ano, corre forte ter e sáb, musculação seg/qua/sex, 60 min.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (6 ex, 60 min), Corpo inteiro B (6 ex, 56 min), Corpo inteiro C (6 ex, 60 min)
- Séries/semana: peito 12, costas 12, pernas 9, posterior 7, ombros 11.5, glúteos 8
- Alertas: posterior: 7 séries/semana, abaixo de 8

### ✅ Pouco tempo: 30 min, 3 dias — nota 83
Intermediário, hipertrofia, 30 min por treino.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (3 ex, 30 min), Corpo inteiro B (3 ex, 30 min), Corpo inteiro C (3 ex, 30 min)
- Séries/semana: peito 6, costas 6, pernas 6, posterior 3, ombros 5.5, glúteos 4.5
- Alertas: peito: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 3 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); ombros: 5.5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); glúteos: 4.5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); 1× por semana: posterior, ombros, glúteos

### ✅ Escolheu ABC com 3 dias — nota 85
Intermediário que quer a divisão clássica ABC, 3 dias, 75 min.

- Plano: ABC: Peito+tríceps / Costas+bíceps / Pernas+ombros, 3 dias · Peito e tríceps (7 ex, 62 min), Costas e bíceps (7 ex, 63 min), Pernas e ombros (7 ex, 71 min)
- Séries/semana: peito 11, costas 11, pernas 7, posterior 7, ombros 13.5, glúteos 7
- Alertas: pernas: 7 séries/semana, abaixo de 10; posterior: 7 séries/semana, abaixo de 10; glúteos: 7 séries/semana, abaixo de 10; 1× por semana: peito, costas, pernas, posterior, glúteos (divisão escolhida pela pessoa); Peito e tríceps: 11 séries diretas de peito num treino; Costas e bíceps: 11 séries diretas de costas num treino

### ✅ Prioridade glúteos, 4 dias — nota 100
Intermediária, quer glúteos, 4 dias, 60 min.

- Plano: Superior / Inferior, 4 dias · Superior A (7 ex, 60 min), Inferior A (6 ex, 59 min), Superior B (7 ex, 60 min), Inferior B (6 ex, 59 min)
- Séries/semana: peito 10, costas 12, pernas 14, posterior 14, ombros 13.5, glúteos 14

### ✅ Um pouco de tudo, 5 dias — nota 100
Mais de 1 ano, objetivo misto, 5 dias, 60 min.

- Plano: Superior / Inferior + corpo inteiro, 5 dias · Superior A (7 ex, 59 min), Inferior A (6 ex, 57 min), Superior B (6 ex, 60 min), Inferior B (6 ex, 49 min), Corpo inteiro (5 ex, 53 min)
- Séries/semana: peito 15, costas 17, pernas 16, posterior 14, ombros 13.8, glúteos 14
- Alertas: costas: 17 séries/semana, acima de 16

### ✅ Casa, 2 dias, 30 min — nota 90
Nunca treinou, saúde, em casa, sáb/dom, 30 min.

- Plano: Corpo inteiro (full body), 2 dias · Corpo inteiro A (4 ex, 28 min), Corpo inteiro B (4 ex, 26 min)
- Séries/semana: peito 2, costas 4, pernas 4, posterior 5, ombros 3, glúteos 2
- Alertas: peito: 2 séries/semana, abaixo de 4; ombros: 3 séries/semana, abaixo de 4; glúteos: 2 séries/semana, abaixo de 4; costas/peito = 2 (4 × 2 séries; esperado 0.75–1.6)

### ✅ Não quer agachamento livre nem supino — nota 98
Intermediário, 3 dias, escreveu 'agachamento livre, supino reto com barra' em evitar.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (7 ex, 60 min), Corpo inteiro B (6 ex, 58 min), Corpo inteiro C (7 ex, 59 min)
- Séries/semana: peito 10, costas 9, pernas 10, posterior 6, ombros 11.5, glúteos 12.5
- Alertas: costas: 9 séries/semana, abaixo de 10; posterior: 6 séries/semana, abaixo de 10

### ✅ Futebol forte domingo, 4 dias — nota 100
Intermediário, joga futebol forte no domingo, musculação seg/ter/qui/sex, 60 min.

- Plano: Superior / Inferior, 4 dias · Superior A (6 ex, 56 min), Inferior A (6 ex, 55 min), Superior B (7 ex, 60 min), Inferior B (7 ex, 56 min)
- Séries/semana: peito 10, costas 12, pernas 14, posterior 13, ombros 11.5, glúteos 12.5

## 10 piores planos

| Nota | Perfil | Principais achados |
|---|---|---|
| 67 | hipertrofia · >1 ano · 4 dias · 30 min · casa · divisão abcd · dor: lombar · prioridade: abdômen | peito: 4 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 8 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 2 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 71 | hipertrofia · >1 ano · 4 dias · 30 min · basica · divisão abcd · prioridade: abdômen | peito: 4 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 8 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 2 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 2 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 74 | hipertrofia · >1 ano · 7 dias · 45 min · completa · divisão abcde | peito: 21 séries/semana, acima de 20; pernas: 3 séries/semana, abaixo de 10 (divisão abcde com 6 dias, escolhida pela pessoa; o app avisa); posterior: 7 séries/semana, abaixo de 10 (divisão abcde com 6 dias, escolhida pela pessoa; o app avisa); glúteos: 3 séries/semana, abaixo de 10 (divisão abcde com 6 dias, escolhida pela pessoa; o app avisa) |
| 75 | hipertrofia · 6–12 meses · 3 dias · 30 min · completa · divisão abc · dor: joelho · Dança moderada | peito: 5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 8 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 3 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 75 | hipertrofia · >1 ano · 3 dias · 30 min · casa · divisão ulf · dor: joelho · prioridade: braços · Jiu-jitsu / luta leve | peito: 4 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 4 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 3 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 76 | hipertrofia · >1 ano · 3 dias · 30 min · basica · divisão full · prioridade: abdômen · Futebol moderada | peito: 5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 2 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 76 | hipertrofia · >1 ano · 2 dias · 30 min · casa · divisão abc · prioridade: abdômen | peito: 4 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 8 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 0 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 0 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 76 | hipertrofia · >1 ano · 2 dias · 30 min · casa · dor: joelho · prioridade: braços/abdômen | peito: 2 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 4 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 2 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 2 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 77 | hipertrofia · 6–12 meses · 3 dias · 30 min · completa · divisão ulf | peito: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 3 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 77 | forca · >1 ano · 2 dias · 30 min · completa · prioridade: pernas/posterior/adutores/abdômen · Vôlei / basquete / handebol leve | peito: 2 séries/semana, abaixo de 6 (limite de tempo/dias do perfil); costas: 4 séries/semana, abaixo de 6 (limite de tempo/dias do perfil); pernas: 2 séries/semana, abaixo de 6 (limite de tempo/dias do perfil); posterior: 4 séries/semana, abaixo de 6 (limite de tempo/dias do perfil) |

## Base de evidências

10 de 45 evidências sem DOI em nenhuma fonte: `rpe`, `variacao`, `4x4`, `atividade`, `proteina`, `vfc`, `potencia`, `aquecimento`, `recuperacao`, `volume-sessao`.
