# Changelog

## 0.17.2 — 2026-10-22 · o Kora não finge que salvou
Um amigo (sem convite, no **modo local**) preencheu o questionário, o app disse "Plano criado", e ao fechar e abrir de novo voltou ao começo: o navegador dele não guardava os dados.
- **Por quê:** no modo local, se o navegador bloqueia ou apaga o armazenamento (aba anônima, navegador de dentro do WhatsApp/Instagram, cookies bloqueados), a gravação falhava em silêncio e a tela mostrava sucesso.
- **Agora:** ao abrir, o Kora testa se o navegador guarda dados. Se não guarda, mostra no questionário e no Início "Este navegador não está guardando o Kora" e explica onde abrir (app do Claude com a conta, ou Safari/Chrome). Gravação que falha mostra "não consegui salvar", nunca sucesso.
- **No questionário**, quem está sem conta vê que os dados ficam só naquele navegador e como salvar na conta.
- No modo local, o Kora pede ao navegador armazenamento persistente (menos chance de ele apagar os dados sozinho).

## 0.17.1 — 2026-10-22 · pendências da auditoria
- **Todas as 46 evidências com DOI**, conferidos no PubMed: RPE (Zourdos 2016, Halperin 2022), variação (Kassiano 2022), 4×4 (Helgerud 2007), proteína (Morton 2018, Schoenfeld & Aragon 2018), VFC (Manresa-Rocamora 2021, Düking 2021), potência (Markovic 2007, Slimani 2016), aquecimento (Fradkin 2010, Behm 2016), recuperação (Craven 2022, Stults-Kolehmainen 2012), séries por treino (Schoenfeld 2019) e OMS 2020 (Bull et al., BJSM). Corrigida a revista de Fradkin 2010 (J Strength Cond Res). Teste novo: toda evidência precisa de DOI.
- **Corpo inteiro C** ganhou a dobradiça de quadril como opção: em treinos curtos de 3 dias o posterior ficava só com o dia B. Planos com erro na auditoria: 1,7% → 1,0% (catraca atualizada).

## 0.17.0 — 2026-10-22 · medir resultado
- **Seus resultados** (Progresso): constância nas últimas semanas (treinos feitos ÷ planejados, com orientação) e força estimada do 1º ao último treino de cada exercício (treino leve não entra). Função `resultados` no motor, com teste.
- **Como está o Kora para você?** (Início, depois de 1 semana de uso): as 10 perguntas da escala SUS, nota de 0 a 100 e campo livre. Dá para adiar 7 dias. No fim, **Enviar para o João pelo WhatsApp**, com a nota e as respostas (a pessoa vê a mensagem antes de enviar). `notaSUS` no motor, com teste.
- **Achei um problema** (menu ⋯ do treino e Perfil): a pessoa descreve e envia pelo WhatsApp com a versão do app e a tela.
- Os dados dos amigos ficam no aparelho deles; por isso o envio é pelo WhatsApp, só quando a pessoa quiser.

## 0.16.0 — 2026-10-22 · opções para quem treina há anos
- **Dia de força e dia de hipertrofia** (quem treina há mais de 1 ano, objetivo hipertrofia ou misto): os treinos A (Superior A, Inferior A, Empurrar A…) ficam de força, com compostos 4–6 reps e 3 min de descanso; os treinos B ficam de hipertrofia, 8–12 reps. Os acessórios não mudam. O nome do treino mostra "· Força" ou "· Hipertrofia". Variar dentro da semana rende mais força em treinados (evidência `periodizacao`). Se o dia de força não couber no tempo, o descanso cai para 2,5 e depois 2 min. Desliga com `pf.ondulacao = "nao"`.
- **Bi-sets em treinos de até 45 min:** acessórios opostos (bíceps + tríceps, elevação lateral + posterior de ombro, extensora + flexora, glúteo + adutor, panturrilha + abdômen) ficam lado a lado, 1 série de cada e descanso depois do par. Mesmo volume, menos tempo (evidência `tempo-eficiente`). O cronômetro dá 15 s para trocar.

