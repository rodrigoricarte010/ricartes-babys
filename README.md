# Ricartes Babys 🌱

Acompanhamento de crescimento e desenvolvimento infantil feito sob medida para a
família Ricartes — começando pela **Rosie Grace** (nascida em 31/07/2026) e pronto
para os irmãos que vierem.

Um PWA (funciona no celular como app nativo, instala na tela de início, abre em
tela cheia) com curvas de crescimento oficiais da OMS, rotina diária, marcos do
desenvolvimento, carteira de vacinação, diário de memórias e relatório imprimível
para o pediatra.

---

## O que ele faz

### 🌱 Crescimento (o coração do app)
- Curvas **peso-para-idade, estatura-para-idade, perímetro cefálico-para-idade e
  IMC-para-idade** calculadas localmente com as **tabelas LMS oficiais da OMS**
  (Child Growth Standards, 0–5 anos), separadas por sexo.
- Para cada medição: **percentil, z-score e classificação**, com **prévia ao vivo**
  enquanto você digita o peso no formulário.
- **Idade corrigida automática** para prematuros (< 37 semanas) até os 2 anos —
  a convenção correta de puericultura, que evita rotular um prematuro saudável.
- **Velocidade de crescimento** (g/dia) comparada à referência da faixa etária, e
  alerta quando a criança **cruza faixas de percentil** (o sinal que realmente importa).
- Eixo do gráfico se adapta à idade (não mostra 5 anos inteiros para um bebê de 2 meses).
- Exportação em **CSV** e relatório imprimível.

### 🍼 Rotina diária
- Registro em 1 toque de: **peito (com cronômetro e troca de lado), mamadeira,
  papinha, sono, fralda, remédio, sintoma, consulta e nota**.
- **Cronômetro de amamentação persistente**: sobrevive a refresh e navegação, com
  pausar / trocar de lado / salvar.
- Resumo do dia (mamadas, minutos de sono, fraldas), "última mamada há…", intervalo
  médio entre mamadas e **padrão dos últimos 7 dias** em barras.
- **Introdução alimentar**: marca alimento novo, observa reação por 3 dias e lista o
  que **não** oferecer antes da idade (mel, leite de vaca, açúcar, risco de engasgo…).

### ✨ Marcos do desenvolvimento
- ~150 marcos organizados por idade (2m → 5 anos) e categoria (motor grosso, motor
  fino, comunicação, social, cognitivo, autonomia), compilados de **CDC "Learn the
  Signs. Act Early."**, janelas motoras da **OMS** e **Caderneta da Criança**.
- Progresso por categoria, dicas de estímulo e — recolhidos e com o tom certo —
  os **sinais para conversar com o pediatra** (nunca "está atrasado").

### 💉 Carteira de vacinação
- Calendário de referência **PNI + SBIm** (com as mudanças recentes, como o reforço
  de pólio injetável aos 15 meses), com status **aplicada / é agora / em atraso / futura**.
- Registro de data, local e lote; toggle para incluir recomendações da rede privada.
- Deixa claro que a fonte oficial é a caderneta e a equipe de saúde.

### 📔 Diário de memórias e fotos em tudo
- Textos datados com humor do dia e fotos — porque os dias passam rápido demais.
- **Fotos em qualquer registro**: sintoma (a erupção na pele vale mais que mil
  descrições), medicamento (a receita), consulta, nota, marco conquistado —
  tudo aparece como miniatura na linha do tempo. As imagens são comprimidas no
  aparelho antes de salvar (640 px, JPEG), então funcionam offline e não
  estouram o banco.

### 🩺 Relatório para consulta
- Uma página imprimível/PDF com antropometria completa (z e percentil), vacinação,
  rotina e marcos. Feita para mostrar no celular ou entregar impressa no consultório.

### 🧭 Insights acionáveis (o diário que pensa junto)
- **Ritmo de sono**: janelas acordadas por idade (referências Cleveland Clinic /
  Sleep Foundation), barra de progresso da janela, **sugestão da próxima soneca
  e do horário de dormir** a partir da hora em que ela acordou — o mesmo princípio
  que tornou o Huckleberry famoso, aqui sem assinatura.
- **Saltos mentais** (The Wonder Weeks): calcula a semana de vida (corrigida pela
  data prevista quando se sabe a gestação) e avisa se ela está em fase
  “tempestuosa” (os 3 Cs), “ensolarada” ou em calmaria — com a linha do tempo dos
  10 saltos e o que cada um traz.
- **Guia de febre por idade**: ao registrar temperatura, interpreta na hora
  (não-febre / estado febril / febre) e aplica a regra certa para a idade —
  incluindo “< 3 meses com febre = atendimento no mesmo dia” — com a lista de
  sinais de alerta para correr.
- **Estimule hoje**: 3 brincadeiras curadas para a fase exata, rotacionáveis,
  ligadas às categorias de desenvolvimento.
- **Comparar irmãos**: sobrepõe a trajetória de outro filho na mesma curva
  (cada um com sua referência de sexo/idade; a sobreposição é visual).
