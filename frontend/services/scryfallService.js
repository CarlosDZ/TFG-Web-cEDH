const SCRYFALL_BASE = "https://api.scryfall.com";

export async function getCardByName(name) {
  const res = await fetch(
    `${SCRYFALL_BASE}/cards/named?fuzzy=${encodeURIComponent(name)}`,
  );
  if (!res.ok) {
    if (res.status === 404) throw new Error("Carta no encontrada");
    throw new Error("Error al contactar con Scryfall");
  }
  return await res.json();
}

export async function autocompleteCards(query) {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(
    `${SCRYFALL_BASE}/cards/autocomplete?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}