## 0.15.0 — 2026-10-22 · semana leve planejada
- **Ciclo de 7 semanas:** 6 normais + 1 semana leve (deload). Na semana leve o "Treino leve" liga sozinho: metade das séries, esforço 6, mesmas cargas e mesmos dias; o treino não conta para a progressão. Dá para pular a semana (fica salvo só para aquela semana).
- **Início** mostra "Semana N · semana leve daqui a X semanas"; na semana leve, um aviso no Início e no treino.
- **Evidência nova `deload`** (conferida no PubMed): reduzir séries e esforço por 1 semana não atrapalhou a hipertrofia (Pancar 2026); parar 1 semana inteira atrasou um pouco a força em treinados (Coleman 2024); atletas fazem a cada ~5–6 semanas (Rogerson 2024). Força da evidência: baixa. O app diz que o motivo é controlar o cansaço.

## 0.14.0 — 2026-10-22 · progressão no motor, com testes
A sugestão de carga ficava na interface, sem nenhum teste (os bugs desta semana nasceram ali). Agora é `sugerirCarga` em `engine.js`, com 15 testes em `tests/progressao.test.mjs`, e ganhou as regras já validadas na ficha Força + BJJ:
- **Esforço longe do alvo:** RPE médio 1,5+ ponto fora do alvo num treino, ou 1+ ponto no mesmo sentido em 2 treinos seguidos, ajusta a carga pela força estimada (para cima, no máximo +10%). O card explica: "esforço 9, acima do alvo 8".
- **Reduzir** só depois de 2 treinos seguidos abaixo do mínimo, e quem caiu só na última série indo à falha não conta (o card lembra de parar com 1–2 sobrando). A redução é pela força estimada, não mais −10% fixo.
- **Estagnação:** 3 treinos sem subir carga nem reps → "⚠ Parado: troque a variação ou reduza 10% e reconstrua".
- **Back-off** no fim não impede mais o "topo da faixa".

## 0.13.1 — 2026-10-22 · primeiro uso
- **Guia "Como ler esta tela" de volta.** Ele explica ✓, RPE, números em cinza, cronômetro, ⇄, ⓘ e ＋. Existia no código mas deixou de aparecer na 0.4.0. Agora aparece no primeiro treino até tocar em "Entendi" e volta pelo menu ⋯ → "Como ler esta tela".
- **Robô de usabilidade** (`auditoria/robo-usabilidade.js`): faz as 7 tarefas principais na tela de celular e mede toques, alvos pequenos e rolagem lateral. Resultado em `auditoria/usabilidade.md`: 7 de 7 tarefas, 14 toques.
- **Alvos de toque** de links e seções recolhíveis com pelo menos 40 px de altura.

## 0.13.0 — 2026-10-22 · ninguém perde o histórico
Um amigo abriu o Kora, encontrou o app vazio, se recadastrou e achou que tinha perdido os treinos.
- **Por quê:** quem abre pelo link sem convite usa o Kora no **modo local**: os dados ficam só no navegador daquele aparelho (o `user` do claude.ai só identifica a organização do dono e convidados). Abrir em outro navegador ou app (ex.: primeiro no navegador do WhatsApp, depois no Safari) mostra um Kora vazio. As atualizações não apagam nada: a chave e o caminho dos dados nunca mudaram.
- **"Já usei o Kora em outro aparelho ou navegador"** na primeira tela: cola o backup e volta tudo, sem recadastro.
- **Aviso no Início** para quem está no modo local, com **Copiar backup** (também em Perfil → Backup).
- **Migração automática:** se a pessoa passar a usar a conta (ex.: convidada por e-mail), o que estava no navegador sobe para a conta, sem apagar nada. Na conta, cada gravação também guarda uma cópia no aparelho.
- **Sem queda silenciosa:** se a conta não responde, o app tenta de novo e mostra "Não consegui carregar seus treinos — não precisa se cadastrar de novo", em vez de abrir o questionário vazio (antes caía para o modo local e o novo cadastro ficava só no aparelho).
- **Contrato de armazenamento** (`tests/armazenamento.test.mjs`): o teste quebra se alguém mudar a chave do navegador, o caminho na conta ou os ids dos documentos.

