/**
 * Marcos do desenvolvimento infantil.
 *
 * Compilado a partir de referências públicas:
 *  • CDC — "Learn the Signs. Act Early." (revisão 2022)
 *  • OMS — Windows of Achievement for motor milestones
 *  • Caderneta da Criança — Ministério da Saúde (Brasil)
 *
 * IMPORTANTE: marcos têm janela, não data. Cada criança tem seu ritmo; esta
 * lista serve para acompanhar e para saber quando conversar com o pediatra —
 * nunca para diagnosticar. Os "sinais de alerta" são os itens que justificam
 * procurar avaliação profissional.
 */

export type MilestoneCategory =
  | "motor"
  | "fino"
  | "linguagem"
  | "social"
  | "cognitivo"
  | "autocuidado";

export const CATEGORY_LABEL: Record<MilestoneCategory, string> = {
  motor: "Motor grosso",
  fino: "Motor fino",
  linguagem: "Comunicação",
  social: "Social e emocional",
  cognitivo: "Cognitivo",
  autocuidado: "Autonomia",
};

export const CATEGORY_ICON: Record<MilestoneCategory, string> = {
  motor: "footprints",
  fino: "hand",
  linguagem: "message-circle",
  social: "heart",
  cognitivo: "brain",
  autocuidado: "sparkles",
};

export interface Milestone {
  key: string;
  /** Idade de referência em meses. */
  ageMonths: number;
  category: MilestoneCategory;
  text: string;
  /** Sugestão curta de como estimular — aparece ao lado do marco. */
  tip?: string;
}

export interface AgeCheckpoint {
  ageMonths: number;
  label: string;
  milestones: Milestone[];
  /** Sinais que justificam conversar com o pediatra. */
  redFlags: string[];
}

const m = (
  ageMonths: number,
  category: MilestoneCategory,
  text: string,
  tip?: string,
): Milestone => ({
  key: `${ageMonths}m-${category}-${slug(text)}`,
  ageMonths,
  category,
  text,
  tip,
});

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
}

// ── 2 meses ─────────────────────────────────────────────────────
const M2: Milestone[] = [
  m(2, "motor", "Sustenta a cabeça ao ficar de bruços", "Tempo de bruços supervisionado, várias vezes ao dia."),
  m(2, "motor", "Faz movimentos mais suaves com braços e pernas"),
  m(2, "fino", "Abre e fecha as mãos"),
  m(2, "fino", "Segura um objeto por alguns segundos"),
  m(2, "linguagem", "Emite sons de arrulho e gorgolejo", "Responda aos sons dela — é assim que começa a conversa."),
  m(2, "linguagem", "Chora de formas diferentes para pedidos diferentes"),
  m(2, "social", "Sorri para as pessoas", "Sorria de volta e olhe nos olhos."),
  m(2, "social", "Tenta olhar para os pais"),
  m(2, "cognitivo", "Acompanha objetos com os olhos de perto"),
  m(2, "cognitivo", "Reconhece pessoas à distância"),
  m(2, "cognitivo", "Fica entediada sozinha e reclama"),
];

// ── 4 meses ─────────────────────────────────────────────────────
const M4: Milestone[] = [
  m(4, "motor", "Sustenta a cabeça firme sem apoio"),
  m(4, "motor", "Rola do bruços para as costas"),
  m(4, "motor", "Apoia-se nos cotovelos quando de bruços"),
  m(4, "fino", "Leva as mãos à boca"),
  m(4, "fino", "Pega objetos com uma mão"),
  m(4, "fino", "Junta as duas mãos"),
  m(4, "linguagem", "Balbucia e copia sons que ouve", "Repita o que ela fizer — vira um jogo de imitação."),
  m(4, "linguagem", "Chama atenção com gritos"),
  m(4, "social", "Sorri espontaneamente, principalmente para pessoas"),
  m(4, "social", "Gosta de brincar e chora quando a brincadeira acaba"),
  m(4, "cognitivo", "Acompanha objetos em movimento de um lado ao outro"),
  m(4, "cognitivo", "Demonstra interesse por objetos novos"),
];

