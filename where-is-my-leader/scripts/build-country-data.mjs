/**
 * Builds the country data the map relies on, from a Natural Earth admin-0 GeoJSON
 * (map subunits, e.g. https://www.naturalearthdata.com/downloads/10m-cultural-vectors/):
 *
 *   public/geojson/world.geojson               every country/territory, simplified, properties { code, name }
 *   components/map/countryNames.generated.ts   every known name for each country -> ISO code
 *
 * Usage: node scripts/build-country-data.mjs <path-to-natural-earth.geojson>
 *
 * Simplification never drops a shape: rings that would collapse (tiny islands, micro-states)
 * fall back to finer precision, so every country keeps a highlightable polygon.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/build-country-data.mjs <natural-earth-admin0.geojson>');
  process.exit(1);
}

// Natural Earth leaves ISO_A2 as "-99" for some features; these map by ADM0_A3 instead.
// Disputed/unclaimed areas (Siachen, Spratly Islands, Bir Tawil, ...) are deliberately left out.
const ADM0_A3_FALLBACK = {
  CHN: 'cn',
  KOR: 'kr',
  PRK: 'kp',
  CYN: 'cy', // Northern Cyprus
  SOL: 'so', // Somaliland
};

// Name fields worth matching against. Primary names describe the feature itself; secondary ones can
// describe its parent too (Caribbean Netherlands has ADMIN "Netherlands"), so primary names always win.
const PRIMARY_NAME_FIELDS = ['NAME_EN', 'NAME', 'NAME_LONG', 'FORMAL_EN', 'NAME_CIAWF'];
const SECONDARY_NAME_FIELDS = ['ADMIN', 'GEOUNIT', 'SUBUNIT', 'BRK_NAME', 'NAME_SORT', 'NAME_ALT', 'NAME_DE', 'NAME_FR', 'FORMAL_FR'];

const TOLERANCES = [0.05, 0.01, 0.002, 0.0004, 0];

function featureCode(props) {
  for (const raw of [props.ISO_A2_EH, props.ISO_A2]) {
    if (typeof raw === 'string' && /^[A-Z]{2}$/.test(raw)) return raw.toLowerCase();
  }
  return ADM0_A3_FALLBACK[props.ADM0_A3] ?? null;
}

// --- geometry simplification (Douglas-Peucker with a per-ring fallback) ---------------------

function perpendicularDistance([x, y], [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  return Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / Math.hypot(dx, dy);
}

function douglasPeucker(points, tolerance) {
  if (points.length < 3 || tolerance === 0) return points;
  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDistance) {
      maxDistance = d;
      index = i;
    }
  }
  if (maxDistance <= tolerance) return [points[0], points[points.length - 1]];
  const left = douglasPeucker(points.slice(0, index + 1), tolerance);
  const right = douglasPeucker(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

function roundPoint([x, y], tolerance) {
  const decimals = tolerance >= 0.01 ? 2 : tolerance >= 0.001 ? 3 : 4;
  const f = 10 ** decimals;
  return [Math.round(x * f) / f, Math.round(y * f) / f];
}

function simplifyRing(ring) {
  for (const tolerance of TOLERANCES) {
    const simplified = douglasPeucker(ring, tolerance)
      .map(p => (tolerance === 0 ? p : roundPoint(p, tolerance)))
      .filter((p, i, all) => i === 0 || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]);
    // A valid closed ring needs at least 4 positions (3 distinct + closing point).
    if (simplified.length >= 4) return simplified;
  }
  return ring;
}

function simplifyPolygon(rings) {
  const [outer, ...holes] = rings;
  return [simplifyRing(outer), ...holes.map(simplifyRing).filter(h => h.length >= 4)];
}

function simplifyGeometry(geometry) {
  if (geometry.type === 'Polygon') return { type: 'Polygon', coordinates: simplifyPolygon(geometry.coordinates) };
  if (geometry.type === 'MultiPolygon') {
    return { type: 'MultiPolygon', coordinates: geometry.coordinates.map(simplifyPolygon) };
  }
  throw new Error(`Unexpected geometry type ${geometry.type}`);
}

// --- build ---------------------------------------------------------------------------------

const world = JSON.parse(fs.readFileSync(input, 'utf8'));
const features = [];
const codes = new Set();

// Candidate (name -> code) claims, ranked: primary names beat secondary ones, then a country's
// home territory beats its outlying parts (HOMEPART = 1).
const claims = [];
const claim = (name, code, rank) => {
  if (typeof name !== 'string') return;
  const trimmed = name.trim();
  if (trimmed && trimmed !== '-99') claims.push({ name: trimmed, code, rank });
};

// English names from the runtime's ICU data. Also used to reject Natural Earth's non-ISO pseudo codes
// (e.g. "XD" for the UN buffer zone on the Golan Heights); "XK" (Kosovo) is known to ICU and kept.
const displayNames = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });

for (const feature of world.features) {
  const props = feature.properties;
  const code = featureCode(props);
  if (!code || !displayNames.of(code.toUpperCase())) continue;

  codes.add(code);
  features.push({
    type: 'Feature',
    properties: { code, name: props.NAME_EN || props.NAME },
    geometry: simplifyGeometry(feature.geometry),
  });

  const homeBonus = props.HOMEPART === 1 ? 0 : 1;
  for (const field of PRIMARY_NAME_FIELDS) claim(props[field], code, 0 + homeBonus);
  for (const field of SECONDARY_NAME_FIELDS) claim(props[field], code, 2 + homeBonus);
}

// ICU spells some countries differently from Natural Earth (e.g. "Myanmar (Burma)").
for (const code of codes) claim(displayNames.of(code.toUpperCase()), code, 0);

const nameToCode = new Map();
const conflicts = [];
for (const { name, code } of claims.sort((a, b) => a.rank - b.rank)) {
  const existing = nameToCode.get(name);
  if (!existing) nameToCode.set(name, code);
  else if (existing !== code) conflicts.push(`${name}: kept ${existing}, ignored ${code}`);
}

const geojsonPath = path.join(root, 'public', 'geojson', 'world.geojson');
fs.writeFileSync(geojsonPath, JSON.stringify({ type: 'FeatureCollection', features }));

const namesPath = path.join(root, 'components', 'map', 'countryNames.generated.ts');
const entries = [...nameToCode.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, code]) => `  ${JSON.stringify(name)}: '${code}',`);
fs.writeFileSync(
  namesPath,
  [
    '// Generated by scripts/build-country-data.mjs from Natural Earth. Do not edit by hand.',
    '',
    '/** Every Natural Earth / ICU name for a country or territory -> lowercase ISO 3166-1 alpha-2 code. */',
    'export const generatedCountryNameToCode: Record<string, string> = {',
    ...entries,
    '};',
    '',
    '/** Every country/territory code that has a shape in public/geojson/world.geojson. */',
    `export const mappedCountryCodes: readonly string[] = ${JSON.stringify([...codes].sort())};`,
    '',
  ].join('\n')
);

const kb = file => `${Math.round(fs.statSync(file).size / 1024)} KB`;
console.log(`world.geojson: ${features.length} features, ${codes.size} codes, ${kb(geojsonPath)}`);
console.log(`countryNames.generated.ts: ${nameToCode.size} names, ${kb(namesPath)}`);
const uniqueConflicts = [...new Set(conflicts)];
console.log(`Shared names resolved by rank (${uniqueConflicts.length}):\n  ${uniqueConflicts.join('\n  ')}`);