## 0.12.3 — 2026-10-20 · série mais pesada que deu certo vira a carga nova
- A regra da 0.12.2 tratava toda série mais pesada no fim como tentativa. Quem fazia 20 × 9, 20 × 10 e subia para 25 × 7 a RPE 8,5 tinha a progressão calculada a partir dos 20. Agora a série mais pesada do fim só é tentativa se **não superou a força estimada (e1RM)** das outras; se superou, é a carga nova.

## 0.12.2 — 2026-10-20 · séries de trabalho
- **Tentativa mais pesada no fim não vira base.** Quem fazia 40 kg × 7, 7 e tentava 45 kg × 3 no fim recebia a sugestão a partir dos 45 kg. Agora uma única série mais pesada no fim, depois de 2+ séries com a mesma carga, conta como tentativa; a base continua 40 kg. Mais leves antes (aquecimento) e depois (back-off) também não entram. Regra em `workSets` (engine.js), com teste.

## 0.12.1 — 2026-10-20 · adicionar durante o treino
- Cada exercício ganhou um botão **＋** que adiciona outro **logo depois dele**, a qualquer momento do treino (o botão do fim continua para adicionar no final). A posição fica salva.

## 0.12.0 — 2026-10-20 · adicionar exercício
- **＋ Adicionar exercício** no fim de cada treino: busca nos 366 exercícios da base (pelo nome ou pelo nome popular, ex.: "voador"), mostrando primeiro os que existem no local da pessoa; escolhe 2, 3 ou 4 séries. Não achou? Digita o nome e escolhe o músculo.
- O exercício adicionado ganha reps, RPE e descanso do objetivo, sugestão de carga, histórico e progressão como os outros, conta no volume da semana e pode ser trocado (⇄) ou removido (ⓘ → Remover da ficha; o histórico continua salvo).
- Se o treino passar do tempo marcado no perfil, a ficha avisa quantos minutos ficou.
- Fica em `prefs.extra` (por dia) e sobrevive às atualizações do motor: o id usa um código fixo, não a posição.

## 0.11.2 — 2026-10-20 · leitura da série pela última série feita
- **Aviso durante o treino olhava só a 1ª série.** Um aluno fez 160 kg × 10 a RPE 6, subiu para 200 kg × 8 a RPE 9, e a ficha mandava "Mantenha 160 kg". Agora o aviso usa a **última série com RPE** e compara com o alvo da próxima série; vale para todos os exercícios. As séries seguintes ainda vazias passam a sugerir (em cinza) a carga e as reps recomendadas, então o ✓ já preenche certo.

## 0.11.1 — 2026-10-20 · atualização sem bagunçar o treino do dia
- **Rascunho e trocas presos ao exercício, não à posição.** Antes, o que a pessoa digitava (carga, reps, RPE) e as trocas (⇄) eram guardados pela posição do exercício no treino ("3º exercício do dia 1"). Se uma atualização do app mudasse o plano, uma carga podia aparecer em outro exercício. Agora o id do exercício é dia + padrão de movimento (`d1_hpush`), o rascunho guarda o nome de cada exercício e só devolve o valor ao mesmo exercício, e a troca guarda o nome escolhido. Valor de um exercício que saiu do plano fica guardado no rascunho, mas não vai parar em outro.
- Teste novo: o id não depende da posição e não muda quando entra outro exercício no dia.

## 0.11.0 — 2026-10-20 · auditor de plano
Nova ferramenta para medir se o treino montado é bom, não só se o app não quebra.
- **Auditor** (`auditoria/auditor.mjs`): dá nota de 0 a 100 a cada plano em 9 critérios (volume, frequência, repetições, RPE, descanso, equilíbrio, organização, coerência com o perfil, motivo e evidência). A régua fica em `auditoria/referencias.json`, separada do motor, com a fonte de cada faixa e a marcação "evidência" ou "convenção prática".
- **`npm run auditar`**: audita 2.000 perfis aleatórios e escreve `auditoria/relatorio.md` (resumo, achados mais comuns, piores planos, evidências sem DOI).
- **16 perfis-gabarito** (`auditoria/personas.mjs`): iniciante, 50+, avançado, força, casa, dor, jiu-jitsu, corrida, futebol, pouco tempo, ABC… com o que o plano precisa ter, escrito antes de olhar o resultado. Rodam no `npm test`.
- **Catraca** (`auditoria/linha-de-base.json`): o CI falha se a nota média cair ou se aumentar a fração de planos com erro.
- **Evidências:** DOIs conferidos no PubMed para frequência (Schoenfeld 2016 e 2019), volume (Schoenfeld 2017), faixa de repetições, descanso e progressão (ACSM 2009). "Faixa de repetições" corrigida de ensaio clínico para meta-análise.
- Primeira auditoria: nota média 91; 32% dos planos com ao menos 1 erro. Depois das correções abaixo: **nota média 95; 1,7% com erro**; 16 de 16 gabaritos aprovados. Detalhes em `auditoria/relatorio.md`.

