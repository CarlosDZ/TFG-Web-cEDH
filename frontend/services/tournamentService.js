export async function getTournaments() {
  const res = await fetch("/api/tournament/");
  const data = await res.json();
  return data.sort(
    (a, b) =>
      new Date(a.tournament_date_hour) - new Date(b.tournament_date_hour),
  );
}

export async function getSavedTournaments() {
  const res = await fetch("/api/tournament/saved", { credentials: "include" });
  if (!res.ok) throw new Error("Error al obtener torneos guardados");
  return await res.json();
}

export async function getTournament(id) {
  const res = await fetch(`/api/tournament/${id}`);
  return await res.json();
}

export async function postTournament(payload) {
  const res = await fetch("/api/tournament/", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.json());
  return await res.json();
}

export async function toggleSave(id) {
  const res = await fetch(`/api/tournament/${id}/save`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al guardar torneo");
  return await res.json();
}

export async function patchTournament(id, payload) {
  const res = await fetch(`/api/tournament/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.json());
  return await res.json();
}

export async function getOrganizedTournaments() {
  const res = await fetch("/api/tournament/organized", { credentials: "include" });
  if (!res.ok) throw new Error("Sin acceso");
  return await res.json();
}

export async function joinTournament(id, payload) {
  const res = await fetch(`/api/tournament/${id}/join`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.json());
  return await res.json();
}

export async function getMyEntry(id) {
  const res = await fetch(`/api/tournament/${id}/my-entry`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function getEntries(tournamentId) {
  const res = await fetch(`/api/tournament/${tournamentId}/entries`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al cargar inscripciones");
  return await res.json();
}

export async function patchEntry(tournamentId, entryId, payload) {
  const res = await fetch(`/api/tournament/${tournamentId}/entries/${entryId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.json());
  return await res.json();
}

export async function cancelEntry(tournamentId, entryId) {
  const res = await fetch(`/api/tournament/${tournamentId}/entries/${entryId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al cancelar la inscripción");
  return await res.json();
}

export async function deleteTournament(id) {
  const res = await fetch(`/api/tournament/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al borrar torneo");
  return await res.json();
}
