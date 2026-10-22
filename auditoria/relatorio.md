# Auditoria dos planos do Kora

Versão 0.17.0 · 2000 perfis aleatórios (semente fixa) + 16 perfis-gabarito. Gerado por `npm run auditar`.

A régua está em `auditoria/referencias.json`, separada do motor. Cada critério diz se é **evidência** (com fonte) ou **convenção prática**.

## Resumo

| | |
|---|---|
| Nota média | **95/100** |
| Mediana | 98 |
| 10% piores abaixo de | 87 |
| Pior nota | 67 |
| Planos com pelo menos 1 erro | 19 (1%) |
| Perfis-gabarito aprovados | 16 de 16 |

## Por critério

| Critério | Peso | Nota média | Planos com achado | Base |
|---|---|---|---|---|
| Volume semanal por músculo | 25 | 91 | 64.4% | evidência (`volume`) |
| Frequência por músculo | 10 | 92 | 15.4% | evidência (`frequencia`) |
| Faixa de repetições | 10 | 100 | 0% | evidência (`faixa-reps`) |
| Proximidade da falha (RPE) | 10 | 100 | 0% | evidência (`falha`) |
| Descanso entre séries | 5 | 96 | 3.9% | evidência (`descanso`) |
| Equilíbrio entre músculos | 10 | 88 | 21.3% | convenção prática (`volume`) |
| Organização do treino | 10 | 98 | 11.1% | convenção prática (`volume-sessao`) |
| Coerência com o perfil | 15 | 100 | 0.5% | regras do app |
| Motivo e evidência | 5 | 100 | 0% | regras do app |

## Achados mais comuns

| Gravidade | Critério | Planos | Exemplo |
|---|---|---|---|
| erro | Volume semanal por músculo | 13 (0.7%) | glúteos: 3 séries/semana, abaixo de 10 |
| erro | Volume semanal por músculo | 8 (0.4%) | posterior: 3 séries/semana, abaixo de 10 |
| erro | Volume semanal por músculo | 4 (0.2%) | pernas: 4 séries/semana, abaixo de 10 |
| erro | Volume semanal por músculo | 3 (0.2%) | peito: 2 séries/semana, abaixo de 6 |
| erro | Volume semanal por músculo | 2 (0.1%) | ombros: 4.5 séries/semana, abaixo de 10 |
| alerta | Volume semanal por músculo | 688 (34.4%) | ombros: 16.3 séries/semana, acima de 14 |
| alerta | Volume semanal por músculo | 392 (19.6%) | peito: 15 séries/semana, acima de 14 |
| alerta | Equilíbrio entre músculos | 359 (18%) | costas/peito = 0.6 (11 × 18 séries; esperado 0.75–1.6) |
| alerta | Volume semanal por músculo | 237 (11.9%) | costas: 16 séries/semana, acima de 14 |
| alerta | Frequência por músculo | 202 (10.1%) | 1× por semana: pernas, posterior, glúteos (divisão escolhida pela pessoa) |
| alerta | Volume semanal por músculo | 195 (9.8%) | glúteos: 12 séries/semana, acima de 10 |
| alerta | Volume semanal por músculo | 175 (8.8%) | peito: 6 séries/semana, abaixo de 8 |
| alerta | Volume semanal por músculo | 167 (8.4%) | glúteos: 7 séries/semana, abaixo de 10 |
| alerta | Organização do treino | 160 (8%) | Costas e bíceps: 11 séries diretas de costas num treino |
| alerta | Volume semanal por músculo | 156 (7.8%) | pernas: 6 séries/semana, abaixo de 8 |
| alerta | Volume semanal por músculo | 147 (7.4%) | ombros: 6.3 séries/semana, abaixo de 8 |
| alerta | Organização do treino | 140 (7%) | Peito: 13 séries diretas de peito num treino |
| alerta | Volume semanal por músculo | 135 (6.8%) | posterior: 7 séries/semana, abaixo de 10 |
| alerta | Volume semanal por músculo | 122 (6.1%) | pernas: 15 séries/semana, acima de 14 |
| alerta | Equilíbrio entre músculos | 105 (5.3%) | posterior/pernas = 0 (0 × 6 séries; esperado 0.5–1.6) |
| alerta | Volume semanal por músculo | 100 (5%) | costas: 6 séries/semana, abaixo de 8 |
| alerta | Volume semanal por músculo | 92 (4.6%) | posterior: 12 séries/semana, acima de 10 |
| alerta | Volume semanal por músculo | 83 (4.2%) | ombros: 2.5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| alerta | Volume semanal por músculo | 82 (4.1%) | posterior: 3 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| alerta | Volume semanal por músculo | 82 (4.1%) | glúteos: 3 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |

