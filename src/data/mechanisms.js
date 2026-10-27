// Textos didáticos de cada tipo de fragmentação (fáceis de editar)
export const MECHANISMS = {
  alpha: {
    short: 'α-clivagem',
    group: 'alpha',
    color: '#2563eb',
    text: 'Segmentação α (dirigida pelo radical): o elétron desemparelhado do heteroátomo (sítio da ionização) forma uma nova ligação com o carbono α; a ligação do carbono α com o vizinho se rompe e o grupo sai como radical — de preferência o MAIOR radical. O íon formado (oxônio nos álcoois e éteres, imínio nas aminas, sulfônio) é estabilizado por ressonância: álcoois 1º → m/z 31 (CH₂=OH⁺); aminas 1ª → m/z 30 (CH₂=NH₂⁺).'
  },
  h_alpha: {
    short: 'α-clivagem (perda de H•)',
    group: 'alpha',
    color: '#2563eb',
    text: 'Mesma lógica da α-clivagem, mas a ligação rompida é Cα–H. Perder H• é menos favorável que perder um radical alquila, então o pico M − 1 costuma ser pequeno (exceto em aldeídos, aminas e alguns éteres).'
  },
  alpha_co: {
    short: 'α-clivagem da carbonila',
    group: 'alpha',
    color: '#7c3aed',
    text: 'A ionização remove um elétron n do O da carbonila. A ligação entre o C=O e um grupo vizinho se rompe; forma-se o íon acílio R–C≡O⁺, estabilizado por ressonância. Pela regra de Stevenson, sai preferencialmente o MAIOR radical (2-octanona: sai •C₆H₁₃ e fica CH₃CO⁺, m/z 43, pico-base; sair •CH₃ é bem menos favorável).'
  },
  inductive: {
    short: 'Clivagem indutiva (i)',
    group: 'inductive',
    color: '#16a34a',
    text: 'Segmentação indutiva (dirigida pela carga): o heteroátomo eletronegativo atrai o par de elétrons da ligação C–Y; ele sai como radical •Y e a carga fica no carbono (R–Br⁺• → R⁺ + Br•; R–O⁺•–R′ → R⁺ + •OR′). Favorecida quando o carbocátion formado é estável e quando Y é Br ou I. Típica de haletos de alquila (o pico do cátion alquila, sem halogênio, costuma ser intenso) e dos éteres (m/z 43, 57…).'
  },
  hetero: {
    short: 'Carga no heteroátomo',
    group: 'inductive',
    color: '#16a34a',
    text: 'A ligação se rompe com a carga permanecendo no heteroátomo (ex.: I⁺, Br⁺, ArO⁺). Pela regra de Stevenson, a carga fica no fragmento de menor energia de ionização.'
  },
  benzylic: {
    short: 'Clivagem benzílica',
    group: 'sigma',
    color: '#ea580c',
    text: 'Rompe-se a ligação β ao anel aromático. O cátion benzílico é estabilizado por ressonância e, no caso de C₇H₇⁺ (m/z 91), rearranja-se ao íon tropílio, aromático (6 elétrons π em anel de 7 membros).'
  },
  allylic: {
    short: 'Clivagem alílica',
    group: 'sigma',
    color: '#d97706',
    text: 'Rompe-se a ligação vizinha à C=C (posição alílica). O cátion alílico é estabilizado por ressonância.'
  },
  aryl: {
    short: 'Perda do substituinte do anel',
    group: 'sigma',
    color: '#ea580c',
    text: 'O substituinte ligado diretamente ao anel sai como radical e forma-se o cátion arila (ex.: C₆H₅⁺, m/z 77). A ligação C(sp²)–X é forte, então esse caminho compete com a sobrevivência de M⁺•.'
  },
  sigma: {
    short: 'Clivagem σ (C–C)',
    group: 'sigma',
    color: '#64748b',
    text: 'Quebra de uma ligação C–C sem participação de heteroátomo. A carga fica com o fragmento que forma o carbocátion mais estável (CH₃⁺ < 1º < 2º < 3º < alila < benzila) e, havendo opção, sai o maior radical. Em alcanos isso gera a "escadinha" CₙH₂ₙ₊₁⁺ (m/z 15, 29, 43, 57, 71, 85…), espaçada de 14 u (CH₂), com pico mais intenso em C₃ (43) ou C₄ (57); nos ramificados a quebra é no ponto de ramificação.'
  },
  h_loss: {
    short: 'Perda de H•',
    group: 'sigma',
    color: '#64748b',
    text: 'Perda de um átomo de hidrogênio (M − 1). Pouco favorável, exceto quando o cátion resultante é muito estabilizado (benzílico/tropílio, acílio).'
  },
  mclafferty: {
    short: 'Rearranjo de McLafferty',
    group: 'rearr',
    color: '#db2777',
    text: 'Um H do carbono γ é transferido ao átomo de elevada densidade eletrônica (O da C=O, N da nitrila, C do anel ou do alceno) por um estado de transição de 6 membros; a ligação Cα–Cβ se rompe e sai um alceno neutro. O íon é um cátion-radical: sem N, aparece em m/z par. Valores típicos: aldeídos 44, metilcetonas 58, amidas 59, ácidos 60, ésteres metílicos 74, alquilbenzenos 92, nitrilas 41.'
  },
  water: {
    short: 'Perda de água (M − 18)',
    group: 'rearr',
    color: '#0891b2',
    text: 'Álcoois perdem H₂O com facilidade (M − 18), muitas vezes seguida de perda de alceno: o H vem preferencialmente do carbono 4 (eliminação 1,4, estado de transição cíclico). Cuidado: o "último pico" de um álcool costuma ser M − 18 ou M − 15, e não o M; o M − 18 pode ser confundido com o M⁺• de um alceno.'
  },
  hx: {
    short: 'Perda de HX',
    group: 'rearr',
    color: '#0891b2',
    text: 'Haletos de alquila (sobretudo cloretos e fluoretos) eliminam HX, formando o cátion-radical de um alceno.'
  },
  mclafferty1: {
    short: 'McLafferty + 1',
    group: 'rearr',
    color: '#db2777',
    text: 'Em ésteres cuja porção alcoólica tem dois ou mais carbonos, DOIS hidrogênios migram dela para o grupo carboxila. Sai um radical alquenila/alila e fica o ácido protonado: m/z = massa do ácido + 1 (61 nos acetatos, 75 nos propanoatos, 89 nos butanoatos…). Por ser um íon de número par de elétrons, aparece em m/z ímpar.'
  },
  ring_alpha: {
    short: 'Abertura do anel (α) + perda de radical',
    group: 'rearr',
    color: '#c026d3',
    text: 'Em cetonas e álcoois cíclicos a α-clivagem abre o anel, mas não separa a molécula (a massa não muda). Um H migra e então sai um radical alquila (propila no anel de 6): fica C₃H₃O⁺ (m/z 55) na cicloexanona e C₃H₅O⁺ (m/z 57, pico-base) no cicloexanol.'
  },
  ring_alpha_ene: {
    short: 'Abertura do anel (α) + perda de eteno',
    group: 'rearr',
    color: '#c026d3',
    text: 'Depois que a α-clivagem abre o anel da cetona cíclica, o cátion-radical distônico elimina eteno (M − 28; m/z 70 na cicloexanona), que ainda pode perder CO (→ 42).'
  },
  ring_amine: {
    short: 'Abertura do anel da amina + perda de alceno',
    group: 'rearr',
    color: '#c026d3',
    text: 'Em aminas cíclicas a α-clivagem abre o anel; o cátion-radical aberto elimina um alceno (eteno na pirrolidina): N-metilpirrolidina 85 → 57, que ainda perde •CH₃ e dá CH₂=N⁺=CH₂ (m/z 42).'
  },
  aryl_ether_alkene: {
    short: 'Éter aromático: perda de alceno',
    group: 'rearr',
    color: '#c026d3',
    text: 'Em éteres aril-alquílicos com grupo ≥ C₂, um H do grupo alquila migra para o oxigênio/anel e sai um alceno neutro (eteno: M − 28). Forma-se o cátion-radical do fenol. Perder 28 (neutro) mantém a massa par; perder 29 (•C₂H₅, radical) deixa a massa ímpar.'
  },
  halonium_ring: {
    short: 'Halônio cíclico',
    group: 'rearr',
    color: '#0891b2',
    text: 'Em haletos de cadeia longa o halogênio "morde" o carbono 4 e forma um halônio cíclico de 5 membros, expulsando o restante da cadeia como radical: C₄H₈Cl⁺ (m/z 91/93, 3 : 1) ou C₄H₈Br⁺ (135/137, 1 : 1).'
  },
  alkyne_h: {
    short: 'Alcino terminal: perda de H• (M − 1)',
    group: 'sigma',
    color: '#d97706',
    text: 'Alcinos terminais apresentam pico M − 1 forte, pela perda do hidrogênio ligado ao carbono sp (H–C≡). Assim como o alila nos alcenos, o íon propargila (HC≡C–CH₂⁺ ⟷ HC⁺=C=CH₂, m/z 39) é típico dos alcinos.'
  },
  rda: {
    short: 'Retro-Diels–Alder',
    group: 'rearr',
    color: '#c026d3',
    text: 'O cátion-radical de um ciclo-hexeno se divide no inverso da reação de Diels–Alder: formam-se um dieno e um alceno; a carga fica, em geral, no dieno (cicloexeno 82 → butadieno⁺• 54 + eteno). Só acontece quando a C=C está dentro do anel e não conjugada com outra ligação π fora dele (α-ionona dá RDA, m/z 136; β-ionona não).'
  },
  ring_c2h4: {
    short: 'Perda de eteno do anel',
    group: 'rearr',
    color: '#c026d3',
    text: 'Cicloalcanos abrem o anel (o que não muda a massa) e em seguida eliminam eteno (M − 28).'
  },
  phenol_co: {
    short: 'Perda de CO (fenol)',
    group: 'rearr',
    color: '#c026d3',
    text: 'Fenóis rearranjam-se (tautômero ceto) e eliminam CO: M − 28 (fenol 94 → 66, que ainda perde H• → 65).'
  },
  phenol_cho: {
    short: 'Perda de CHO• (fenol)',
    group: 'rearr',
    color: '#c026d3',
    text: 'Fenóis também perdem HCO•, dando M − 29 (C₅H₅⁺, m/z 65 no fenol).'
  },
  ch2o: {
    short: 'Perda de CH₂O (anisol)',
    group: 'rearr',
    color: '#c026d3',
    text: 'Éteres aril-metílicos transferem um H da metila ao anel e eliminam formaldeído (M − 30).'
  },
  nitro_no: {
    short: 'Perda de NO• (nitro)',
    group: 'rearr',
    color: '#c026d3',
    text: 'O grupo nitro aromático se rearranja a nitrito (Ar–O–N=O) e perde NO• (M − 30); também é comum perder NO₂• (M − 46).'
  },
  ketene: {
    short: 'Perda de ceteno (M − 42)',
    group: 'rearr',
    color: '#c026d3',
    text: 'Acetanilidas e acetatos de arila transferem um H da metila ao N (ou O) e eliminam ceteno, CH₂=C=O. Forma-se o cátion-radical da anilina (ou do fenol) correspondente.'
  },
  hcn: {
    short: 'Perda de HCN (M − 27)',
    group: 'rearr',
    color: '#c026d3',
    text: 'Piridinas, anilinas e benzonitrilas expulsam HCN depois de abrir/rearranjar o anel: M − 27. Típico de compostos aromáticos nitrogenados.'
  },
  sec_co: {
    short: 'Secundária: perda de CO',
    group: 'secondary',
    color: '#94a3b8',
    text: 'Um íon com C=O perde CO (28 u). O acílio R–C≡O⁺ vira o carbocátion R⁺, importante quando R⁺ é estável (C₆H₅CO⁺ 105 → C₆H₅⁺ 77). No nitrobenzeno, ArO⁺ (93) perde CO e dá 65.'
  },
  sec_alkene: {
    short: 'Secundária: perda de alceno',
    group: 'secondary',
    color: '#94a3b8',
    text: 'Íons imínio/oxônio com um grupo N- ou O-alquila (≥ C₂) eliminam um alceno com transferência de H ao heteroátomo (ex.: 58 → 30 nas aminas, 59 → 31 nos éteres).'
  },
  sec_c2h2: {
    short: 'Secundária: perda de C₂H₂',
    group: 'secondary',
    color: '#94a3b8',
    text: 'Íons aromáticos perdem acetileno (26 u): 91 → 65, 77 → 51, 65 → 39.'
  },
  sec_h2: {
    short: 'Secundária: perda de H₂',
    group: 'secondary',
    color: '#94a3b8',
    text: 'Carbocátions alquila perdem H₂ e formam cátions alila/vinila: por isso cada grupo CₙH₂ₙ₊₁⁺ vem acompanhado de CₙH₂ₙ₋₁⁺ (43/41, 29/27…).'
  },
  sec_h: {
    short: 'Secundária: perda de H•',
    group: 'secondary',
    color: '#94a3b8',
    text: 'O cátion-radical C₅H₆⁺• (m/z 66, formado quando o fenol perde CO ou a anilina perde HCN) perde H• e dá o cátion ciclopentadienila, C₅H₅⁺ (m/z 65): fenol 94 → 66 → 65; anilina 93 → 66 → 65.'
  },
  sec_radical: {
    short: 'Secundária: perda de radical',
    group: 'secondary',
    color: '#94a3b8',
    text: 'Um cátion-radical (OE⁺•) pode perder um radical e virar um cátion de número par de elétrons (EE⁺).'
  },
  sec_c2h4: {
    short: 'Secundária: perda de C₂H₄',
    group: 'secondary',
    color: '#94a3b8',
    text: 'Após perder água, o cátion-radical de álcoois primários elimina eteno (M − 18 − 28).'
  }
}

