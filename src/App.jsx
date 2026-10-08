import { useState, useEffect } from "react"
import BomDia    from "./components/BomDia"
import TelaCarga from "./components/TelaCarga"
import { api }   from "./services/api"
import "./index.css"

// Adapta resposta flat da API para estrutura volumes[] que o frontend espera
function adaptarVeiculos(apiRows) {
  return apiRows.map(v => ({
    ...v,
    volumes: [{
      volume_type:    "PRE-VENDA",
      planned_kg3:    v.planned_kg3  || 0,
      planned_kg5:    v.planned_kg5  || 0,
      planned_kg10:   v.planned_kg10 || 0,
      planned_kg20:   v.planned_kg20 || 0,
      planned_kg40:   v.planned_kg40 || 0,
      planned_kg50:   v.planned_kg50 || 0,
      planned_peso_kg: v.planned_peso_kg || 0,
      oc_number:       v.oc_number || null,
      oc_pending:      v.oc_pending || false,
    }]
  }))
}

export default function App() {
  const [tela, setTela]         = useState("bomdía")
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)

  const carregarVeiculos = () => {
    setLoading(true)
    api.getVeiculosHoje()
      .then(data => setVehicles(data?.length ? adaptarVeiculos(data) : []))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregarVeiculos() }, [])

  if (loading) return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:32 }}>🧊</div>
      <div style={{ fontSize:14, color:"#6b8f7a" }}>Carregando expedição...</div>
    </div>
  )

  if (tela === "bomdía") return (
    <BomDia
      totalCarros={vehicles.length}
      vehicles={vehicles}
      onStart={() => setTela("carga")}
    />
  )

  if (tela === "carga") return <TelaCarga vehicles={vehicles} api={api} onComplete={() => setTela("concluido")} />

  return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:20, padding:32, textAlign:"center" }}>
      <div style={{ fontSize:48 }}>✅</div>
      <div style={{ fontSize:22, fontWeight:600, color:"#1a2e22" }}>Turno concluído!</div>
      <div style={{ fontSize:14, color:"#6b8f7a" }}>Todos os carros foram carregados. Bom trabalho, Edinaldo!</div>
      <button
        onClick={() => { carregarVeiculos(); setTela("bomdía") }}
        style={{ marginTop:16, padding:"12px 28px", background:"#1a5c36", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer" }}
      >
        ↩ Novo turno
      </button>
    </div>
  )
}