## Perfis-gabarito

### ✅ Iniciante, 3 dias, hipertrofia — nota 100
Nunca treinou, academia completa, seg/qua/sex, 60 min.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (7 ex, 55 min), Corpo inteiro B (7 ex, 59 min), Corpo inteiro C (6 ex, 53 min)
- Séries/semana: peito 8, costas 9, pernas 8, posterior 8, ombros 8, glúteos 9

### ✅ Saúde depois dos 50, 2 dias — nota 100
55 anos, quer saúde, academia básica, ter/qui, 45 min.

- Plano: Corpo inteiro (full body), 2 dias · Corpo inteiro A (7 ex, 43 min), Corpo inteiro B (7 ex, 39 min)
- Séries/semana: peito 4, costas 4, pernas 4, posterior 5, ombros 6, glúteos 5

### ✅ Intermediário, 4 dias, hipertrofia — nota 95
6–12 meses de treino, academia completa, seg/ter/qui/sex, 75 min.

- Plano: Superior / Inferior, 4 dias · Superior A (7 ex, 70 min), Inferior A (8 ex, 75 min), Superior B (7 ex, 66 min), Inferior B (7 ex, 65 min)
- Séries/semana: peito 17, costas 12, pernas 14, posterior 14, ombros 14, glúteos 14
- Alertas: costas/peito = 0.7 (12 × 17 séries; esperado 0.75–1.6)

### ✅ Avançado, 6 dias, hipertrofia — nota 96
Mais de 1 ano, seg a sáb, 75 min.

- Plano: Empurrar / Puxar / Pernas, 6 dias · Empurrar A · Força (6 ex, 66 min), Puxar A · Força (6 ex, 74 min), Pernas A · Força (7 ex, 75 min), Empurrar B · Hipertrofia (5 ex, 50 min), Puxar B · Hipertrofia (4 ex, 49 min), Pernas B · Hipertrofia (6 ex, 65 min)
- Séries/semana: peito 20, costas 24, pernas 16, posterior 16, ombros 23.5, glúteos 16
- Alertas: costas: 24 séries/semana, acima de 20; ombros: 23.5 séries/semana, acima de 20; Empurrar A · Força: 11 séries diretas de peito num treino; Puxar A · Força: 12 séries diretas de costas num treino; Puxar B · Hipertrofia: 12 séries diretas de costas num treino

### ✅ Força, 4 dias — nota 97
Mais de 1 ano, quer ficar mais forte, 90 min.

- Plano: Superior / Inferior, 4 dias · Superior A (8 ex, 87 min), Inferior A (8 ex, 75 min), Superior B (5 ex, 73 min), Inferior B (7 ex, 71 min)
- Séries/semana: peito 13, costas 14, pernas 13, posterior 13, ombros 14.5, glúteos 12
- Alertas: peito: 13 séries/semana, acima de 12; costas: 14 séries/semana, acima de 12; pernas: 13 séries/semana, acima de 12; posterior: 13 séries/semana, acima de 12; ombros: 14.5 séries/semana, acima de 12

### ✅ Emagrecimento em casa — nota 100
Iniciante, treina em casa, 3 dias, 45 min.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (5 ex, 41 min), Corpo inteiro B (6 ex, 44 min), Corpo inteiro C (6 ex, 43 min)
- Séries/semana: peito 8, costas 9, pernas 8, posterior 9, ombros 9, glúteos 9

### ✅ Iniciante com dor no joelho e na lombar — nota 100
Nunca treinou, 3 dias, 60 min, joelho e lombar doem.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (7 ex, 55 min), Corpo inteiro B (7 ex, 59 min), Corpo inteiro C (6 ex, 53 min)
- Séries/semana: peito 8, costas 9, pernas 8, posterior 8, ombros 8, glúteos 9

### ✅ Jiu-jitsu forte ter/qui — nota 98
Intermediário, musculação seg/qua/sex 60 min, jiu-jitsu forte ter e qui.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro C (7 ex, 59 min), Corpo inteiro A (7 ex, 56 min), Corpo inteiro B (6 ex, 58 min)
- Séries/semana: peito 12, costas 9, pernas 8, posterior 8, ombros 10.5, glúteos 12
- Alertas: costas: 9 séries/semana, abaixo de 10; pernas: 8 séries/semana, abaixo de 10; posterior: 8 séries/semana, abaixo de 10

