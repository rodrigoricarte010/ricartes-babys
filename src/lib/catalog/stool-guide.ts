/**
 * Guia do cocô (e do xixi) por fase — o que é normal e o que é sinal de alerta.
 *
 * Referências: Caderneta da Criança (Ministério da Saúde), Sociedade Brasileira
 * de Pediatria. Cocô de bebê assusta de primeira viagem: o mecônio é preto, o
 * de transição é verde e o do peito é amarelo-mostarda com gruminhos — tudo
 * normal. Mas existem cores que são urgência de verdade (branco/acizentado =
 * possível atresia biliar; sangue; preto depois da primeira semana).
 *
 * Tom: orientação de primeira resposta, nunca diagnóstico. Na dúvida, pediatra.
 */

export type StoolTone = "ok" | "info" | "warning" | "danger";

export interface StoolGuidance {
  tone: StoolTone;
  title: string;
  text: string;
  action?: string;
}

export interface StoolPhase {
  name: string;
  text: string;
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** O que é esperado na fralda nesta idade. */
export function stoolPhase(ageDays: number): StoolPhase {
  if (ageDays <= 4) {
    return {
      name: "mecônio",
      text: "Nos primeiros 2–4 dias o cocô é preto-esverdeado e pegajoso (mecônio). É sinal de que o intestino está funcionando. Xixi: pode haver pouquíssimo no 1º dia — depois, aumenta com o leite.",
    };
  }
  if (ageDays <= 7) {
    return {
      name: "transição",
      text: "Entre o 3º e o 7º dia o cocô muda para verde-acastanhado e mais líquido (transição). É o leite chegando. Xixi: 4–6 fraldas molhadas por dia a partir do 4º dia indicam boa mamada.",
    };
  }
  return {
    name: "leite maduro",
    text: "No peito: amarelo-mostarda, líquido/pastoso, com gruminhos, às vezes a cada mamada — tudo normal. De fórmula: marrom-claro, pastoso, 1–2x/dia. Xixi: 5–6 fraldas bem molhadas por dia.",
  };
}

/** Interpreta a cor/consistência escolhida no formulário de fralda. */
export function stoolGuidance(ageDays: number, color: string, texture: string): StoolGuidance | null {
  const c = norm(color);
  const t = norm(texture);
  if (!c && !t) return null;

  // ── Sinais de alerta reais ────────────────────────────────────────────────
  if (c.includes("sangue") || c.includes("vermelh")) {
    return {
      tone: "danger",
      title: "Sangue nas fezes",
      text: "Sangue vivo ou fezes avermelhadas merecem avaliação — pode ser desde uma fissura anal (comum com cocô duro) até alergia à proteína do leite ou infecção.",
      action: "Fale com o pediatra hoje. Guarde a fralda ou uma foto para mostrar.",
    };
  }
  if (c.includes("pontinhos")) {
    return {
      tone: "ok",
      title: "Gruminhos: perfeitamente normal",
      text: "Cocô amarelo com pontinhos brancos (\"sementinhas\") é a cara do bebê que mama no peito. São gorduras do leite — sinal de que está tudo bem.",
    };
  }
  if (c.includes("esbranquic") || c.includes("cinza") || c.includes("argila") || c.includes("branco")) {
    return {
      tone: "danger",
      title: "Fezes brancas ou acinzentadas",
      text: "Cocô sem cor (branco, cinza-claro, cor de argila) pode indicar que a bile não está chegando ao intestino — nas primeiras semanas, isso precisa ser investigado com urgência (atresia biliar).",
      action: "Procure atendimento médico HOJE. Leve a fralda ou uma foto.",
    };
  }
  if (c.includes("preto")) {
    if (ageDays <= 7) {
      return {
        tone: "ok",
        title: "Mecônio — esperado nesta fase",
        text: stoolPhase(ageDays).text,
      };
    }
    return {
      tone: "danger",
      title: "Fezes pretas depois da 1ª semana",
      text: "Cocô preto e pegajoso (como borra de café/betume) após os primeiros dias pode indicar sangue digerido. Suplemento de ferro também escurece o cocô — mas na dúvida, não espere.",
      action: "Fale com o pediatra hoje. Se ela usa ferro, mencione isso.",
    };
  }

  // ── Atenção ───────────────────────────────────────────────────────────────
  if (t.includes("muco")) {
    return {
      tone: "warning",
      title: "Muco nas fezes",
      text: "Um pouco de muco pode aparecer com saliva em excesso (dentes!) ou irritação leve. Se for frequente, ou vier com sangue, febre ou recusa de mamar, precisa de avaliação.",
      action: "Observe os próximos cocôs; repetiu ou piorou → pediatra.",
    };
  }
  if (t.includes("formada") && ageDays < 120) {
    return {
      tone: "warning",
      title: "Cocô duro antes da introdução alimentar",
      text: "Antes dos 6 meses, fezes formadas/duras não são o esperado — pode ser constipação ou sinal de que a mamada precisa de ajuste.",
      action: "Converse com o pediatra sobre hidratação e técnica de mamada.",
    };
  }
  if (t.includes("liquida") && ageDays > 180) {
    return {
      tone: "warning",
      title: "Fezes líquidas em volume",
      text: "Depois da introdução alimentar, cocô muito líquido e frequente sugere diarreia. O maior risco em bebê é a desidratação.",
      action: "Ofereça líquidos e continue amamentando. Sinais de desidratação (pouco xixi, boca seca, choro sem lágrima, moleira funda) → atendimento imediato.",
    };
  }

  // ── Tranquilizar ──────────────────────────────────────────────────────────
  if (c.includes("verde") || c.includes("esverdeado")) {
    return {
      tone: "info",
      title: "Esverdeado? Quase sempre normal",
      text: "Cocô verde é comum: leite anterior/posterior desbalanceado, fórmula, suplemento de ferro ou só digestão rápida. Se ela ganha peso e está bem, não é motivo de alarme.",
      action: "Se vier com outros sintomas, aí sim converse com o pediatra.",
    };
  }

  const phase = stoolPhase(ageDays);
  return {
    tone: "ok",
    title: "Dentro do esperado",
    text: `Essa descrição combina com a fase "${phase.name}". ${phase.text}`,
  };
}
