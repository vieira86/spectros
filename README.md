# SPECTROS — Mass Spectrometry System

Aplicação web didática para **simulação e interpretação de espectros de massas por impacto de elétrons (EM-IE, 70 eV)** em Química Orgânica.
O estudante desenha a molécula (editor JSME) ou digita o SMILES, e o SPECTROS conduz a análise passo a passo,
no mesmo espírito do IRIS e do NUMARES: **massa → ionização (M⁺•) → isótopos → fragmentações → perdas neutras → espectro**.

Cada pico é explicado: o caminho de fragmentação aparece na estrutura (átomos que ficam no íon, ligação rompida,
H transferido), com a equação `M⁺• → íon⁺ + neutro`, o tipo de íon (EE⁺ ou OE⁺•) e o "porquê" (estabilidade do cátion e do radical).

## Rodar

```bash
npm install
npm run dev      # desenvolvimento (copia o RDKit.js para public/rdkit antes)
npm test         # testes do motor com espectros de referência
npm run build    # gera dist/
```

Deploy: `.github/workflows/deploy.yml` (igual ao do IRIS/NUMARES) publica no GitHub Pages a cada push na `main`
(ative em *Settings → Pages → Source: GitHub Actions*).

## Etapas

1. **Massa** – fórmula, IDH, massas nominal / monoisotópica / média, desafio "qual a m/z de M⁺•?", fórmulas isobáricas (alta resolução).
2. **Ionização** – M + e⁻ → M⁺• + 2e⁻; sítio provável da carga (menor energia de ionização), regra do nitrogênio, regra do 13, estabilidade esperada de M⁺•.
3. **Isótopos** – M, M+1, M+2 calculados pela abundância natural; estimativa do nº de C; padrões de Cl, Br e S.
4. **Fragmentação** – caminhos agrupados: α-clivagens, clivagens indutivas, σ/benzílica/alílica, rearranjos (McLafferty, perda de H₂O, HX, retro-Diels–Alder, CO de fenóis, ceteno, HCN, NO de nitroaromáticos) e fragmentações secundárias (acílio → R⁺ + CO, tropílio → C₅H₅⁺, imínio/oxônio → perda de alceno…).
5. **Perdas neutras** – tabela M − x com consulta às perdas comuns; íons diagnósticos (43, 77, 91, 105…); alta resolução nos fragmentos.
6. **Espectro** – desafio "qual é o pico-base?", espectro de barras interativo (clique no pico → atribuição e destaque na estrutura).
7. **Resumo** – tabela de picos e texto no formato de artigo: `EM (IE, 70 eV), m/z (%): …`.

## Estrutura

```
src/
  data/
    rules.js         ← TODAS as pontuações do modelo (cátions, radicais, penalidades, rearranjos,
                       secundárias). É aqui que se calibra o espectro.
    mechanisms.js    textos de cada mecanismo, perdas comuns e íons diagnósticos
    elements.js      massas exatas, médias, isótopos e energias de ionização típicas
    steps.js         textos das etapas
    examples.js      moléculas de exemplo
  engine/            motor sem React (testável no Node)
    molecule.js      JSON do RDKit → grafo (o mesmo do NUMARES)
    mass.js          fórmulas, massas, padrão isotópico (convolução), regra do 13, isóbaros
    features.js      grupos funcionais (cetona, éster, amina, álcool 1º/2º/3º…)
    ionization.js    sítio de ionização e estabilidade de M⁺•
    fragments.js     regras de fragmentação primárias e secundárias
    index.js         analyzeMolecule(mol) → espectro completo; msReport()
  chem/rdkit.js      carrega o RDKit.js e converte SMILES
  components/        interface (React + Tailwind, mesmo estilo do IRIS/NUMARES)
```

## Como as intensidades são estimadas

Cada caminho recebe uma pontuação = **estabilidade do cátion** (imínio 9 > benzílico 8 ≈ acílio 7,5 ≈ oxônio 7,5 > terciário 5,5 > …)
**+ estabilidade do radical perdido** (terciário > secundário > primário > metila > H•) **+ penalidades** (romper ligação com C sp²).
A abundância é proporcional a `exp(1,2 × pontuação)`; o íon molecular recebe uma pontuação pela classe do composto
(aromático alto, álcool terciário baixo…). Os isótopos de cada íon são somados ao final e o maior pico vira 100%.

## Alinhamento com a aula (Minicurso de Espectrometria de Massas, QO III · IFRO)

As regras seguem os slides da aula: ordem de saída do elétron n > π > σ; regra de Stevenson (cátion mais estável,
**maior radical sai**); regra do número par de elétrons; estabilidade dos cátions CH₃⁺ < 1º < 2º < 3º < alila < benzila;
regra do nitrogênio; perdas impossíveis (4–14 u e 21–25 u); padrões de Cl/Br (3:1, 9:6:1, 1:1, 1:2:1) e S (M+2 ~4–5%).
Mecanismos por classe, todos testados em `engine.test.js` (bloco "exemplos da aula"): escadinha de 14 u dos alcanos,
M − 28/M − 15 dos cicloalcanos, alila 41, retro-Diels–Alder (com bloqueio quando a C=C é conjugada: α × β-ionona),
M − 1 e propargila dos alcinos, tropílio 91 / McLafferty 92, abertura de anel de cetonas e álcoois cíclicos (55, 57),
fenóis (M − 28 → 65), éteres (α, indutiva, perda de alceno do oxônio; éter aromático −C₂H₄), McLafferty de aldeídos,
cetonas, ácidos, amidas, ésteres e **nitrilas (41)**, **McLafferty + 1** dos ésteres (61, 75, 89), aminas (α, cíclicas → 42),
anilina 93 → 66 → 65, nitroaromáticos 123 → 93 → 65 e 77, haletos (perda de X•, HX, α, **halônio cíclico** 91/93).

## Limitações (de propósito, nível didático)

- As m/z previstas são exatas; **as intensidades são qualitativas** (acertam o pico-base e os íons principais
  na maioria dos compostos simples dos testes, mas não reproduzem um espectro do NIST).
- Não considera efeitos orto, fragmentações de anéis complexos (terpenos, policíclicos) nem a dependência do instrumento.
- Só ionização por elétrons (70 eV); ESI/APCI ([M+H]⁺, adutos) ficam para uma próxima versão.

## Ideias para próximas versões

- Modo inverso "espectro → estrutura" (dar um espectro e o aluno propõe a molécula).
- Comparar com espectros experimentais (ex.: NIST WebBook / MassBank) e mostrar a diferença.
- ESI-EM: [M+H]⁺, [M+Na]⁺, [M−H]⁻ e padrões de carga múltipla.
