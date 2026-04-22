export async function getPublicDecklists() {
  const res = await fetch("/api/decklist/");
  const data = await res.json();
  return data.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
}

export async function getDeck(id) {
  const res = await fetch(`/api/decklist/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Decklist no encontrada");
  return res.json();
}

export async function getDeckComments(id) {
  const res = await fetch(`/api/decklist/${id}/comments`);
  if (!res.ok) return [];
  return res.json();
}

export async function isDeckLiked(id) {
  const res = await fetch(`/api/decklist/${id}/isLiked`, {
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.liked;
}

export async function getDecklistsByUser(userId) {
  const res = await fetch(`/api/decklist/user/${userId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function refreshDeckImages(id) {
  const res = await fetch(`/api/decklist/${id}/refresh-images`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Error al obtener imágenes");
  return res.json();
}

export async function toggleDeckLike(id) {
  const res = await fetch(`/api/decklist/${id}/like`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al hacer like");
  return res.json();
}