export const MECH_GROUPS = [
  { id: 'alpha', label: 'α-clivagens', desc: 'iniciadas pelo radical do heteroátomo ou da carbonila' },
  { id: 'inductive', label: 'Clivagens indutivas', desc: 'a carga migra para o carbono (ou fica no heteroátomo)' },
  { id: 'sigma', label: 'Clivagens σ, benzílicas e alílicas', desc: 'carbocátions estabilizados' },
  { id: 'rearr', label: 'Rearranjos', desc: 'transferência de H ou quebra de duas ligações — íons de m/z par (sem N)' },
  { id: 'secondary', label: 'Fragmentações secundárias', desc: 'íons que se fragmentam de novo' }
]

// Perdas neutras comuns a partir de M (tabela de consulta)
export const COMMON_LOSSES = [
  { d: 1, what: 'H•', hint: 'aldeídos, alcinos terminais, fenóis, aminas cíclicas, nitrilas' },
  { d: 15, what: '•CH₃', hint: 'grupo metila (ramificação, metil-cetona)' },
  { d: 16, what: '•NH₂ ou O', hint: 'amidas; N-óxidos, nitro' },
  { d: 17, what: '•OH ou NH₃', hint: 'ácidos carboxílicos; aminas' },
  { d: 18, what: 'H₂O', hint: 'álcoois (às vezes ácidos, aldeídos)' },
  { d: 19, what: 'F•', hint: 'fluoretos' },
  { d: 20, what: 'HF', hint: 'fluoretos' },
  { d: 26, what: 'C₂H₂ ou •CN', hint: 'aromáticos; nitrilas' },
  { d: 27, what: 'HCN', hint: 'anilinas, nitrilas aromáticas, heteroaromáticos nitrogenados' },
  { d: 28, what: 'CO ou C₂H₄', hint: 'fenóis, quinonas; McLafferty, cicloalcanos, retro-Diels–Alder, éteres aromáticos de etila' },
  { d: 29, what: '•CHO ou •C₂H₅', hint: 'aldeídos, fenóis; grupo etila' },
  { d: 30, what: 'CH₂O ou NO•', hint: 'éteres metílicos aromáticos; nitroaromáticos (Ar–NO₂ → ArO⁺)' },
  { d: 31, what: '•OCH₃ ou •CH₂OH', hint: 'ésteres metílicos; álcoois primários' },
  { d: 32, what: 'CH₃OH', hint: 'ésteres metílicos' },
  { d: 35, what: 'Cl• (35/37)', hint: 'cloretos (verifique 37 também)' },
  { d: 36, what: 'HCl', hint: 'cloretos' },
  { d: 42, what: 'CH₂=C=O ou C₃H₆', hint: 'acetatos, acetamidas; McLafferty' },
  { d: 43, what: '•C₃H₇ ou CH₃CO•', hint: 'grupo propila; metil-cetonas' },
  { d: 44, what: 'CO₂', hint: 'ácidos, ésteres, anidridos' },
  { d: 45, what: '•OC₂H₅ ou •COOH', hint: 'ésteres etílicos; ácidos' },
  { d: 46, what: '•NO₂ ou C₂H₅OH', hint: 'nitro; ésteres etílicos' },
  { d: 57, what: '•C₄H₉', hint: 'grupo butila' },
  { d: 59, what: '•COOCH₃', hint: 'ésteres metílicos' },
  { d: 77, what: 'C₆H₅•', hint: 'derivados fenílicos' },
  { d: 56, what: 'C₄H₈', hint: 'retro-Diels–Alder (α-ionona: sai isobuteno)' },
  { d: 79, what: 'Br• (79/81)', hint: 'brometos (com 81)' },
  { d: 80, what: 'HBr', hint: 'brometos' },
  { d: 91, what: 'C₇H₇•', hint: 'derivados benzílicos' },
  { d: 127, what: 'I•', hint: 'iodetos' }
]

