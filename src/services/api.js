const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api"

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getVeiculosHoje: () => {
    const today = new Date().toISOString().slice(0, 10)
    return request("GET", `/plans/${today}/vehicles`)
  },

  iniciarCarga: (vehicleId) =>
    request("POST", `/vehicles/${vehicleId}/carga-inicio`, {
      actorName: "Edinaldo Palmas",
    }),

  finalizarCarga: (vehicleId, data) =>
    request("POST", `/vehicles/${vehicleId}/carga-fim`, {
      actorName: "Edinaldo Palmas",
      ...data,
    }),

  pularCarro: (vehicleId, motivo, motivoLivre) =>
    request("POST", `/vehicles/${vehicleId}/pular`, {
      actorName: "Edinaldo Palmas",
      motivo,
      motivo_livre: motivoLivre,
    }),
}
