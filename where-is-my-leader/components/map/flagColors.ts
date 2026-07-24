/**
 * Primary representative color for each country's flag (ISO 3166-1 alpha-2, lowercase).
 * Chosen for visual impact as a translucent globe overlay — favours bright / saturated hues.
 */
export const flagPrimaryColors: Record<string, string> = {
  // North America
  ca: '#FF0000', // Canada – red maple leaf
  us: '#B22234', // USA – red stripes
  mx: '#006847', // Mexico – green

  // Europe
  gb: '#CF142B', // UK – red cross
  fr: '#0055A4', // France – blue
  de: '#FFCE00', // Germany – gold
  it: '#009246', // Italy – green
  es: '#AA151B', // Spain – red
  pt: '#006600', // Portugal – green
  nl: '#AE1C28', // Netherlands – red
  be: '#FAE042', // Belgium – yellow
  lu: '#00A3DA', // Luxembourg – light blue
  at: '#ED2939', // Austria – red
  ch: '#FF0000', // Switzerland – red
  ie: '#169B62', // Ireland – green
  dk: '#C60C30', // Denmark – red
  se: '#006AA7', // Sweden – blue
  no: '#EF2B2D', // Norway – red
  fi: '#003580', // Finland – blue
  is: '#003897', // Iceland – blue
  pl: '#DC143C', // Poland – red
  ua: '#005BBB', // Ukraine – blue
  ru: '#0033A0', // Russia – blue
  by: '#CF101A', // Belarus – red
  md: '#003DA5', // Moldova – blue
  ro: '#002B7F', // Romania – blue
  bg: '#00966E', // Bulgaria – green
  hu: '#CE2939', // Hungary – red
  cz: '#D7141A', // Czechia – red
  sk: '#0B4EA2', // Slovakia – blue
  si: '#003DA5', // Slovenia – blue
  hr: '#FF0000', // Croatia – red
  ba: '#002395', // Bosnia – blue
  rs: '#C6363C', // Serbia – red
  me: '#D4AF37', // Montenegro – gold
  mk: '#CE2028', // N. Macedonia – red
  al: '#E41E20', // Albania – red
  xk: '#244AA5', // Kosovo – blue
  gr: '#0D5EAF', // Greece – blue
  cy: '#4E7A3C', // Cyprus – olive
  ee: '#0072CE', // Estonia – blue
  lv: '#9E3039', // Latvia – dark red
  lt: '#FDB913', // Lithuania – yellow
  am: '#D90012', // Armenia – red
  ge: '#FF0000', // Georgia – red cross
  az: '#0092BC', // Azerbaijan – blue

  // Middle East
  tr: '#E30A17', // Turkey – red
  il: '#0038B8', // Israel – blue
  ps: '#239539', // Palestine – green
  jo: '#007A3D', // Jordan – green
  lb: '#00A550', // Lebanon – green
  sy: '#CE1126', // Syria – red
  iq: '#CE1126', // Iraq – red
  ir: '#239F40', // Iran – green
  sa: '#006C35', // Saudi Arabia – green
  ae: '#00732F', // UAE – green
  kw: '#007A3D', // Kuwait – green
  bh: '#CE1126', // Bahrain – red
  om: '#DB161B', // Oman – red
  qa: '#AC062A', // Qatar – maroon
  eg: '#CE1126', // Egypt – red
  ma: '#C1272D', // Morocco – red

  // South / Central Asia
  pk: '#01411C', // Pakistan – green
  in: '#FF9933', // India – saffron
  bd: '#006A4E', // Bangladesh – green
  lk: '#8D153A', // Sri Lanka – maroon
  np: '#DC143C', // Nepal – red
  bt: '#FF8000', // Bhutan – orange
  kz: '#00AFCA', // Kazakhstan – cyan
  uz: '#1EB53A', // Uzbekistan – green
  kg: '#E8112D', // Kyrgyzstan – red
  tj: '#CC0000', // Tajikistan – red
  tm: '#1C9A4A', // Turkmenistan – green
  af: '#000000', // Afghanistan – black (use green instead)
  mn: '#C4272F', // Mongolia – red

  // East / South-East Asia
  cn: '#DE2910', // China – red
  jp: '#BC002D', // Japan – red
  kr: '#C60C30', // South Korea – red
  kp: '#024FA2', // North Korea – blue
  tw: '#FE0000', // Taiwan – red
  hk: '#FF0000', // Hong Kong – red
  sg: '#EF3340', // Singapore – red
  my: '#CC0001', // Malaysia – red
  id: '#CE1126', // Indonesia – red
  ph: '#0038A8', // Philippines – blue
  th: '#A51931', // Thailand – red
  vn: '#DA251D', // Vietnam – red
  mm: '#FECB00', // Myanmar – yellow

  // Africa
  dz: '#006233', // Algeria – green
  tn: '#E70013', // Tunisia – red
  ly: '#239E46', // Libya – green
  sd: '#D21034', // Sudan – red
  et: '#078930', // Ethiopia – green
  ke: '#006600', // Kenya – green
  tz: '#1EB53A', // Tanzania – green
  ug: '#FCDC04', // Uganda – gold
  rw: '#20603D', // Rwanda – green
  ng: '#008751', // Nigeria – green
  gh: '#006B3F', // Ghana – green
  sn: '#00853F', // Senegal – green
  za: '#007A4D', // South Africa – green

  // Americas
  br: '#009C3B', // Brazil – green
  ar: '#74ACDF', // Argentina – light blue
  cl: '#D52B1E', // Chile – red
  pe: '#D91023', // Peru – red
  co: '#FCD116', // Colombia – yellow
  ec: '#FFD100', // Ecuador – yellow
  uy: '#5EB6E4', // Uruguay – light blue
  py: '#D52B1E', // Paraguay – red
  bo: '#D52B1E', // Bolivia – red
  ve: '#CF142B', // Venezuela – red

  // Oceania
  au: '#00008B', // Australia – blue
  nz: '#00247D', // New Zealand – dark blue
  fj: '#68BFE5', // Fiji – light blue

  // Other
  va: '#FFE000', // Vatican – gold
};