**Correções que a auditoria encontrou**
- **Dor (segurança):** em ~20% dos planos com dor, a variação semanal trocava a opção segura por outra (ex.: leg press com dor no joelho, desenvolvimento com dor no ombro). Agora a dor vem antes de tudo na escolha, e com duas dores o exercício precisa servir para as duas. Se a única opção segura já está no treino, o repetido sai em vez de entrar um inseguro.
- **Opções seguras em casa:** não havia remada nem dobradiça de quadril seguras para lombar, nem agachamento seguro para joelho em casa. Entraram: remada apoiada com halteres, remada com elástico, remada invertida na mesa, ponte de glúteo com halter, pull-through com elástico (lombar); agachamento goblet com halter e agachamento até o banco (joelho); supino no chão, flexão inclinada, supino inclinado pegada neutra, tríceps com elástico e tríceps coice (ombro). Convenção prática, espelhando as opções seguras que já existiam na academia.
- **Peito sem exercício principal:** "Superior B" e "Corpo inteiro C" só tinham supino inclinado (acessório); com 4×30 min o peito ficava com 3 séries/semana e as costas com 12. Os dois modelos ganharam um supino.
- **Treino curto:** em 30 min, o composto que entra é o do músculo mais longe da meta (antes, o desenvolvimento sempre ficava de fora); compostos vão até 3 séries antes dos acessórios de músculos grandes, e só depois até 4; panturrilha, abdômen e adutores ficam para o fim; descanso de 2 min (em vez de 3) nos compostos.
- **ABC sem glúteo:** "Pernas e ombros" ganhou um exercício de glúteo (3 → 7 séries/semana).
- **Braço no dia de pernas:** as 2 séries diretas de bíceps/tríceps da hipertrofia não entram mais no dia de pernas.
- **Iniciante com objetivo força:** 6–10 reps nos compostos em vez de 4–6 (ACSM: 8–12 RM no começo).
- **Preferência "volume alto":** o teto de séries por músculo num treino sobe de 8 para 10 (a convenção vai de 6 a 10); antes, alto e padrão davam quase o mesmo plano. O passo que completa treino curto também respeita a preferência.
## 0.10.2 — 2026-10-20 · trocar exercício
- **⇄ Trocar não funcionava no celular:** o botão era um menu nativo (`<select>`) invisível por cima do ícone, e no app do Claude o menu não abria. Agora o botão abre uma lista própria do Kora (variações com sinônimos, "Ver todas" e Cancelar), que funciona igual em qualquer aparelho.
- A tela troca na hora e só depois salva; antes, ela esperava o salvamento terminar para mudar o exercício.

## 0.10.1 — 2026-10-20 · caça a bugs
Teste com 3.000 perfis aleatórios no motor + robô usando o app (4 perfis, claro e escuro, salvar, trocar, editar, recarregar).
- **Treino em casa com máquina (1.599 casos no teste):** quem marcava dor (joelho/ombro/lombar) e treinava em casa recebia leg press, cadeira extensora, belt squat… Agora as opções seguras para a dor respeitam o local.
- **Exercício repetido no mesmo dia (93 casos):** ex.: elevação pélvica 2× ou Copenhagen 2× (adutor + prevenção). Agora a escolha evita repetir no dia e a prevenção reaproveita o exercício do mesmo padrão.
- **Dia quase vazio nas divisões ABC/ABCDE (46 casos):** "Braços e abdômen" saía só com 1 exercício. Novo passo completa o treino quando sobra tempo, dentro do teto de volume.
- **Bíceps/tríceps sem exercício direto:** nas divisões PPL/ABC o braço ficava só com o trabalho indireto. Bíceps e tríceps agora têm metas separadas, e hipertrofia garante ao menos 2 séries diretas de cada na semana.
- **Divisão escolhida que não cabe nos dias:** aviso quando a divisão deixa peito, costas, pernas ou ombros sem treino.
- **Peso do corpo:** a ficha mandava "Suba 1 kg" em flexão/barra; agora sugere mais reps, carga extra ou variação mais difícil (elástico: elástico mais forte).
- **Prancha:** era contada como 10–15 "reps"; agora 20–40 segundos, com coluna "seg".
- **Semana no Início:** dias antes de você começar apareciam como "perdidos".
- **Datas em qualquer fuso horário:** cálculo de semana e dia sem passar por UTC.
- Novo teste automático com 400 perfis aleatórios para esses casos não voltarem.

