const backend_url = import.meta.env.VITE_BACKEND_URL;

export async function searchDiscusiones(q) {
  if (!q || q.trim().length < 2) return [];
  const res = await fetch(
    `${backend_url}/api/comment/search?q=${encodeURIComponent(q)}`,
    { credentials: "include" },
  );
  if (!res.ok) return [];
  return await res.json();
}

export async function searchDecks(q, by = "title") {
  if (!q || q.trim().length < 2) return [];
  const res = await fetch(
    `${backend_url}/api/decklist/search?q=${encodeURIComponent(q)}&by=${by}`,
    { credentials: "include" },
  );
  if (!res.ok) return [];
  return await res.json();
}

export async function searchTechs(q) {
  if (!q || q.trim().length < 2) return [];
  const res = await fetch(
    `${backend_url}/api/commandertech/search?title=${encodeURIComponent(q)}`,
    { credentials: "include" },
  );
  if (!res.ok) return [];
  return await res.json();
}

export async function searchTechsFiltered({ title = "", cards = [] } = {}) {
  const hasTitle = title.trim().length >= 2;
  if (!hasTitle && cards.length === 0) return [];
  const params = new URLSearchParams();
  if (hasTitle) params.set("title", title.trim());
  cards.forEach((c) => params.append("cards", c));
  const res = await fetch(`${backend_url}/api/commandertech/search?${params}`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  return await res.json();
}
