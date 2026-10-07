import { useState, useEffect, useRef } from "react"
import BomDia    from "./components/BomDia"
import TelaCarga from "./components/TelaCarga"
import { api }   from "./services/api"
import "./index.css"

const MOCK_VEHICLES = [
  { id:"v1", sequence:1, rota:"ROTA 802", vda:"VDA 80", vehicle_type:"toco", capacity_kg:8800, motorista_name:"Jean Pinto", state:"aguardando_carga", volumes:[{ volume_type:"PRE-VENDA", planned_kg5:0, planned_kg10:0, planned_kg20:70, planned_kg40:183, planned_peso_kg:9845, oc_number:null, oc_pending:true }] },
  { id:"v2", sequence:2, rota:"ROTA 805", vda:"VDA 81", vehicle_type:"toco", capacity_kg:8800, motorista_name:"Mirian",     state:"aguardando_carga", volumes:[{ volume_type:"PRE-VENDA", planned_kg5:16, planned_kg10:31, planned_kg20:53, planned_kg40:157, planned_peso_kg:8721, oc_number:null, oc_pending:true }] },
  { id:"v3", sequence:3, rota:"ROTA APOIO", vda:"VDA 46", vehicle_type:"truncado", capacity_kg:16000, motorista_name:"Wallace", state:"aguardando_carga", volumes:[{ volume_type:"PRE-VENDA", planned_kg5:0, planned_kg10:0, planned_kg20:80, planned_kg40:220, planned_peso_kg:11740, oc_number:29278, oc_pending:false }] },
]

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
      planned_peso_kg: 0,
      oc_number:      null,
      oc_pending:     false,
    }]
  }))
}

export default function App() {
  const [tela, setTela]                 = useState("bomdía")
  const [vehicles, setVehicles]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [importando, setImportando]     = useState(false)
  const [importStatus, setImportStatus] = useState(null) // {ok, msg}
  const fileRef = useRef(null)

  const carregarVeiculos = () => {
    setLoading(true)
    api.getVeiculosHoje()
      .then(data => setVehicles(data?.length ? adaptarVeiculos(data) : MOCK_VEHICLES))
      .catch(() => setVehicles(MOCK_VEHICLES))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregarVeiculos() }, [])

  const handleImportarExcel = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true)
    setImportStatus(null)
    try {
      const result = await api.importarProgramacao(file)
      setImportStatus({
        ok: true,
        msg: `✅ Programação importada: ${result.updated + result.created} veículos atualizados`
      })
      // Recarrega os veículos com os novos dados de SKU
      carregarVeiculos()
    } catch (err) {
      setImportStatus({ ok: false, msg: `❌ Erro: ${err.message}` })
    } finally {
      setImportando(false)
      // Limpa o input para permitir reimportar o mesmo arquivo
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  if (loading) return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:32 }}>🧊</div>
      <div style={{ fontSize:14, color:"#6b8f7a" }}>Carregando expedição...</div>
    </div>
  )

  if (tela === "bomdía") return (
    <>
      <BomDia
        totalCarros={vehicles.length}
        vehicles={vehicles}
        onStart={() => setTela("carga")}
        importando={importando}
        importStatus={importStatus}
        onImportarExcel={() => fileRef.current?.click()}
      />
      {/* Input oculto para upload do Excel de programação */}
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display:"none" }}
        onChange={handleImportarExcel}
      />
    </>
  )

  if (tela === "carga") return <TelaCarga vehicles={vehicles} api={api} onComplete={() => setTela("concluido")} />

  return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:20, padding:32, textAlign:"center" }}>
      <div style={{ fontSize:48 }}>✅</div>
      <div style={{ fontSize:22, fontWeight:600, color:"#1a2e22" }}>Turno concluído!</div>
      <div style={{ fontSize:14, color:"#6b8f7a" }}>Todos os carros foram carregados. Bom trabalho, Edinaldo!</div>
    </div>
  )
}
