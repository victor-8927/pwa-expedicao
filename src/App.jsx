import { useState, useEffect } from "react"
import { api } from "./services/api"
import TelaCarga from "./components/TelaCarga"

export default function App() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getVeiculosHoje()
      .then(setVehicles)
      .catch((err) => {
        console.error("Erro ao carregar veículos:", err)
        setError(err.message)
        setVehicles([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", fontSize:24, background:"#f8f9fa" }}>
      Carregando...
    </div>
  )

  if (error) return (
    <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", height:"100vh", gap:16, background:"#fff3f3", padding:24 }}>
      <div style={{ fontSize:20, color:"#c0392b", fontWeight:"bold" }}>Erro ao conectar</div>
      <div style={{ fontSize:14, color:"#666", textAlign:"center" }}>{error}</div>
      <button onClick={() => window.location.reload()} style={{ padding:"10px 24px", background:"#2c3e50", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:16 }}>
        Tentar novamente
      </button>
    </div>
  )

  if (vehicles.length === 0) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", fontSize:18, color:"#888", background:"#f8f9fa" }}>
      Nenhum veículo programado para hoje.
    </div>
  )

  return <TelaCarga vehicles={vehicles} api={api} />
}