## 0.10.0 — 2026-10-20
- **Dicas de execução para os 366 exercícios** (antes: 9). Escritas por família de movimento (agachamento, leg press, búlgaro, split squat, terra, stiff, supino, flexão, remada, puxada, rosca, tríceps, panturrilha, core, saltos…) com complementos por variação: unilateral, smith, cabo, elástico, máquina, pausa, amplitude reduzida, kettlebell. Gerador em `scripts/gerar-dicas.mjs`.
- **Base de evidências: 28 → 45 entradas**, todas conferidas no PubMed com DOI: velocidade da repetição, amplitude de movimento, musculação e mortalidade, passos por dia, depressão, ansiedade, pressão arterial, intervalado × contínuo, gordura corporal, déficit calórico, periodização, elástico × pesos, mulheres, densidade óssea, depois dos 50, creatina e treino com pouco tempo. "Cardio + musculação" atualizado (Schumann 2022: não atrapalha hipertrofia nem força máxima; pode reduzir a explosão).
- **Dúvidas**: novas perguntas sobre creatina, treino para mulheres, emagrecimento e treino curto.
- Teste novo: todo exercício tem dica e toda evidência citada pelo app existe.

## 0.9.5 — 2026-10-20 · revisão crítica da base
- **Falha muscular:** corrigido. Para hipertrofia, terminar mais perto da falha (0–2 reps sobrando) rende um pouco mais (Robinson 2024); para força, quase não importa. Hipertrofia passa a RPE 7,5–8,5 nos compostos e 8,5–9 nos acessórios (iniciante segue no máximo 8).
- **Frequência e volume:** atualizados com Pelland et al. (Sports Medicine, 2026): frequência quase não muda a hipertrofia mas aumenta a força; o volume tem retorno decrescente, mais acentuado na força; contagem fracionada confirmada.
- **Proteína:** 1,6 g/kg já dá quase todo o benefício; fonte da divisão em refeições adicionada (Schoenfeld & Aragon 2018).
- **Honestidade das fontes:** limite de séries por treino e "manter 4–8 semanas" marcados como convenção prática; Nordic na corrida, rotação externa fora do handebol e core no jiu-jitsu marcados como extrapolação.
- **Nova evidência:** prevenção de dor lombar (Steffens 2016, JAMA Intern Med) passa a sustentar a habilidade "Proteger as costas".
- **Anos das fontes corrigidos** pela publicação impressa: Lauersen 2014, Harøy 2019, Andersson 2017, Rønnestad & Mujika 2014; DOIs adicionados.
- **Exercícios:** removida "Remada alta com elástico" das puxadas verticais (trabalha trapézio e ombro, não dorsal).

## 0.9.4 — 2026-10-20
- Degradê de luz e sombra em cada músculo (mais claro em cima, mais escuro embaixo), além das fibras: o boneco ganha volume 3D, no nível dos apps de treino.

## 0.9.3 — 2026-10-20
- Boneco com mais volume (largura de braços, pernas, panturrilha, trapézio e dorsais), mantendo o ombro sem arredondar demais e as fibras.

## 0.9.2 — 2026-10-20
- Boneco menos "inflado" (ombro e braço menos arredondados) e com fibras musculares desenhadas em cada músculo, na direção anatômica (peitoral quase horizontal, deltoide e coxa verticais, oblíquo e trapézio na diagonal), espelhadas nos dois lados.

