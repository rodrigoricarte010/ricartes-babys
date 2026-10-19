/**
 * Guia de febre e sinais de alerta por idade.
 *
 * Febre em bebê pequeno tem regras diferentes de febre em criança maior — e
 * saber QUAL regra aplica-se à idade evita tanto o pânico quanto a demora.
 * Referências: Sociedade Brasileira de Pediatria e diretrizes de puericultura.
 *
 * Isto é orientação de PRIMEIRA RESPOSTA para a família, não diagnóstico.
 * Na dúvida, o pediatra. Sempre.
 */

export type GuidanceTone = "ok" | "info" | "warning" | "danger";

export interface FeverGuidance {
  tone: GuidanceTone;
  title: string;
  text: string;
  action: string;
}

/** Medida axilar (a mais comum no Brasil). */
export const FEVER_THRESHOLD = 37.8;
export const LOW_GRADE_THRESHOLD = 37.3;

export const FEVER_RED_FLAGS: string[] = [
  "Choro que não passa ou choro “diferente”, gemido",
  "Moleza excessiva, difícil de acordar, não interage",
  "Manchas roxas ou pontinhos vermelhos na pele que não somem ao esticar",
  "Dificuldade para respirar, gemência ao respirar, afundamento entre as costelas",
  "Rigidez no pescoço ou fontanela (“moleira”) abaulada",
  "Recusa total de líquidos com fralda seca há mais de 6–8 h",
  "Convulsão",
  "Febre que volta depois de alguns dias sem febre",
];

export function feverGuidance(ageMonths: number, tempC: number | null): FeverGuidance | null {
  if (tempC == null || !Number.isFinite(tempC)) return null;

  if (tempC < LOW_GRADE_THRESHOLD) {
    return {
      tone: "ok",
      title: `${tempC.toFixed(1).replace(".", ",")} °C não é febre`,
      text: "Abaixo de 37,3 °C (axilar) é temperatura normal. Bebês esquentam fácil com roupa, banho e colo — meça de novo em repouso, com pouca roupa.",
      action: "Siga observando o comportamento, que importa mais que o número.",
    };
  }

  if (tempC < FEVER_THRESHOLD) {
    return {
      tone: "info",
      title: "Estado febril (37,3–37,7 °C)",
      text: "Não é febre ainda, mas é aviso. Ofereça peito/líquidos, reduza agasalhos e reavalie em 30–60 min com a criança tranquila.",
      action: "Se subir para 37,8 °C ou mais, valem as regras de febre abaixo.",
    };
  }

  // Febre de verdade (≥ 37,8 °C): a idade muda a urgência.
  if (ageMonths < 3) {
    return {
      tone: "danger",
      title: "Febre com menos de 3 meses: atendimento agora",
      text: "Em bebês com menos de 3 meses, febre ≥ 37,8 °C é sempre avaliada presencialmente no mesmo dia — o sistema imune ainda é imaturo e não dá para “esperar para ver”.",
      action: "Vá ao pronto-atendimento hoje. Leve este app com os registros de rotina.",
    };
  }

  if (ageMonths < 6 && tempC >= 39) {
    return {
      tone: "danger",
      title: "Febre alta (≥ 39 °C) entre 3 e 6 meses",
      text: "Nessa faixa, febre alta pede avaliação médica no mesmo dia, mesmo que a criança pareça bem após o antitérmico.",
      action: "Contate o pediatra agora ou vá ao pronto-atendimento.",
    };
  }

  if (tempC >= 39.5) {
    return {
      tone: "danger",
      title: "Febre muito alta (≥ 39,5 °C)",
      text: "Independentemente da idade, febre acima de 39,5 °C merece avaliação médica no mesmo dia.",
      action: "Contate o pediatra agora; se não houver acesso, pronto-atendimento.",
    };
  }

  return {
    tone: "warning",
    title: "Febre: observe com método",
    text: `Com ${ageMonths < 12 ? "menos de 1 ano" : "mais de 1 ano"} e febre entre 37,8 e 39,4 °C, o que mais importa é o comportamento: se aceita líquidos, interage e melhora com o antitérmico, costuma ser seguro observar em casa.`,
    action: "Procure o pediatra se durar mais de 48–72 h, se piorar, ou se aparecer qualquer sinal de alerta da lista.",
  };
}

/** Texto curto para exibir junto ao registro de sintoma. */
export function feverBadgeLabel(tempC: number | null): string | null {
  if (tempC == null) return null;
  if (tempC >= FEVER_THRESHOLD) return "febre";
  if (tempC >= LOW_GRADE_THRESHOLD) return "estado febril";
  return null;
}