// Íons diagnósticos comuns de baixa massa
export const COMMON_IONS = [
  { mz: 27, what: 'C₂H₃⁺ (série dos alcenos: 27, 41, 55, 69…)' },
  { mz: 29, what: 'C₂H₅⁺ ou HC≡O⁺ (aldeídos)' },
  { mz: 30, what: 'CH₂=NH₂⁺ (aminas primárias)' },
  { mz: 31, what: 'CH₂=OH⁺ (álcoois primários) ou CH₃O⁺ (ésteres metílicos)' },
  { mz: 39, what: 'C₃H₃⁺ (propargila; aromáticos: 91 → 65 → 39)' },
  { mz: 41, what: 'C₃H₅⁺ (alila) — ou CH₂=C=NH⁺• (McLafferty de nitrila)' },
  { mz: 42, what: 'CH₂=N⁺=CH₂ (aminas cíclicas) ou C₃H₆⁺•' },
  { mz: 43, what: 'C₃H₇⁺ ou CH₃CO⁺' },
  { mz: 44, what: 'McLafferty de aldeídos (CH₂=CH–OH⁺•) ou H₂N–C≡O⁺ (amidas)' },
  { mz: 45, what: 'oxônio (CH₃CH=OH⁺, álcoois 2º) ou ⁺COOH (ácidos)' },
  { mz: 49, what: 'CH₂=Cl⁺ (cloretos; com 51, 3 : 1)' },
  { mz: 55, what: 'C₄H₇⁺ (alcenos) ou C₃H₃O⁺ (cicloexanona)' },
  { mz: 57, what: 'C₄H₉⁺ ou C₂H₅CO⁺' },
  { mz: 58, what: 'McLafferty de metil-cetonas' },
  { mz: 59, what: 'McLafferty de amidas; COOCH₃⁺' },
  { mz: 60, what: 'McLafferty de ácidos' },
  { mz: 61, what: 'McLafferty + 1 de acetatos (CH₃COOH₂⁺)' },
  { mz: 65, what: 'C₅H₅⁺ (de 91)' },
  { mz: 74, what: 'McLafferty de ésteres metílicos' },
  { mz: 75, what: 'McLafferty + 1 de propanoatos' },
  { mz: 89, what: 'McLafferty + 1 de butanoatos' },
  { mz: 77, what: 'C₆H₅⁺ (fenila)' },
  { mz: 91, what: 'C₇H₇⁺ (tropílio)' },
  { mz: 91, what: 'C₄H₈Cl⁺ (halônio cíclico, com 93) — em cloretos' },
  { mz: 92, what: 'McLafferty de alquilbenzenos' },
  { mz: 93, what: 'CH₂=Br⁺ (com 95, 1 : 1)' },
  { mz: 105, what: 'C₆H₅CO⁺ (benzoíla) ou C₈H₉⁺ (alquilbenzeno ramificado)' },
  { mz: 120, what: 'McLafferty de alquil-fenil-cetonas' }
]