## 0.9.1 — 2026-10-20
- Boneco mais forte e volumoso: cada músculo é engrossado a partir do próprio centro (deltoides, braços, antebraço, trapézio, dorsais, peitoral, quadríceps, posteriores e panturrilha), pescoço mais grosso e cabeça um pouco menor.

## 0.9.0 — 2026-10-20
- Mapa muscular com contornos anatômicos detalhados (cabeça, mãos e pés; peitoral, deltoides, abdômen, oblíquos, serrátil, bíceps, tríceps, antebraço, trapézio, dorsais, lombar, glúteos, quadríceps, adutores, posteriores, tibial e panturrilha), no lugar do desenho geométrico. Contornos adaptados de react-native-body-highlighter (MIT).

## 0.8.2 — 2026-10-20
- Boneco com mais definição: sombreamento de volume, joelhos, banda iliotibial, tensor da fáscia lata, sartório, fibular, braço e antebraço mais cheios e mais linhas de separação muscular.

## 0.8.1 — 2026-10-20
- Boneco com físico de fisiculturista: ombros largos, cintura fina, deltoide em 2 cabeças, peitoral superior e inferior, serrátil, abdômen em 8 gomos, bíceps/braquial, tríceps em 2 cabeças, antebraço, trapézio superior e médio, infraespinal, redondo maior, dorsais, lombar, glúteo médio e máximo, quadríceps em 3 cabeças, posteriores em 2, panturrilha em 3 partes, e linhas de definição.
- Corrigido: o balão de informação do músculo sumia só ao tocar fora; agora some ao trocar de aba ou rolar a tela.

## 0.8.0 — 2026-10-20
- Nova tela **Início** (aba padrão): saudação, treino de hoje com botão "Começar treino" (ou dia de descanso com o próximo treino), semana em bolinhas (feito, hoje, perdido, planejado), treinos e volume da semana, sequência de semanas na meta, mapa muscular e atalhos para Desempenho, Meu plano, Cardio e Ajuda.
- Abas: Início, Treino, Progresso e Perfil (Ajuda pelo atalho do Início).
- Mapa muscular redesenhado com mais detalhe anatômico: silhueta contínua, trapézio, deltoides, peitoral, bíceps/tríceps, antebraço, abdômen em gomos, oblíquos, dorsais, lombar, glúteo médio e máximo, quadríceps (3 cabeças), adutores, posteriores (2), gastrocnêmio (2 cabeças), sóleo e tibial.

## 0.7.1 — 2026-10-20
- Desempenho aparece desde o 1º acesso: sem treinos salvos, o mapa muscular e o equilíbrio mostram o que o plano prevê; os gráficos de semana mostram a meta e se preenchem com os treinos.

## 0.7.0 — 2026-10-20
- Aba Progresso ganha a seção **Desempenho**:
  - **Carga muscular**: mapa do corpo (frente e costas, desenho próprio) com a intensidade de cada músculo nos últimos 7 dias em relação à meta de séries.
  - **Treinos por semana** (12 semanas) com a linha da meta do plano.
  - **Dias de treino**: calendário de 12 semanas × dias da semana.
  - **Volume semanal**: kg × repetições por semana.
  - **Equilíbrio muscular**: radar de séries por grupo (média de 4 semanas) × meta, com versão em tabela.
- **Treinos recentes**: cartão por sessão com mini-mapa muscular e a lista de exercícios.
- Toque (ou passe o mouse) em qualquer barra, dia ou músculo para ver o valor.

## 0.6.0 — 2026-10-19
- Novo nome: **Kora** (core + cor). Ícone "K" em oliva, slogan "Treino com ciência e coração."
- Tipografia Fraunces (títulos) + Inter (texto e números).

## 0.5.1 — 2026-10-19
- Cada divisão explica para quem é, vantagem, desvantagem e quantas vezes cada músculo treina com os SEUS dias.
- Tela "Seu plano" mostra por que a divisão foi escolhida, a regra do automático e permite comparar e trocar ("Usar esta").
- Teste garante que o automático varia com dias e experiência (3 dias → corpo inteiro; 4 → superior/inferior; 6 com experiência → PPL).

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
