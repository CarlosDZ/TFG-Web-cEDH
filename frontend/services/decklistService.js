export async function getPublicDecklists() {
    const res = await fetch("/api/decklist/");
    const data = await res.json();
    return data.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
}