// ── 6 meses ─────────────────────────────────────────────────────
const M6: Milestone[] = [
  m(6, "motor", "Senta sem apoio por alguns instantes"),
  m(6, "motor", "Rola nos dois sentidos"),
  m(6, "motor", "Apoia o peso nas pernas ao ficar em pé com ajuda"),
  m(6, "fino", "Passa objetos de uma mão para a outra"),
  m(6, "fino", "Pega objetos pequenos com o movimento de pinça em desenvolvimento"),
  m(6, "linguagem", "Responde ao próprio nome"),
  m(6, "linguagem", "Junta consoantes e vogais: “ma”, “ba”, “da”"),
  m(6, "linguagem", "Usa a voz para demonstrar alegria e desagrado"),
  m(6, "social", "Reconhece rostos familiares"),
  m(6, "social", "Começa a estranhar pessoas desconhecidas"),
  m(6, "social", "Gosta de se olhar no espelho"),
  m(6, "cognitivo", "Procura um objeto que caiu fora da vista"),
  m(6, "cognitivo", "Leva tudo à boca para explorar"),
];

// ── 9 meses ─────────────────────────────────────────────────────
const M9: Milestone[] = [
  m(9, "motor", "Senta sem apoio e por mais tempo"),
  m(9, "motor", "Engatinha"),
  m(9, "motor", "Fica em pé segurando em algo"),
  m(9, "motor", "Passa da posição sentada para a de bruços"),
  m(9, "fino", "Faz pinça com polegar e indicador"),
  m(9, "fino", "Bate um objeto no outro"),
  m(9, "linguagem", "Entende o “não”"),
  m(9, "linguagem", "Imita sons e gestos dos outros"),
  m(9, "linguagem", "Aponta para mostrar o que quer"),
  m(9, "social", "Pode ficar insegura com estranhos"),
  m(9, "social", "Tem objetos de apego (ursinho, fraldinha)"),
  m(9, "social", "Brinca de esconde-esconde e cobre o rosto"),
  m(9, "cognitivo", "Acompanha a trajetória de um objeto que cai"),
  m(9, "cognitivo", "Procura objetos escondidos enquanto vê você esconder"),
];

// ── 12 meses ────────────────────────────────────────────────────
const M12: Milestone[] = [
  m(12, "motor", "Anda segurando nos móveis"),
  m(12, "motor", "Pode dar os primeiros passos sozinha"),
  m(12, "motor", "Fica em pé sem apoio por instantes"),
  m(12, "fino", "Coloca objetos dentro de um recipiente"),
  m(12, "fino", "Solta objetos voluntariamente"),
  m(12, "fino", "Usa o polegar e o indicador com precisão"),
  m(12, "linguagem", "Fala “mamá” e “papá” com intenção"),
  m(12, "linguagem", "Tenta repetir palavras que ouve"),
  m(12, "linguagem", "Faz gestos simples: tchau, dar tchauzinho"),
  m(12, "social", "Estende o braço ou a perna para ajudar a se vestir"),
  m(12, "social", "Brinca de dar comida a um boneco"),
  m(12, "social", "Mostra preferência por pessoas e brinquedos"),
  m(12, "cognitivo", "Responde a pedidos simples com gestos"),
  m(12, "cognitivo", "Usa objetos do jeito certo: colher, copo, escova"),
  m(12, "autocuidado", "Come pedaços de alimento com as mãos"),
  m(12, "autocuidado", "Bebe no copo com ajuda"),
];

// ── 15 meses ────────────────────────────────────────────────────
const M15: Milestone[] = [
  m(15, "motor", "Anda sozinha"),
  m(15, "motor", "Sobe em móveis baixos"),
  m(15, "motor", "Engatinha ou sobe escadas com ajuda"),
  m(15, "fino", "Faz rabiscos espontâneos"),
  m(15, "fino", "Constrói torre com 2 blocos"),
  m(15, "linguagem", "Diz de 3 a 5 palavras além de mamã/papá"),
  m(15, "linguagem", "Aponta para pedir algo"),
  m(15, "social", "Mostra afeto por pessoas conhecidas"),
  m(15, "social", "Pode ter birras quando frustrada"),
  m(15, "social", "Fica grudada em adultos em situações novas"),
  m(15, "cognitivo", "Segue comandos simples com gesto"),
  m(15, "cognitivo", "Imita tarefas domésticas"),
  m(15, "autocuidado", "Tenta usar a colher"),
];

