/**
 * Introdução alimentar.
 *
 * Base: Guia Alimentar para Crianças Brasileiras Menores de 2 Anos
 * (Ministério da Saúde, 2019) e recomendações de introdução precoce de
 * alergênicos. Serve para registrar os primeiros alimentos e reagrupar
 * reações num só lugar — nada aqui substitui a orientação do pediatra.
 */

export interface FoodGroup {
  key: string;
  label: string;
  /** Mês típico de introdução. */
  fromMonths: number;
  examples: string[];
  note?: string;
}

export const FOOD_GROUPS: FoodGroup[] = [
  {
    key: "frutas",
    label: "Frutas",
    fromMonths: 6,
    examples: ["banana", "maçã raspada", "pera", "mamão", "abacate", "manga"],
    note: "Amassadas ou em pedaços macios, sem açúcar.",
  },
  {
    key: "legumes-verduras",
    label: "Legumes e verduras",
    fromMonths: 6,
    examples: ["abóbora", "cenoura", "batata-doce", "chuchu", "brócolis", "couve"],
  },
  {
    key: "cereais-tuberculos",
    label: "Cereais e tubérculos",
    fromMonths: 6,
    examples: ["arroz", "macarrão", "batata", "inhame", "mandioca", "aveia"],
  },
  {
    key: "proteinas",
    label: "Carnes e ovos",
    fromMonths: 6,
    examples: ["frango desfiado", "carne moída", "peixe sem espinha", "fígado", "ovo cozido"],
    note: "Fonte principal de ferro e zinco — não deixe para depois.",
  },
  {
    key: "leguminosas",
    label: "Leguminosas",
    fromMonths: 6,
    examples: ["feijão", "lentilha", "grão-de-bico", "ervilha"],
  },
  {
    key: "laticinios",
    label: "Derivados de leite",
    fromMonths: 9,
    examples: ["iogurte natural", "queijo branco", "requeijão"],
    note: "Leite de vaca como bebida principal, só depois de 1 ano.",
  },
];

/** Alergênicos mais comuns — a introdução precoce e em casa reduz risco. */
export interface Allergen {
  key: string;
  label: string;
  /** Mês a partir do qual se pode oferecer, com segurança. */
  fromMonths: number;
  form: string;
  watch: string;
}

export const ALLERGENS: Allergen[] = [
  {
    key: "ovo",
    label: "Ovo",
    fromMonths: 6,
    form: "Bem cozido, gema e clara",
    watch: "Vermelhidão, coceira, inchaço nos lábios",
  },
  {
    key: "leite",
    label: "Proteína do leite de vaca",
    fromMonths: 6,
    form: "Em preparações (iogurte, queijo)",
    watch: "Vômito, diarreia com muco, sangue nas fezes",
  },
  {
    key: "gluten",
    label: "Trigo e glúten",
    fromMonths: 6,
    form: "Pão, macarrão, aveia em pequena quantidade",
    watch: "Barriga estufada, fezes volumosas e claras",
  },
  {
    key: "amendoim",
    label: "Amendoim",
    fromMonths: 6,
    form: "Pasta diluída, nunca o grão inteiro",
    watch: "Urticária, tosse, dificuldade respiratória",
  },
  {
    key: "castanhas",
    label: "Castanhas e nozes",
    fromMonths: 6,
    form: "Farinha ou pasta diluída",
    watch: "Urticária, inchaço, chiado no peito",
  },
  {
    key: "peixe",
    label: "Peixe",
    fromMonths: 6,
    form: "Cozido ou assado, sem espinhas",
    watch: "Coceira, vermelhidão, náusea",
  },
  {
    key: "crustaceos",
    label: "Crustáceos",
    fromMonths: 12,
    form: "Camarão bem cozido e amassado",
    watch: "Reação imediata na pele ou respiratória",
  },
  {
    key: "soja",
    label: "Soja",
    fromMonths: 9,
    form: "Tofu amassado",
    watch: "Desconforto abdominal",
  },
  {
    key: "gergelim",
    label: "Gergelim",
    fromMonths: 9,
    form: "Tahine diluído",
    watch: "Reação de pele",
  },
];

/**
 * O que NÃO oferecer antes da idade — e por quê.
 * Estes itens são os mais importantes de todo o módulo: evitam risco real.
 */
export interface ForbiddenFood {
  key: string;
  label: string;
  beforeMonths: number;
  reason: string;
  severity: "risco" | "evitar";
}

export const FORBIDDEN_FOODS: ForbiddenFood[] = [
  {
    key: "mel",
    label: "Mel",
    beforeMonths: 12,
    reason: "Risco de botulismo infantil — mesmo mel caseiro ou em bolos.",
    severity: "risco",
  },
  {
    key: "leite-vaca",
    label: "Leite de vaca como bebida principal",
    beforeMonths: 12,
    reason: "Baixo teor de ferro e sobrecarga renal; causa anemia.",
    severity: "risco",
  },
  {
    key: "sal",
    label: "Sal adicionado",
    beforeMonths: 12,
    reason: "Use ervas e temperos naturais no lugar.",
    severity: "evitar",
  },
  {
    key: "acucar",
    label: "Açúcar e adoçantes",
    beforeMonths: 24,
    reason: "O Ministério da Saúde recomenda zero açúcar até os 2 anos.",
    severity: "evitar",
  },
  {
    key: "ultraprocessados",
    label: "Ultraprocessados",
    beforeMonths: 24,
    reason: "Biscoito recheado, salgadinho, salsicha, refrigerante, suco de caixinha.",
    severity: "evitar",
  },
  {
    key: "engasgo",
    label: "Alimentos com risco de engasgo",
    beforeMonths: 48,
    reason: "Uva inteira, tomate-cereja inteiro, castanhas, pipoca, bala, salsicha em rodelas.",
    severity: "risco",
  },
  {
    key: "cafeina",
    label: "Café e bebidas com cafeína",
    beforeMonths: 24,
    reason: "Interfere no sono e na absorção de ferro.",
    severity: "evitar",
  },
  {
    key: "suco",
    label: "Suco de fruta (mesmo natural)",
    beforeMonths: 12,
    reason: "Fruta in natura é melhor: tem fibra e sacia.",
    severity: "evitar",
  },
];

/**
 * Regra prática de oferta: um alimento novo por vez, por 3 dias, para
 * identificar reação. É o que os apps de mercado chamam de "allergen log".
 */
export const NEW_FOOD_WATCH_DAYS = 3;

export type ReactionLabel = "none" | "mild" | "strong";

export const REACTION_LABEL: Record<ReactionLabel, string> = {
  none: "Sem reação",
  mild: "Reação leve",
  strong: "Reação importante",
};

export const REACTION_TONE: Record<ReactionLabel, "ok" | "warning" | "danger"> = {
  none: "ok",
  mild: "warning",
  strong: "danger",
};
