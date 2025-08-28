// Convierte un sessionId (que puede tener -/_ etc.) a un PeerID seguro.
export function peerIdForSession(sessionId) {
  const cleaned = String(sessionId).replace(/[^A-Za-z0-9]/g, ""); // solo letras y números
  return cleaned.length ? `hc${cleaned}` : `hc${Math.random().toString(36).slice(2, 10)}`;
}
