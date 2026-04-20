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

export async function getAllUsuarios(page = 1) {
  const res = await fetch(`${backend_url}/api/user?page=${page}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al cargar los usuarios");
  return await res.json();
}

export async function updateUsuario(id, data) {
  const res = await fetch(`${backend_url}/api/user/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "Error al actualizar el perfil");
    throw new Error(msg.replace(/^"|"$/g, ""));
  }
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
