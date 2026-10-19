import type { MilestoneCategory } from "./milestones";

/**
 * Atividades de estimulação por idade.
 *
 * Curadoria enxuta e prática: coisas que se faz com o que já existe em casa,
 * em minutos, ligadas às categorias de desenvolvimento. O objetivo não é
 * "acelerar" a criança — é dar aos pais ideias de como estar presente com
 * intenção. Brincar é o trabalho da infância.
 */

export interface Activity {
  id: string;
  title: string;
  how: string;
  category: MilestoneCategory;
  /** Minutos sugeridos — atenção de bebê é curta. */
  minutes: number;
}

export interface ActivityBand {
  fromMonths: number;
  toMonths: number;
  label: string;
  activities: Activity[];
}

const a = (id: string, title: string, how: string, category: MilestoneCategory, minutes = 5): Activity => ({
  id,
  title,
  how,
  category,
  minutes,
});

export const ACTIVITY_BANDS: ActivityBand[] = [
  {
    fromMonths: 0,
    toMonths: 2,
    label: "0–2 meses",
    activities: [
      a("0-2-cara", "Cara a cara a 20–30 cm", "Segure o rosto na distância em que o recém-nascido enxerga bem e converse devagar, exagerando expressões. Ela vai fixar e imitar boca.", "social"),
      a("0-2-contraste", "Cartões de contraste", "Mostre cartões preto-e-branco ou de alto contraste, movendo lentamente de um lado ao outro para ela seguir com os olhos.", "cognitivo"),
      a("0-2-tummy", "Bruços com apoio no seu peito", "Tempo de bruços curto e frequente, com apoio no seu peito inclinado. Fortalece pescoço sem estresse.", "motor"),
      a("0-2-massagem", "Massagem com nomeação", "Durante a troca ou o banho, nomeie cada parte que toca: “agora o pezinho!”. Toca e voz constroem mapa corporal.", "fino"),
      a("0-2-canto", "Canto baixo e ritmado", "Cante sempre a mesma musiquinha curta antes de cada soneca. Repetição vira sinal de segurança.", "linguagem"),
    ],
  },
  {
    fromMonths: 2,
    toMonths: 4,
    label: "2–4 meses",
    activities: [
      a("2-4-espelho", "Espelho deitado", "De bruços, coloque um espelho inquebrável na frente. Ela vai “conversar” com o reflexo — trabalho sério de reconhecimento.", "social"),
      a("2-4-bicicleta", "Bicicleta das perninhas", "Com ela de barriga para cima, mova as pernas em bicicleta cantando. Ajuda gases e coordenação.", "motor"),
      a("2-4-texturas", "Passeio de texturas", "Passe na mãozinha algodão, seda, toalha. Nomeie: “macio”, “áspero”. Sensação virando vocabulário.", "fino"),
      a("2-4-conversa", "Diálogo de turnos", "Quando ela arrulhar, responda e ESPERE. Ela vai responder de novo — é assim que nasce o turno de conversa.", "linguagem"),
      a("2-4-chocalho", "Chocalho lateral", "Toque um chocalho fora do campo de visão e veja-a virar a cabeça para achar. Som com origem é descoberta.", "cognitivo"),
    ],
  },
  {
    fromMonths: 4,
    toMonths: 6,
    label: "4–6 meses",
    activities: [
      a("4-6-alcance", "Tesouro alcançável", "Pendure um brinquedo leve logo acima do peito, na posição de bruços, para ela esticar e pegar. Esforço com recompensa.", "motor"),
      a("4-6-transferencia", "Passa-passa", "Ofereça um objeto em cada mão e depois um terceiro no meio: o desafio de transferir e soltar aparece agora.", "fino"),
      a("4-6-esconde", "Cadê? Achou! (versão 1)", "Cubra seu rosto com a fralda e revele com “achou!”. Permanência do objeto começa a se construir.", "cognitivo"),
      a("4-6-leitura", "Livro de pano apontado", "Leia apontando figuras e nomeando. Não a história: as figuras. Apontar e nomear é alfabetização visual.", "linguagem"),
      a("4-6-rolar", "Trilha do rolar", "Coloque um brinquedo favorito logo ao lado, fora do alcance, incentivando rolar até ele. Celebre a chegada.", "motor"),
    ],
  },
  {
    fromMonths: 6,
    toMonths: 9,
    label: "6–9 meses",
    activities: [
      a("6-9-tunel", "Túnel de pernas", "Sente com pernas abertas e faça dela um túnel para ela engatinhar, com você chamando do outro lado.", "motor"),
      a("6-9-caixa", "Caixa que some", "Esconda um brinquedo sob um pano NA FRENTE dela e incentive a achar. Objetos que somem e voltam fascinam.", "cognitivo"),
      a("6-9-pinca", "Petiscos de pinça", "Sob supervisão, pedaços macios de comida para pegar com polegar-indicador. Motricidade fina com almoço junto.", "fino"),
      a("6-9-tchau", "Gestos sociais", "Ensine tchau, palma, manda-beijo com uso real toda vez que alguém sai. Gesto antes da palavra.", "linguagem"),
      a("6-9-ritmo", "Bateria de panelas", "Colher e panela viram tambor. Causa e efeito com som — e noção de que ela produz mudança no mundo.", "cognitivo"),
    ],
  },
  {
    fromMonths: 9,
    toMonths: 12,
    label: "9–12 meses",
    activities: [
      a("9-12-obstaculos", "Circuito de almofadas", "Almofadas e travesseiros viram montanhas para engatinhar/escalar com você do lado. Equilíbrio e planejamento motor.", "motor"),
      a("9-12-dentro-fora", "Enche e esvazia", "Um pote e blocos: encher, virar, tirar. Dentro/fora é matemática primitiva.", "cognitivo"),
      a("9-12-apontar", "Apontar e nomear", "Siga o dedo dela, nomeie o que ela aponta e devolva a pergunta: “o que é aquilo?”. Apontar compartilhado é linguagem pura.", "linguagem"),
      a("9-12-empilhar", "Torre de 2", "Mostre empilhar dois blocos e deixe derrubar (a derrubada é metade da brincadeira).", "fino"),
      a("9-12-comida", "Comer sozinha com as mãos", "Deixe a papinha virar exploração tátil. Sujeira é dado sensorial, não bagunça.", "autocuidado"),
    ],
  },
  {
    fromMonths: 12,
    toMonths: 18,
    label: "1–1,5 ano",
    activities: [
      a("12-18-empurrar", "Carrinho de empurrar", "Empurrar objeto estável (caixa, carrinho) andando dá confiança para os primeiros passos longos.", "motor"),
      a("12-18-rabisco", "Primeiros rabiscos", "Giz de cera grosso e papel no chão. O traço que aparece é causa-efeito visual.", "fino"),
      a("12-18-nomear", "Caça ao nome", "“Cadê o sapato? Cadê a bola?” — pedir para trazer objetos nomeados expande vocabulário passivo em ativo.", "linguagem"),
      a("12-18-imitar", "Imitação doméstica", "Um paninho para “limpar” junto, uma colher para “mexer” junto. Imitar é currículo dessa idade.", "social"),
      a("12-18-bola", "Bola que volta", "Rolar a bola sentados, um para o outro. Turno, mira e a alegria do retorno.", "motor"),
    ],
  },
  {
    fromMonths: 18,
    toMonths: 24,
    label: "1,5–2 anos",
    activities: [
      a("18-24-chutar", "Gol na sala", "Bola parada para chutar correndo, depois bola em movimento leve. Coordenação olho-pé.", "motor"),
      a("18-24-torre6", "Torre de 4–6 blocos", "Desafio de empilhar alto sem derrubar — e aprender a recomeçar quando derruba.", "fino"),
      a("18-24-duaspalavras", "Expandir frases", "Quando ela disser “bola!”, devolva “bola GRANDE!” ou “quero a bola”. Sempre uma palavra a mais.", "linguagem"),
      a("18-24-fazconta", "Comida de mentira", "Panelinha, colher, boneca que come e dorme. Faz-de-conta é ensaio de mundo.", "social"),
      a("18-24-classificar", "Meias combinando", "Junte meias por cor junto com ela. Classificar com propósito real.", "cognitivo"),
    ],
  },
  {
    fromMonths: 24,
    toMonths: 36,
    label: "2–3 anos",
    activities: [
      a("24-36-pular", "Pula-poça", "Poças (ou círculos de giz) para pular com os dois pés. Impulso e aterrissagem.", "motor"),
      a("24-36-tesoura", "Massinha e ferramentas", "Massinha com rolo, corte de plástico, bolinhas. Força de mão para futura tesoura e lápis.", "fino"),
      a("24-36-historia", "História com pergunta", "Leia e pergunte “o que aconteceu?”, “cadê o gato?”. Narrar reconstrói memória e linguagem.", "linguagem"),
      a("24-36-contar", "Contar de verdade", "Conte objetos reais (3 uvas, 2 sapatos) apontando um a um. Número com referente.", "cognitivo"),
      a("24-36-vestir", "Vestir com ajuda", "Deixe tentar: tirar é mais fácil que pôr. Comece por meia e sapato.", "autocuidado"),
    ],
  },
  {
    fromMonths: 36,
    toMonths: 48,
    label: "3–4 anos",
    activities: [
      a("36-48-equilibrio", "Corda no chão", "Uma corda esticada vira trilha de equilíbrio; depois pular num pé só em cada marca.", "motor"),
      a("36-48-tesourinha", "Tesoura sem ponta", "Tiras largas de papel para cortar. Supervisão sempre; autonomia no gesto.", "fino"),
      a("36-48-porques", "Responder os porquês", "A fase dos “por quê?” é ouro: responda e devolva “o que VOCÊ acha?”. Ciência em miniatura.", "cognitivo"),
      a("36-48-amigos", "Encontro curto de brincar", "Brincadeiras curtas e combinadas (1h) com uma criança só. Dividir ainda é aprendizado.", "social"),
      a("36-48-desenho", "Desenho com história", "Peça para contar o que desenhou e escreva o relato dela atrás. Escrita nasce assim.", "linguagem"),
    ],
  },
  {
    fromMonths: 48,
    toMonths: 72,
    label: "4–6 anos",
    activities: [
      a("48-72-bike", "Bicicleta e circuitos", "Bicicleta com rodinhas, circuitos de cones, amarelinha. Coordenação e regra juntas.", "motor"),
      a("48-72-letras", "Nome próprio em jogo", "Letras do nome em massa, areia, ímãs. O próprio nome é a primeira palavra que importa.", "linguagem"),
      a("48-72-jogos", "Jogos de regra simples", "Memória, dominó, trilha: esperar a vez e lidar com perder, com mediação.", "social"),
      a("48-72-cozinha", "Cozinha de verdade", "Medir ingredientes (matemática), mexer, montar. Competência real gera confiança real.", "autocuidado"),
      a("48-72-natureza", "Caça ao detalhe na praça", "Lista curta: achar 3 folhas diferentes, 2 pedras, 1 inseto. Observação científica.", "cognitivo"),
    ],
  },
];

export function activitiesFor(ageMonths: number): ActivityBand {
  return (
    ACTIVITY_BANDS.find((b) => ageMonths >= b.fromMonths && ageMonths < b.toMonths) ??
    ACTIVITY_BANDS[ACTIVITY_BANDS.length - 1]
  );
}
