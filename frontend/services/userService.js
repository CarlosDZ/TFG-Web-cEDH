const backend_url = import.meta.env.VITE_BACKEND_URL;

export async function searchUsuarios(query) {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(
    `${backend_url}/api/user/search?q=${encodeURIComponent(query)}`,
    { credentials: "include" },
  );
  if (!res.ok) return [];
  return await res.json();
}

export async function getUsuarioPorNombre(username) {
  const res = await fetch(
    `${backend_url}/api/user/username/${encodeURIComponent(username)}`,
    {
      credentials: "include",
    },
  );
  if (!res.ok) {
    if (res.status === 404) throw new Error("Usuario no encontrado");
    throw new Error("Error al cargar el perfil");
  }
  return await res.json();
}
