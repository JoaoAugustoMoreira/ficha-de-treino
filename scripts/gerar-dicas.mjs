// Gera a dica de execução de cada exercício (campo "dica" em data/exercicios.json).
// Dicas escritas à mão por família de movimento + complementos por equipamento/variação.
// Exercícios com dica própria (curada) são mantidos. Uso: node scripts/gerar-dicas.mjs
import { readFileSync, writeFileSync } from "node:fs";
const P = new URL("../data/exercicios.json", import.meta.url);
const ex = JSON.parse(readFileSync(P, "utf8"));
const FIXAS = new Set(["Cadeira adutora","Barra fixa no graviton","Mergulho no graviton","Extensão lombar na máquina","Prancha de Copenhagen"]);

// família → dica (a primeira regra que casar com o nome vence; a ordem importa)
const F = [
  // potência
  [/salto na caixa/i, "Agache rápido e salte para cima da caixa, aterrissando macio com os joelhos alinhados aos pés. Desça andando, não pulando."],
  [/salto horizontal/i, "Balance os braços, salte o mais longe possível e aterrisse macio, com joelhos alinhados. Recomponha-se antes do próximo."],
  [/salto vertical|agachamento com salto/i, "Desça um pouco e salte o mais alto possível, com intenção máxima. Aterrisse macio, joelhos alinhados aos pés."],
  [/medicine ball/i, "Use o corpo todo (pernas, quadril e tronco) e solte a bola com toda a força. Pegue ou recolha a bola e reposicione-se antes da próxima."],
  [/swing/i, "O movimento é do quadril, não dos braços: empurre o quadril para trás e projete-o à frente com força, deixando o peso subir até a altura do peito."],
  // braços
  [/zottman/i, "Suba como numa rosca normal (palmas para cima), gire as palmas para baixo no topo e desça devagar assim. Trabalha bíceps e antebraço."],
  [/rosca inversa|rosca scott inversa/i, "Pegada por cima (palmas para baixo), cotovelos junto ao corpo; suba até a altura do peito e desça devagar. Trabalha antebraço e braquial."],
  [/rosca martelo/i, "Pegada neutra (palmas uma de frente para a outra), cotovelos colados ao corpo; suba sem balançar o tronco e desça devagar."],
  [/rosca scott|spider/i, "Braços apoiados no banco; suba até quase vertical e desça até quase estender os cotovelos, sem tirar os braços do apoio."],
  [/rosca concentrada/i, "Sentado, cotovelo apoiado na parte interna da coxa; suba o halter girando a palma para cima e desça até estender o braço."],
  [/rosca inclinada|banco inclinado/i, "Deitado no banco inclinado com os braços pendurados atrás do tronco; suba sem levar os cotovelos à frente e desça até estender. Alonga bem o bíceps."],
  [/arrastada|drag/i, "Suba a barra rente ao corpo levando os cotovelos para trás, como se arrastasse a barra no tronco; desça pelo mesmo caminho."],
  [/rosca/i, "Cotovelos colados ao corpo e tronco parado; suba o peso dobrando só os cotovelos e desça devagar até quase estender os braços."],
  [/tríceps testa/i, "Deitado, braços apontando para o teto; dobre só os cotovelos levando o peso em direção à testa e estenda de volta, sem abrir os cotovelos."],
  [/tríceps francês/i, "Peso acima da cabeça, cotovelos apontando para cima e perto da cabeça; desça o peso atrás da cabeça e estenda os braços de volta."],
  [/tríceps coice|coice com halter|coice no cabo$/i, "Tronco inclinado à frente, braço colado ao corpo com o cotovelo alto; estenda o cotovelo levando o peso para trás e volte devagar."],
  [/tríceps|barra v/i, "Cotovelos colados ao corpo e ombros parados; estenda os cotovelos até os braços ficarem retos e volte até cerca de 90°, sem deixar os cotovelos subirem."],
  // panturrilha
  [/tibial/i, "Calcanhares apoiados e peso sobre o peito dos pés; suba as pontas dos pés o máximo possível e desça devagar. Trabalha a frente da canela."],
  [/panturrilha sentado|panturrilha.*sentad/i, "Joelhos dobrados sob o apoio; desça os calcanhares até alongar bem e suba na ponta dos pés, segurando 1 s em cima. Sem quicar."],
  [/panturrilha/i, "Ponta dos pés na borda do apoio; desça os calcanhares até alongar bem, pausa de 1 s, e suba o mais alto possível. Joelhos estendidos e sem quicar."],
  // agachamentos e pernas
  [/leg press/i, "Costas e quadril apoiados no encosto; desça até onde o quadril não sair do banco e empurre com o pé inteiro, sem travar os joelhos no alto."],
  [/hack|pêndulo|pendulum|belt squat/i, "Costas firmes no apoio (ou tronco ereto no belt), pés na plataforma na largura dos ombros; desça controlado e suba empurrando o chão, joelhos na direção dos pés."],
  [/sissy/i, "Segure-se em um apoio, incline o corpo para trás e leve os joelhos à frente, descendo devagar. Exercício intenso para o quadríceps: comece só com o peso do corpo."],
  [/split squat/i, "Um pé à frente e outro atrás, os dois no chão e afastados; desça na vertical até o joelho de trás quase tocar o chão, tronco ereto, e suba com a perna da frente."],
  [/búlgaro/i, "Pé de trás apoiado no banco, pé da frente longe o bastante para o joelho não passar muito da ponta do pé. Desça na vertical até a coxa da frente ficar paralela ao chão."],
  [/afundo|passada/i, "Dê um passo amplo e desça até o joelho de trás quase tocar o chão, tronco ereto. Empurre com o pé da frente para voltar."],
  [/step-up/i, "Pé inteiro sobre o banco ou degrau; suba empurrando com a perna de cima, sem impulso da de baixo, e desça devagar."],
  [/frontal/i, "Barra (ou peso) apoiada na frente dos ombros, cotovelos altos e tronco bem ereto. Desça entre as pernas e suba sem deixar o peito cair."],
  [/goblet/i, "Segure o peso junto ao peito, cotovelos para dentro. Desça entre as pernas com o tronco ereto e suba empurrando o chão."],
  [/terra sumô/i, "Pés bem afastados e pegada entre as pernas; coluna neutra e peito aberto, empurre o chão e estenda o quadril ao mesmo tempo, com o peso rente ao corpo."],
  [/sumô/i, "Pés bem afastados e pontas viradas para fora; desça com o tronco ereto, joelhos na direção dos pés, e suba apertando o glúteo."],
  [/box|até o banco/i, "Desça controlado até encostar levemente no banco ou caixa, sem sentar e relaxar, e suba empurrando o chão."],
  [/agachamento/i, "Pés na largura dos ombros, pontas um pouco para fora. Desça com o tronco firme até onde mantém a coluna neutra, joelhos na direção dos pés, e suba empurrando o chão."],
  [/cadeira extensora/i, "Ajuste o encosto para o joelho ficar alinhado ao eixo da máquina. Estenda as pernas sem dar tranco, segure 1 s em cima e desça devagar."],
  // quadril e posterior
  [/nordic/i, "Ajoelhado, com os calcanhares presos, desça o tronco à frente o mais devagar possível, freando com o posterior. Apoie as mãos no chão e empurre para voltar."],
  [/glute ham/i, "Joelhos apoiados e pés presos; desça o tronco controlando com o posterior e suba puxando com os calcanhares."],
  [/flexora deslizando|toalha/i, "Deitado de costas, quadril elevado e pés sobre uma toalha num piso liso; puxe os calcanhares em direção ao glúteo sem baixar o quadril."],
  [/flexora/i, "Ajuste a máquina para o joelho ficar alinhado ao eixo. Dobre os joelhos trazendo o rolo até o glúteo, sem tirar o quadril do banco, e volte devagar."],
  [/ponte com pés elevados/i, "Deitado, calcanhares sobre o banco; empurre com os calcanhares e suba o quadril até alinhar com joelhos e ombros."],
  [/stiff|romeno/i, "Joelhos levemente dobrados e fixos; empurre o quadril para trás levando o peso rente às pernas, coluna neutra. Desça até sentir o posterior alongar e volte com o quadril."],
  [/terra/i, "Pés sob a barra, coluna neutra e peito aberto; empurre o chão com as pernas e estenda o quadril ao mesmo tempo, mantendo o peso rente ao corpo. Desça pelo mesmo caminho."],
  [/good morning/i, "Peso nas costas (ou elástico), joelhos levemente dobrados; incline o tronco à frente empurrando o quadril para trás, coluna neutra, até sentir o posterior. Volte com o quadril."],
  [/hiperextensão|extensão lombar/i, "Quadril apoiado na borda do aparelho; desça o tronco e suba até alinhar com as pernas, usando glúteo e posterior. Não passe da linha do corpo."],
  [/pull-through/i, "De costas para o cabo ou elástico, peso entre as pernas; empurre o quadril para trás e projete-o à frente apertando o glúteo, braços só seguram."],
  [/elevação pélvica|ponte/i, "Costas (ou ombros) apoiadas, pés firmes no chão; empurre com os calcanhares e suba o quadril até alinhar com joelhos e ombros, apertando o glúteo 1 s em cima. Queixo recolhido."],
  [/abdução/i, "Afaste as pernas para os lados de forma controlada, segure 1 s e volte devagar, sem deixar o peso bater."],
  [/coice|glúteo no cabo|glúteo na máquina|extensão de quadril/i, "Tronco firme e quadril parado; leve a perna para trás estendendo o quadril e apertando o glúteo, sem arquear a lombar."],
  [/adução|adutores/i, "Feche as pernas puxando com a parte interna da coxa, de forma controlada, e volte devagar sem tranco."],
  // peito e empurrar
  [/flexão pike/i, "Quadril alto, formando um V invertido; dobre os cotovelos levando a cabeça em direção ao chão entre as mãos e empurre de volta. Trabalha os ombros."],
  [/flexão fechada/i, "Mãos mais próximas que a largura dos ombros e cotovelos rentes ao corpo; corpo reto, desça até o peito quase tocar o chão e empurre. Foca no tríceps."],
  [/flexão/i, "Mãos um pouco além da largura dos ombros, corpo reto da cabeça aos pés e abdômen firme. Desça até o peito quase tocar o chão e empurre."],
  [/mergulho no banco/i, "Mãos no banco atrás do corpo, dedos para a frente; desça dobrando os cotovelos para trás até cerca de 90° e empurre. Pernas dobradas é mais fácil, estendidas mais difícil."],
  [/mergulho/i, "Ombros para baixo, longe das orelhas. Desça até os cotovelos formarem cerca de 90° e empurre; incline o tronco à frente para mais peito, mais reto para mais tríceps."],
  [/crucifixo inverso|peck deck inverso/i, "Abra os braços para os lados e para trás com os cotovelos levemente dobrados, juntando as escápulas no fim, sem subir os ombros. Volte devagar."],
  [/crucifixo|crossover|peck deck/i, "Cotovelos levemente dobrados e fixos; abra os braços até sentir o peito alongar e feche como num abraço, sem bater as mãos."],
  [/supino.*(fechad)|supino fechado/i, "Mãos na largura dos ombros e cotovelos rentes ao corpo; desça até perto do peito e empurre, focando no tríceps."],
  [/supino/i, "Escápulas juntas e para baixo, pés firmes e leve arco natural. Desça controlado até perto do peito, cotovelos a cerca de 45° do tronco, e empurre."],
  [/landmine press/i, "Segure a ponta da barra na altura do ombro e empurre para cima e à frente, abdômen firme, sem inclinar o tronco para trás."],
  [/arnold/i, "Comece com os halteres na frente do rosto e palmas para você; ao subir, gire as palmas para a frente. Desça invertendo o giro."],
  [/desenvolvimento/i, "Abdômen firme e glúteo contraído, sem arquear a lombar. Empurre o peso acima da cabeça até quase estender os cotovelos e desça até a altura do queixo."],
  // costas e puxar
  [/remada invertida/i, "Deitado sob a barra ou mesa, corpo reto; puxe o peito em direção à barra juntando as escápulas e desça devagar. Quanto mais horizontal o corpo, mais difícil."],
  [/remada renegada/i, "Posição de prancha com as mãos nos halteres; puxe um halter de cada vez até o quadril sem girar o tronco. Pés mais afastados dão mais equilíbrio."],
  [/remada alta para|remada para o rosto|face pull/i, "Puxe em direção ao rosto com os cotovelos altos, abrindo as mãos para os lados no final (rotação externa). Ombros longe das orelhas."],
  [/remada alta com pegada aberta|remada alta$/i, "Pegada aberta; puxe o peso rente ao corpo até a altura do peito, cotovelos guiando o movimento e sem passar da linha dos ombros."],
  [/remada/i, "Coluna neutra e peito aberto; puxe levando os cotovelos em direção ao quadril e junte as escápulas no fim. Volte alongando, sem perder a postura."],
  [/barra fixa negativa/i, "Suba com ajuda (pule ou use um banco) e desça o mais devagar possível, 3–5 s, até estender os braços. É o caminho para a primeira barra."],
  [/barra fixa|graviton/i, "Pendure-se com os ombros ativos (puxados para baixo); suba levando o peito em direção à barra, cotovelos para baixo, e desça até estender os braços."],
  [/pulldown braços estendidos/i, "Braços quase retos, incline levemente o tronco; puxe a barra ou corda em arco até as coxas usando a dorsal, sem dobrar os cotovelos."],
  [/pullover/i, "Deitado, halter acima do peito com os cotovelos levemente dobrados; leve o peso para trás da cabeça até sentir alongar e volte em arco."],
  [/puxada/i, "Peito para cima e leve inclinação para trás; puxe a barra até a parte de cima do peito levando os cotovelos para baixo e para trás. Volte até estender os braços."],
  // ombros
  [/rotação externa/i, "Cotovelo junto ao corpo e dobrado a 90°; gire o antebraço para fora devagar, sem mexer o tronco. Carga leve: é para o manguito rotador."],
  [/y-raise/i, "Peito apoiado num banco inclinado; eleve os braços em forma de Y com os polegares para cima, até a linha do corpo. Carga leve."],
  [/elevação lateral/i, "Suba os braços para os lados até a altura dos ombros, cotovelos levemente dobrados e mãos na linha dos cotovelos, sem balançar o tronco. Desça devagar."],
  // core
  [/pallof/i, "De lado para o cabo ou elástico, pegada no peito; estique os braços à frente e segure 2 s sem deixar o tronco girar. Quadril parado; faça os dois lados."],
  [/dead bug/i, "Deitado de costas, braços e joelhos para cima; estenda braço e perna opostos devagar mantendo a lombar colada no chão. Alterne os lados."],
  [/bird dog/i, "Em quatro apoios, estenda braço e perna opostos até a linha do corpo, sem girar o quadril; segure 1–2 s e alterne."],
  [/prancha/i, "Antebraços sob os ombros, corpo reto da cabeça aos calcanhares; contraia abdômen e glúteo e não deixe o quadril cair nem subir. Respire normalmente."],
  [/roda|rollout/i, "Abdômen firme e quadril encaixado; role à frente só até onde mantém a lombar sem arquear e volte puxando com o abdômen."],
  [/rotação russa no cabo/i, "Em pé, de lado para o cabo, braços estendidos à frente; gire o tronco para o lado oposto ao cabo com o abdômen firme e volte devagar. Faça os dois lados."],
  [/rotação russa/i, "Sentado com o tronco inclinado para trás e coluna reta, gire o tronco de um lado para o outro levando o peso, sem só mexer os braços."],
  [/elevação de (pernas|joelhos)|canivete|grupado/i, "Suba as pernas (ou joelhos) enrolando a pelve em direção ao peito, sem balançar o corpo, e desça devagar sem relaxar o abdômen."],
  [/abdominal reverso/i, "Deitado, joelhos dobrados; tire o quadril do chão enrolando a pelve em direção ao peito e desça devagar, sem impulso das pernas."],
  [/abdominal (oblíquo|cruzado)/i, "Enrole o tronco levando o ombro em direção ao joelho oposto, sem puxar o pescoço com as mãos; desça devagar."],
  [/abdominal/i, "Enrole o tronco aproximando as costelas do quadril, sem puxar o pescoço; solte o ar ao subir e desça devagar sem relaxar o abdômen."],
];
// complementos por variação/equipamento (podem somar vários)
const M = [
  [/unilateral|alternad|um lado/i, "Faça um lado de cada vez: comece pelo mais fraco e repita as mesmas repetições no outro."],
  [/smith/i, "No smith a barra corre num trilho: ajuste a posição dos pés para o movimento ficar natural."],
  [/elástico/i, "Prenda bem o elástico; a resistência aumenta no fim do movimento, então controle a volta."],
  [/pausa/i, "Segure 1–2 s na posição mais difícil, sem relaxar."],
  [/amplitude parcial|amplitude confortável|carga leve/i, "Use só a amplitude sem dor e aumente aos poucos."],
  [/kettlebell/i, "Segure o kettlebell firme, com o punho reto."],
  [/no cabo|crossover|corda/i, "O cabo mantém tensão o tempo todo: não deixe o peso descansar na pilha entre as repetições."],
  [/máquina|articulad/i, "Ajuste o banco para a articulação que trabalha ficar alinhada ao eixo da máquina."],
];
let n = 0, sem = [];
for (const e of ex) {
  if (FIXAS.has(e.nome) && e.dica) continue;
  const f = F.find(([r]) => r.test(e.nome));
  if (!f) { sem.push(e.padrao + ": " + e.nome); continue; }
  const extras = M.filter(([r]) => r.test(e.nome)).map(([, t]) => t).filter(t => !f[1].includes(t));
  e.dica = [f[1], ...extras.slice(0, 2)].join(" ");
  n++;
}
writeFileSync(P, JSON.stringify(ex, null, 2) + "\n");
console.log(`dicas: ${n} geradas · ${ex.filter(e => e.dica).length}/${ex.length} com dica`);
if (sem.length) console.log("sem família:", sem.join(" | "));
