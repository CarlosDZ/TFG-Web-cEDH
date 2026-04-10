export async function getCommanderTechs() {
  const res = await fetch("/api/commandertech/");
  const data = await res.json();
  return data.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
}

export async function getCommanderTech(id) {
  const res = await fetch(`/api/commandertech/${id}`);
  return await res.json();
}

export async function getCommanderTechComments(id) {
  const res = await fetch(`/api/commandertech/${id}/comments`);
  return await res.json();
}

export async function postCommanderTech(payload) {
  const res = await fetch("/api/commandertech/", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.json());
  return await res.json();
}

export async function toggleLike(id) {
  const res = await fetch(`/api/commandertech/${id}/like`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Error al procesar like");
  return await res.json();
}

export async function isLiked(id) {
  const res = await fetch(`/api/commandertech/${id}/isLiked`, {
    credentials: "include",
  });
  if (!res.ok) return { liked: false };
  return await res.json();
}

export async function commentOnTech(techId, markdown_text) {
  const res = await fetch(`/api/commandertech/${techId}/comment`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown_text }),
  });
  if (!res.ok) throw new Error("Error al comentar");
  return await res.json();
}
