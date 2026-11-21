const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Búsqueda sin distinguir mayúsculas ni tildes en varios campos. */
export function matchesSearch(query: string, fields: (string | null | undefined)[]): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return fields.some((f) => (f ? normalize(f).includes(q) : false));
}