### ✅ Corredor, provas no sábado — nota 100
Mais de 1 ano, corre forte ter e sáb, musculação seg/qua/sex, 60 min.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A · Força (6 ex, 60 min), Corpo inteiro B (6 ex, 56 min), Corpo inteiro C · Hipertrofia (5 ex, 53 min)
- Séries/semana: peito 12, costas 11, pernas 9, posterior 9, ombros 10.3, glúteos 9.5

### ✅ Pouco tempo: 30 min, 3 dias — nota 80
Intermediário, hipertrofia, 30 min por treino.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (3 ex, 30 min), Corpo inteiro B (3 ex, 30 min), Corpo inteiro C (3 ex, 30 min)
- Séries/semana: peito 6, costas 4, pernas 6, posterior 5, ombros 5, glúteos 5.5
- Alertas: peito: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 4 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); ombros: 5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); glúteos: 5.5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); 1× por semana: ombros, glúteos; costas/peito = 0.7 (4 × 6 séries; esperado 0.75–1.6)

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

- Plano: Superior / Inferior + corpo inteiro, 5 dias · Superior A · Força (7 ex, 59 min), Inferior A · Força (6 ex, 57 min), Superior B · Hipertrofia (6 ex, 60 min), Inferior B · Hipertrofia (6 ex, 49 min), Corpo inteiro (5 ex, 53 min)
- Séries/semana: peito 15, costas 17, pernas 16, posterior 14, ombros 13.8, glúteos 14
- Alertas: costas: 17 séries/semana, acima de 16

### ✅ Casa, 2 dias, 30 min — nota 90
Nunca treinou, saúde, em casa, sáb/dom, 30 min.

- Plano: Corpo inteiro (full body), 2 dias · Corpo inteiro A (4 ex, 28 min), Corpo inteiro B (4 ex, 26 min)
- Séries/semana: peito 2, costas 4, pernas 4, posterior 5, ombros 3, glúteos 2
- Alertas: peito: 2 séries/semana, abaixo de 4; ombros: 3 séries/semana, abaixo de 4; glúteos: 2 séries/semana, abaixo de 4; costas/peito = 2 (4 × 2 séries; esperado 0.75–1.6)

### ✅ Não quer agachamento livre nem supino — nota 99
Intermediário, 3 dias, escreveu 'agachamento livre, supino reto com barra' em evitar.

- Plano: Corpo inteiro (full body), 3 dias · Corpo inteiro A (7 ex, 60 min), Corpo inteiro B (6 ex, 58 min), Corpo inteiro C (6 ex, 58 min)
- Séries/semana: peito 10, costas 9, pernas 10, posterior 9, ombros 9.5, glúteos 14
- Alertas: costas: 9 séries/semana, abaixo de 10; posterior: 9 séries/semana, abaixo de 10; ombros: 9.5 séries/semana, abaixo de 10

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
| 76 | hipertrofia · >1 ano · 2 dias · 30 min · casa · divisão abc · prioridade: abdômen | peito: 4 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 8 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 0 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 0 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 76 | hipertrofia · >1 ano · 2 dias · 30 min · casa · dor: joelho · prioridade: braços/abdômen | peito: 2 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 4 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 2 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 2 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 77 | hipertrofia · 6–12 meses · 3 dias · 30 min · completa · divisão ulf | peito: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); costas: 6 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); pernas: 3 séries/semana, abaixo de 10 (limite de tempo/dias do perfil); posterior: 5 séries/semana, abaixo de 10 (limite de tempo/dias do perfil) |
| 77 | forca · >1 ano · 2 dias · 30 min · completa · prioridade: pernas/posterior/adutores/abdômen · Vôlei / basquete / handebol leve | peito: 2 séries/semana, abaixo de 6 (limite de tempo/dias do perfil); costas: 4 séries/semana, abaixo de 6 (limite de tempo/dias do perfil); pernas: 2 séries/semana, abaixo de 6 (limite de tempo/dias do perfil); posterior: 4 séries/semana, abaixo de 6 (limite de tempo/dias do perfil) |
| 78 | forca · 6–12 meses · 5 dias · 60 min · basica · divisão abcde · prioridade: adutores/ombros · Tênis / beach tennis / padel moderada | peito: 13 séries/semana, acima de 12; pernas: 3 séries/semana, abaixo de 6; ombros: 22 séries/semana, acima de 16; glúteos: 3 séries/semana, abaixo de 6 |

## Base de evidências

Todas as evidências têm DOI.