- **Mesversários**: recap automático de cada mês completo — ganho de peso e
  estatura, marcos conquistados e ritmo médio de mamadas/sono.

### 👨‍‍👧 Várias crianças
- Cada criança tem suas próprias curvas, marcos e carteira; trocar entre elas é um toque.

---

## Onde os dados ficam

| Modo | Quando | O que acontece |
|---|---|---|
| **Local** (padrão) | Sem variáveis de ambiente | Tudo no **IndexedDB do navegador**. Sem conta, sem servidor, sem custo. Vem com a Rosie Grace de exemplo. |
| **Nuvem** | Com Supabase configurado | Conta por e-mail, **sincronização entre aparelhos** e compartilhamento com a família. Autorização inteira no banco via **Row Level Security**. |

Migrar de um para o outro é um clique: **Configurações → Exportar/Importar backup (JSON)**.

### Ativando a nuvem (5 minutos, grátis)
1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor, rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
3. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. `npm run dev` e entre em `/entrar`.

---

## Rodando localmente

```bash
npm install
npm run dev        # http://localhost:3000
```

Sem `.env.local`, o app abre em modo local já populado com a família de exemplo
(Rosie Grace, com curva, rotina dos últimos dias, marcos, vacinas e diário).
Para começar do zero: **Configurações → Apagar dados locais**.

Outros scripts:

```bash
npm run build      # build de produção
npm start          # serve o build
npm run typecheck  # tsc --noEmit
npm run icons      # regenera ícones PWA a partir de assets/icon-source.png
```

---

## Arquitetura

```
src/
├── app/                  # rotas (App Router) + manifest PWA + callback de auth
├── components/
│   ├── ui/               # design system (botão, card, diálogo nativo, toasts…)
│   ├── layout/           # shell: sidebar desktop, bottom-nav mobile, troca de criança
│   ├── log/              # sistema de registro: formulários + cronômetro + ações rápidas
│   ├── growth/           # gráfico SVG das curvas OMS + resumo de percentis
│   ├── routine/          # linha do tempo e leitura de eventos
│   └── pages/            # telas (painel, crescimento, rotina, marcos, vacinas, diário…)
└── lib/
    ├── growth.ts         # ÚNICO lugar que conhece os números da OMS
    ├── growth-engine.ts  # carrega as tabelas LMS em chunk separado (lazy)
    ├── analytics.ts      # leituras de rotina (médias, intervalos, ganho de peso)
    ├── vaccine-progress.ts
    ├── catalog/          # marcos, vacinas PNI/SBIm, alimentos, sono, saltos, atividades
    ├── health.ts         # guia de febre e sinais de alerta por idade
    ├── db/               # adaptadores de persistência (local / supabase) + seed
    └── store.tsx         # estado global otimista da família
supabase/schema.sql       # tabelas + Row Level Security
```

Decisões que valem explicar:

- **Tabelas da OMS em chunk separado.** O pacote `who-growth-standards` traz as
  tabelas LMS completas (~520 KB). São carregadas sob demanda só onde há percentil,
  para não pesar no primeiro carregamento.
- **Gráfico de crescimento em SVG próprio.** Curvas de referência, faixas sombreadas,
  trajetória da criança e tooltip precisam de controle fino — bibliotecas genéricas
  brigam com o visual de caderneta da OMS.
- **Rotina em uma tabela só (`events` com `kind` + `payload`).** Sincronização trivial
  (uma tabela, `updated_at`, delete lógico) e acrescentar um tipo de registro não
  exige migração.
- **Estado otimista.** Registrar mamada com um bebê no colo não pode esperar 400 ms
  de round-trip; a interface responde na hora e grava em seguida.
- **Diálogos com `<dialog>` nativo.** Foco preso, ESC, backdrop e leitores de tela
  corretos de graça; no celular viram bottom sheet.
- **Sem `next/font/google`.** O build não pode depender de baixar fontes; a pilha de
  fontes é do sistema (arredondada quando disponível).

## Referências e avisos

- Percentis e z-scores: **OMS Child Growth Standards** (tabelas LMS), via pacote MIT
  [`who-growth-standards`](https://github.com/SunnySeedApp/who-growth-standards);
  os dados de referência pertencem à OMS.
- Marcos: CDC *Learn the Signs. Act Early.* (2022), janelas motoras da OMS e
  Caderneta da Criança (Ministério da Saúde).
- Vacinas: Calendário Nacional de Vacinação (PNI) e recomendações SBIm.
- Alimentos: Guia Alimentar para Crianças Brasileiras Menores de 2 Anos (MS, 2019).

> **Este app é uma ferramenta de acompanhamento da família, não um dispositivo
> médico.** Percentil é posição na curva, não nota. Quem interpreta é o pediatra.

## Inspirado por (e agradecido a)

O conjunto de funcionalidades foi desenhado a partir do que os melhores apps do
mercado fazem bem — Sprout, Huckleberry, Baby Tracker (Nighp), GrowthKit, iBabyControl,
Bebê em Dia e a Caderneta da Criança digital — combinado num app só, sem assinatura,
com os dados da família sob o controle da família.