// ── 18 meses ────────────────────────────────────────────────────
const M18: Milestone[] = [
  m(18, "motor", "Anda com firmeza e corre desajeitada"),
  m(18, "motor", "Sobe escadas segurando na mão de alguém"),
  m(18, "motor", "Chuta uma bola"),
  m(18, "fino", "Faz torre com 3 ou 4 blocos"),
  m(18, "fino", "Rabisca com giz de cera"),
  m(18, "fino", "Vira páginas de um livro"),
  m(18, "linguagem", "Fala de 6 a 20 palavras"),
  m(18, "linguagem", "Aponta para mostrar algo interessante"),
  m(18, "linguagem", "Balança a cabeça para “não”"),
  m(18, "social", "Brinca perto de outras crianças (jogo paralelo)"),
  m(18, "social", "Procura o cuidador quando assustada"),
  m(18, "cognitivo", "Sabe para que servem objetos comuns"),
  m(18, "cognitivo", "Reconhece partes do corpo"),
  m(18, "autocuidado", "Bebe no copo sem tampa"),
  m(18, "autocuidado", "Come com colher, derramando um pouco"),
  m(18, "autocuidado", "Tira peças de roupa sozinha"),
];

// ── 24 meses (2 anos) ───────────────────────────────────────────
const M24: Milestone[] = [
  m(24, "motor", "Corre bem e para sem cair"),
  m(24, "motor", "Sobe e desce escadas alternando ou com apoio"),
  m(24, "motor", "Anda na ponta dos pés"),
  m(24, "motor", "Joga bola por cima da cabeça"),
  m(24, "fino", "Faz torre com 6 blocos"),
  m(24, "fino", "Copia uma linha vertical"),
  m(24, "linguagem", "Junta duas palavras: “quero água”, “mamãe vem”"),
  m(24, "linguagem", "Fala pelo menos 50 palavras"),
  m(24, "linguagem", "Aponta para figuras quando nomeadas"),
  m(24, "social", "Copia o comportamento dos adultos"),
  m(24, "social", "Fica animada com outras crianças"),
  m(24, "social", "Mostra mais independência"),
  m(24, "cognitivo", "Encontra objetos escondidos sob dois ou três panos"),
  m(24, "cognitivo", "Classifica formas e cores"),
  m(24, "cognitivo", "Faz brincadeiras de faz-de-conta simples"),
  m(24, "autocuidado", "Ajuda a se despir"),
  m(24, "autocuidado", "Escova os dentes com ajuda"),
];

// ── 30 meses ────────────────────────────────────────────────────
const M30: Milestone[] = [
  m(30, "motor", "Pula com os dois pés"),
  m(30, "motor", "Anda de triciclo ou empurra brinquedo de pedalar"),
  m(30, "fino", "Faz torre com 8 blocos"),
  m(30, "fino", "Copia um círculo"),
  m(30, "linguagem", "Fala frases de 3 palavras"),
  m(30, "linguagem", "Usa pronomes: eu, você, mim"),
  m(30, "social", "Começa a dividir brinquedos com ajuda"),
  m(30, "social", "Demonstra uma ampla gama de emoções"),
  m(30, "cognitivo", "Monta quebra-cabeças de 3 a 4 peças"),
  m(30, "cognitivo", "Entende “em cima”, “embaixo”, “dentro”"),
  m(30, "autocuidado", "Avisa que fez xixi ou cocô"),
  m(30, "autocuidado", "Lava e seca as mãos com ajuda"),
];

// ── 36 meses (3 anos) ───────────────────────────────────────────
const M36: Milestone[] = [
  m(36, "motor", "Sobe bem e corre com segurança"),
  m(36, "motor", "Anda em linha reta"),
  m(36, "motor", "Pula num pé só por um instante"),
  m(36, "fino", "Vira páginas uma de cada vez"),
  m(36, "fino", "Segura o lápis com os dedos, não com o punho"),
  m(36, "fino", "Desenha uma pessoa com 2 a 4 partes"),
  m(36, "linguagem", "Conversa com 2 a 3 frases"),
  m(36, "linguagem", "Faz perguntas com “o que”, “onde”, “por que”"),
  m(36, "linguagem", "Estranhos entendem quase tudo o que ela diz"),
  m(36, "social", "Brinca com outras crianças e faz amigos"),
  m(36, "social", "Mostra preocupação com um amigo que chora"),
  m(36, "social", "Separa-se dos pais com mais facilidade"),
  m(36, "cognitivo", "Resolve quebra-cabeças de 5 peças"),
  m(36, "cognitivo", "Nomeia cores comuns"),
  m(36, "cognitivo", "Conta até 4 ou 5 objetos"),
  m(36, "autocuidado", "Usa o vaso sanitário com pouca ajuda"),
  m(36, "autocuidado", "Veste camiseta com ajuda"),
  m(36, "autocuidado", "Come sozinha com garfo e colher"),
];

