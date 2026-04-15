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
    `${backend_url}/api/commandertech/search?q=${encodeURIComponent(q)}`,
    { credentials: "include" },
  );
  if (!res.ok) return [];
  return await res.json();
}
