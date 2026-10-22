# Usabilidade do Kora — robô de tarefas

Rodado em 22/10/2026, versão 0.13.1, tela de celular (375 × 812). Script: `auditoria/robo-usabilidade.js` (rodar no console do navegador: `await roboKora()`; apaga os dados daquele navegador).

## Tarefas

| Tarefa | Resultado | Toques |
|---|---|---|
| 1. Montar o plano (questionário) | ✅ chega em "Seu plano está pronto" | 4 |
| 2. Abrir o treino de hoje | ✅ o guia "Como ler esta tela" aparece | 1 |
| 3. Registrar a 1ª série (carga, reps, ✓) | ✅ marca e abre o cronômetro | 3 |
| 4. Trocar um exercício | ✅ | 2 |
| 5. Salvar o treino | ✅ | 1 |
| 6. Ver o progresso | ✅ | 1 |
| 7. Copiar o backup | ✅ | 2 |
| **Total** | **7 de 7** | **14** |

## O que o robô encontrou e foi corrigido (0.13.1)
- **Guia de primeiro uso sumido:** "Como ler esta tela" (o que é ✓, RPE, números em cinza, cronômetro) existia no código mas não aparecia desde a 0.4.0. Agora aparece no primeiro treino até a pessoa tocar em "Entendi" e volta pelo menu ⋯. Provável causa do "não entendi o app" de um amigo.
- **Alvos de toque pequenos** (< 32 px) em links e seções recolhíveis de Treino, Progresso, Perfil e questionário: agora ≥ 40 px.

## O que o robô não mede
Se a pessoa **entende** o que lê. Para isso: perguntar aos amigos onde travaram e aplicar o questionário SUS depois de 1 semana (item 5 da lista).