// ── 48 meses (4 anos) ───────────────────────────────────────────
const M48: Milestone[] = [
  m(48, "motor", "Salta num pé só várias vezes"),
  m(48, "motor", "Pega uma bola lançada com as mãos"),
  m(48, "motor", "Desce escadas alternando os pés"),
  m(48, "fino", "Copia um quadrado e uma cruz"),
  m(48, "fino", "Usa tesoura sem ponta"),
  m(48, "linguagem", "Conta uma história simples"),
  m(48, "linguagem", "Usa o futuro: “vou brincar”"),
  m(48, "linguagem", "Fala frases de 4 a 5 palavras"),
  m(48, "social", "Prefere brincar com outras crianças a brincar sozinha"),
  m(48, "social", "Negocia e faz combinados"),
  m(48, "social", "Canta, dança e faz teatro em casa"),
  m(48, "cognitivo", "Conta até 10"),
  m(48, "cognitivo", "Nomeia 4 cores"),
  m(48, "cognitivo", "Entende a ideia de “igual” e “diferente”"),
  m(48, "autocuidado", "Veste-se sozinha com pouca ajuda"),
  m(48, "autocuidado", "Escova os dentes sozinha (com supervisão)"),
];

// ── 60 meses (5 anos) ───────────────────────────────────────────
const M60: Milestone[] = [
  m(60, "motor", "Anda de bicicleta com rodinhas"),
  m(60, "motor", "Equilibra-se num pé só por 10 segundos"),
  m(60, "motor", "Faz cambalhota com ajuda"),
  m(60, "fino", "Desenha uma pessoa com 6 partes"),
  m(60, "fino", "Escreve algumas letras e o próprio nome"),
  m(60, "fino", "Copia um triângulo"),
  m(60, "linguagem", "Fala frases completas e complexas"),
  m(60, "linguagem", "Conta histórias com começo, meio e fim"),
  m(60, "linguagem", "Reconhece algumas letras e rimas"),
  m(60, "social", "Quer agradar os amigos"),
  m(60, "social", "Segue regras em jogos com turnos"),
  m(60, "social", "Distingue fantasia de realidade"),
  m(60, "cognitivo", "Conta 10 ou mais objetos"),
  m(60, "cognitivo", "Entende noção de tempo: ontem, hoje, amanhã"),
  m(60, "cognitivo", "Reconhece números de 1 a 10"),
  m(60, "autocuidado", "Usa o banheiro sozinha"),
  m(60, "autocuidado", "Toma banho com pouca ajuda"),
];

