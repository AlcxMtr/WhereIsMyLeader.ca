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
  ag: '#CE1126', // Antigua and Barbuda – red
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

  // Remaining countries and territories (alphabetical by code). Territories that fly their
  // parent's flag use the parent's colour.
  ad: '#0018A8', // Andorra – blue
  ai: '#012169', // Anguilla – blue ensign
  ao: '#CC092F', // Angola – red
  aq: '#3A7DCE', // Antarctica – blue
  as: '#002B7F', // American Samoa – blue
  aw: '#418FDE', // Aruba – light blue
  ax: '#0064AD', // Åland – blue
  bb: '#00267F', // Barbados – ultramarine
  bf: '#EF2B2D', // Burkina Faso – red
  bi: '#CE1126', // Burundi – red
  bj: '#008751', // Benin – green
  bl: '#0055A4', // Saint Barthélemy – French blue
  bm: '#CF142B', // Bermuda – red ensign
  bn: '#F7E017', // Brunei – yellow
  bq: '#21468B', // Caribbean Netherlands – blue
  bs: '#00778B', // Bahamas – aquamarine
  bv: '#BA0C2F', // Bouvet Island – Norwegian red
  bw: '#75AADB', // Botswana – light blue
  bz: '#003F87', // Belize – blue
  cc: '#008000', // Cocos (Keeling) Islands – green
  cd: '#007FFF', // DR Congo – sky blue
  cf: '#003082', // Central African Republic – blue
  cg: '#009543', // Republic of the Congo – green
  ci: '#F77F00', // Côte d'Ivoire – orange
  ck: '#012169', // Cook Islands – blue ensign
  cm: '#007A5E', // Cameroon – green
  cr: '#CE1126', // Costa Rica – red
  cu: '#002A8F', // Cuba – blue
  cv: '#003893', // Cape Verde – blue
  cw: '#002B7F', // Curaçao – blue
  cx: '#1C8A42', // Christmas Island – green
  dj: '#6AB2E7', // Djibouti – light blue
  dm: '#006B3F', // Dominica – green
  do: '#002D62', // Dominican Republic – blue
  eh: '#007A3D', // Western Sahara – green
  er: '#12AD2B', // Eritrea – green
  fk: '#012169', // Falkland Islands – blue ensign
  fm: '#75B2DD', // Micronesia – light blue
  fo: '#ED2939', // Faroe Islands – red
  ga: '#009E60', // Gabon – green
  gd: '#CE1126', // Grenada – red
  gf: '#0055A4', // French Guiana – French blue
  gg: '#E8112D', // Guernsey – red
  gi: '#DA000C', // Gibraltar – red
  gl: '#D00C33', // Greenland – red
  gm: '#CE1126', // Gambia – red
  gn: '#CE1126', // Guinea – red
  gp: '#0055A4', // Guadeloupe – French blue
  gq: '#3E9A00', // Equatorial Guinea – green
  gs: '#012169', // South Georgia – blue ensign
  gt: '#4997D0', // Guatemala – sky blue
  gu: '#00297B', // Guam – blue
  gw: '#CE1126', // Guinea-Bissau – red
  gy: '#009E49', // Guyana – green
  hm: '#00008B', // Heard & McDonald Islands – Australian blue
  hn: '#0073CF', // Honduras – blue
  ht: '#00209F', // Haiti – blue
  im: '#CF142B', // Isle of Man – red
  io: '#012169', // British Indian Ocean Territory – blue
  je: '#DF112D', // Jersey – red
  jm: '#009B3A', // Jamaica – green
  kh: '#032EA1', // Cambodia – blue
  ki: '#CE1126', // Kiribati – red
  km: '#3D8E33', // Comoros – green
  kn: '#009E49', // Saint Kitts and Nevis – green
  ky: '#012169', // Cayman Islands – blue ensign
  la: '#002868', // Laos – blue
  lc: '#66CCFF', // Saint Lucia – light blue
  li: '#002B7F', // Liechtenstein – blue
  lr: '#BF0A30', // Liberia – red
  ls: '#00209F', // Lesotho – blue
  mc: '#CE1126', // Monaco – red
  mf: '#0055A4', // Saint Martin – French blue
  mg: '#FC3D32', // Madagascar – red
  mh: '#003893', // Marshall Islands – blue
  ml: '#14B53A', // Mali – green
  mo: '#00785E', // Macao – green
  mp: '#0071BC', // Northern Mariana Islands – blue
  mq: '#0055A4', // Martinique – French blue
  mr: '#006233', // Mauritania – green
  ms: '#012169', // Montserrat – blue ensign
  mt: '#CF142B', // Malta – red
  mu: '#EA2839', // Mauritius – red
  mv: '#D21034', // Maldives – red
  mw: '#CE1126', // Malawi – red
  mz: '#007168', // Mozambique – green
  na: '#003580', // Namibia – blue
  nc: '#0035AD', // New Caledonia – blue
  ne: '#E05206', // Niger – orange
  nf: '#007934', // Norfolk Island – green
  ni: '#0067C6', // Nicaragua – blue
  nr: '#002B7F', // Nauru – blue
  nu: '#FEDD00', // Niue – yellow
  pa: '#005293', // Panama – blue
  pf: '#CE1126', // French Polynesia – red
  pg: '#CE1126', // Papua New Guinea – red
  pm: '#0055A4', // Saint Pierre and Miquelon – blue
  pn: '#012169', // Pitcairn Islands – blue ensign
  pr: '#ED0000', // Puerto Rico – red
  pw: '#4AADD6', // Palau – light blue
  re: '#0055A4', // Réunion – French blue
  sb: '#0051BA', // Solomon Islands – blue
  sc: '#003F87', // Seychelles – blue
  sh: '#012169', // Saint Helena – blue ensign
  sj: '#BA0C2F', // Svalbard & Jan Mayen – Norwegian red
  sl: '#1EB53A', // Sierra Leone – green
  sm: '#5EB6E4', // San Marino – light blue
  so: '#4189DD', // Somalia – light blue
  sr: '#377E3F', // Suriname – green
  ss: '#0F47AF', // South Sudan – blue
  st: '#12AD2B', // São Tomé and Príncipe – green
  sv: '#0F47AF', // El Salvador – blue
  sx: '#DC171D', // Sint Maarten – red
  sz: '#3E5EB9', // Eswatini – blue
  tc: '#012169', // Turks and Caicos – blue ensign
  td: '#002664', // Chad – blue
  tf: '#002395', // French Southern Territories – blue
  tg: '#006A4E', // Togo – green
  tk: '#00247D', // Tokelau – blue
  tl: '#DC241F', // Timor-Leste – red
  to: '#C10000', // Tonga – red
  tt: '#CE1126', // Trinidad and Tobago – red
  tv: '#5B97B1', // Tuvalu – light blue
  vc: '#009E60', // Saint Vincent and the Grenadines – green
  vg: '#012169', // British Virgin Islands – blue ensign
  vi: '#F4C300', // U.S. Virgin Islands – yellow
  vu: '#D21034', // Vanuatu – red
  wf: '#ED2939', // Wallis and Futuna – red
  ws: '#CE1126', // Samoa – red
  ye: '#CE1126', // Yemen – red
  yt: '#0055A4', // Mayotte – French blue
  zm: '#198A00', // Zambia – green
  zw: '#319208', // Zimbabwe – green
};
