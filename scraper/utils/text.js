/** Lowercases and strips punctuation so locations can be compared loosely. */
export function normalizeLocation(loc) {
  if (!loc) return "";
  return loc.toLowerCase().replace(/['’]/g, "").replace(/[^\w\s]/g, "").trim();
}

/** "Toronto, Ontario / Mississauga, Ontario" -> "Toronto, Ontario" */
export function getPrimaryCity(loc) {
  if (!loc) return "";
  return loc.split('/')[0].trim();
}

/** True when two location strings refer to the same primary city. */
export function isSameCity(locA, locB) {
  return normalizeLocation(getPrimaryCity(locA)) === normalizeLocation(getPrimaryCity(locB));
}

/** Safely normalizes null string representations from LLMs. */
export function cleanSummary(val) {
  if (!val) return null;
  if (typeof val === 'string' && val.trim().toLowerCase() === 'null') return null;
  return val;
}