export const CHECKPOINTS: AgeCheckpoint[] = [
  {
    ageMonths: 2,
    label: "2 meses",
    milestones: M2,
    redFlags: [
      "Não sorri para as pessoas",
      "Não acompanha objetos em movimento com os olhos",
      "Não reage a sons altos",
      "Não sustenta a cabeça ao ficar de bruços",
      "Não leva as mãos à boca",
    ],
  },
  {
    ageMonths: 4,
    label: "4 meses",
    milestones: M4,
    redFlags: [
      "Não sorri nem interage",
      "Não sustenta a cabeça firme",
      "Não balbucia nem imita sons",
      "Não leva objetos à boca",
      "Empurra com os pés quando apoiada, mas sem força nas pernas",
    ],
  },
  {
    ageMonths: 6,
    label: "6 meses",
    milestones: M6,
    redFlags: [
      "Não tenta pegar objetos ao alcance",
      "Não demonstra afeto pelos cuidadores",
      "Não responde a sons do ambiente",
      "Não leva objetos à boca",
      "Não emite sons de vogais",
      "Não rola para nenhum lado",
      "Parece muito rígida ou muito mole",
    ],
  },
  {
    ageMonths: 9,
    label: "9 meses",
    milestones: M9,
    redFlags: [
      "Não sustenta o peso do corpo nas pernas com ajuda",
      "Não senta com ajuda",
      "Não balbucia “mamá”, “tata”, “dadá”",
      "Não brinca de esconde-esconde",
      "Não responde ao próprio nome",
      "Não reconhece pessoas familiares",
      "Não transfere brinquedos de uma mão para a outra",
    ],
  },
  {
    ageMonths: 12,
    label: "1 ano",
    milestones: M12,
    redFlags: [
      "Não engatinha nem se arrasta",
      "Não se segura para ficar em pé",
      "Não procura objetos que viu você esconder",
      "Não diz palavras simples como “mamá” ou “papá”",
      "Não faz gestos como acenar ou balançar a cabeça",
      "Perde habilidades que já tinha",
    ],
  },
  {
    ageMonths: 15,
    label: "15 meses",
    milestones: M15,
    redFlags: [
      "Não anda",
      "Não aponta para objetos",
      "Não fala nenhuma palavra",
      "Não percebe ou não se importa com a ausência dos cuidadores",
      "Não segue comandos simples com gesto",
    ],
  },
  {
    ageMonths: 18,
    label: "18 meses",
    milestones: M18,
    redFlags: [
      "Não anda",
      "Não fala pelo menos 6 palavras",
      "Não aponta para mostrar algo",
      "Não copia outras pessoas",
      "Perde habilidades que já tinha",
    ],
  },
  {
    ageMonths: 24,
    label: "2 anos",
    milestones: M24,
    redFlags: [
      "Não fala frases de 2 palavras",
      "Não sabe o que fazer com objetos comuns (colher, escova)",
      "Não copia ações nem palavras",
      "Não segue instruções simples",
      "Anda de forma muito instável",
      "Perde habilidades que já tinha",
    ],
  },
  {
    ageMonths: 36,
    label: "3 anos",
    milestones: M36,
    redFlags: [
      "Cai muito ou tem dificuldade com escadas",
      "Baba ou fala de forma muito difícil de entender",
      "Não constrói torre com mais de 4 blocos",
      "Não faz frases de 3 palavras",
      "Não brinca de faz-de-conta",
      "Evita outras crianças",
      "Perde habilidades que já tinha",
    ],
  },
  {
    ageMonths: 48,
    label: "4 anos",
    milestones: M48,
    redFlags: [
      "Não consegue pular no mesmo lugar",
      "Não copia desenhos simples",
      "Não faz perguntas",
      "Não demonstra interesse em jogos interativos",
      "Ignora outras crianças ou não responde a pessoas de fora da família",
      "Perde habilidades que já tinha",
    ],
  },
  {
    ageMonths: 60,
    label: "5 anos",
    milestones: M60,
    redFlags: [
      "Não mostra uma ampla gama de emoções",
      "Não consegue se concentrar em uma atividade por 5 minutos",
      "Não responde a pessoas ou responde superficialmente",
      "Não conta histórias, não desenha, não escreve letras",
      "Perde habilidades que já tinha",
    ],
  },
];

/** Todos os marcos, achatados — usado para busca e contagens. */
export const ALL_MILESTONES: Milestone[] = CHECKPOINTS.flatMap((c) => c.milestones);

export const MILESTONE_BY_KEY = new Map(ALL_MILESTONES.map((mi) => [mi.key, mi]));

export function checkpointFor(ageMonths: number): AgeCheckpoint | undefined {
  return CHECKPOINTS.find((c) => c.ageMonths === ageMonths);
}

/**
 * Janela de marcos relevante para a idade atual: o checkpoint já alcançado e
 * o próximo, para os pais verem o que vem por aí.
 */
export function relevantCheckpoints(ageMonths: number): AgeCheckpoint[] {
  const idx = CHECKPOINTS.findIndex((c) => c.ageMonths > ageMonths);
  if (idx === -1) return CHECKPOINTS.slice(-2);
  const start = Math.max(0, idx - 1);
  return CHECKPOINTS.slice(start, Math.min(CHECKPOINTS.length, idx + 2));
}

/**
 * Janela de realização: marcos têm variação normal. Usamos a referência da
 * OMS/CDC mais uma folga de 3 meses antes de considerar "atrasado" — e mesmo
 * assim a palavra é "conversar com o pediatra", nunca "atraso".
 */
export function milestoneWindow(ageMonths: number): { from: number; to: number } {
  return { from: ageMonths - 2, to: ageMonths + 3 };
}

export function isExpectedNow(checkpointMonths: number, ageMonths: number): boolean {
  const { from, to } = milestoneWindow(checkpointMonths);
  return ageMonths >= from && ageMonths <= to;
}

/** Marcos cuja janela já passou sem registro — candidatos a atenção. */
export function overdueCheckpoints(ageMonths: number): AgeCheckpoint[] {
  return CHECKPOINTS.filter((c) => c.ageMonths + 3 < ageMonths);
}
