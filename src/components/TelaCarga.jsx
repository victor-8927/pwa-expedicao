import { useState, useEffect, useRef } from "react"
import styles from "./TelaCarga.module.css"
import BauCaminhao, { calcSimuCarga } from "./BauCaminhao"

const MOTIVOS_PULAR=[
  {value:"carro_ausente_patio",label:"Carro ausente no pátio"},
  {value:"mudanca_logistica",label:"Mudança na logística"},
  {value:"problema_mecanico",label:"Problema mecânico"},
  {value:"outro",label:"Outro motivo"},
]
function formatTimer(secs){const m=String(Math.floor(secs/60)).padStart(2,"0"),s=String(secs%60).padStart(2,"0");return`${m}:${s}`}
const VOL_COLORS={
  'PRE-VENDA':{bg:'#1a5c36',text:'#fff'},
  'TROCAS':{bg:'#b07800',text:'#fff'},
  'BONIFICAÇÃO':{bg:'#1558a8',text:'#fff'},
  'MANIFESTO':{bg:'#7a2d8c',text:'#fff'},
  'CONSIGNADA':{bg:'#b83030',text:'#fff'},
  'SALDO':{bg:'#4a6fa5',text:'#fff'},
}
function PaletesVisual({volumes}){
  if(!volumes||volumes.length===0)return null
  return(
    <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:10}}>
      {volumes.map((vol,i)=>{
        const cor=VOL_COLORS[vol.volume_type]||{bg:'#6b8f7a',text:'#fff'}
        const skus=[]
        if(vol.planned_kg3>0)skus.push(`${vol.planned_kg3} sc 3kg`)
        if(vol.planned_kg5>0)skus.push(`${vol.planned_kg5} sc 5kg`)
        if(vol.planned_kg10>0)skus.push(`${vol.planned_kg10} sc 10kg`)
        if(vol.planned_kg20>0)skus.push(`${vol.planned_kg20} sc 20kg`)
        if(vol.planned_kg40>0)skus.push(`${vol.planned_kg40} sc 40kg`)
        if(vol.planned_kg50>0)skus.push(`${vol.planned_kg50} sc 50kg`)
        return(
          <div key={i} style={{borderRadius:8,overflow:'hidden',border:`1.5px solid ${cor.bg}`}}>
            <div style={{background:cor.bg,color:cor.text,padding:'5px 10px',fontSize:11,fontWeight:700,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>{vol.volume_type}</span>
              {vol.oc_pending&&<span style={{background:'rgba(255,255,255,0.25)',borderRadius:4,padding:'1px 6px',fontSize:9,fontWeight:600}}>OC pendente</span>}
            </div>
            <div style={{padding:'6px 10px',background:'#fff',fontSize:11,color:'#1a2e22'}}>
              {skus.length>0?skus.join(' · '):<span style={{color:'#aac8b8'}}>Sem quantidade</span>}
              {vol.obs&&<div style={{fontSize:10,color:'#8aaa96',marginTop:3}}>Obs: {vol.obs}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default function TelaCarga({vehicles,onComplete,api}){
  const[idx,setIdx]=useState(0)
  const[fase,setFase]=useState("aguardando")
  const[secs,setSecs]=useState(0)
  const[paletes,setPaletes]=useState("")
  const[estrados,setEstrados]=useState("")
  const[lote,setLote]=useState("")
  const[lotes,setLotes]=useState([])
  const[showPular,setShowPular]=useState(false)
  const[motivoPular,setMotivoPular]=useState("")
  const[motivoLivre,setMotivoLivre]=useState("")
  const[showFinalizar,setShowFinalizar]=useState(false)
  const[paletesZero,setPaletesZero]=useState(false)
  const[lotesVazio,setLotesVazio]=useState(false)
  const[erro,setErro]=useState("")
  const[pulados,setPulados]=useState([])
  const[showBau,setShowBau]=useState(true)
  const timerRef=useRef(null)
  const loteRef=useRef(null)
  const vehicle=vehicles[idx]
  useEffect(()=>{
    if(fase==="em_carga"){timerRef.current=setInterval(()=>setSecs(s=>s+1),1000)}
    else clearInterval(timerRef.current)
    return()=>clearInterval(timerRef.current)
  },[fase])
  useEffect(()=>{setFase("aguardando");setSecs(0);setPaletes("");setEstrados("");setLotes([]);setLote("");setErro("");setShowBau(true)},[idx])
  if(!vehicle)return null
  const volumes=vehicle.volumes||[]
  const totals=volumes.reduce((acc,v)=>{acc.kg3+=v.planned_kg3||0;acc.kg5+=v.planned_kg5||0;acc.kg10+=v.planned_kg10||0;acc.kg20+=v.planned_kg20||0;acc.kg40+=v.planned_kg40||0;acc.kg50+=v.planned_kg50||0;return acc},{kg3:0,kg5:0,kg10:0,kg20:0,kg40:0,kg50:0})
  const simuPlan=calcSimuCarga(volumes,vehicle.vda,vehicle.vehicle_type)
  const handleIniciar=async()=>{try{await api.iniciarCarga(vehicle.id)}catch{}setFase("em_carga")}
  const handleAddLote=()=>{if(!lote.trim())return;setLotes(prev=>[...prev,lote.trim()]);setLote("");loteRef.current?.focus()}
  const handleFinalizar=async()=>{
    const palNum=parseInt(paletes)||0
    if(palNum===0&&!paletesZero){setErro("Confirme que não colocou paletes.");return}
    if(lotes.length===0&&!lotesVazio){setErro("Informe pelo menos um lote.");return}
    setErro("")
    try{await api.finalizarCarga(vehicle.id,{paletes:palNum,estrados:parseInt(estrados)||0,lotes,paletesConfirmadoZero:paletesZero,lotesConfirmadoVazio:lotesVazio})}catch{}
    setShowFinalizar(false);setFase("finalizado")
    setTimeout(()=>{const next=idx+1;if(next<vehicles.length)setIdx(next);else if(pulados.length>0){const[primeiro,...resto]=pulados;setPulados(resto);setIdx(vehicles.findIndex(v=>v.id===primeiro))}else onComplete()},2000)
  }
  const handlePular=async()=>{
    if(!motivoPular){setErro("Selecione um motivo.");return}
    try{await api.pularCarro(vehicle.id,motivoPular,motivoLivre)}catch{}
    setPulados(prev=>[...prev,vehicle.id]);setShowPular(false);setMotivoPular("");setMotivoLivre("")
    const next=idx+1;if(next<vehicles.length)setIdx(next);else onComplete()
  }
  return(
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.headerTop}><span className={styles.logo}>EXPEDIÇÃO</span><span className={styles.seq}>{idx+1}º de {vehicles.length}</span></div>
        <div className={styles.fila}>{vehicles.map((v,i)=>(<span key={v.id} className={`${styles.filaChip} ${i===idx?styles.filaAtual:i<idx?styles.filaDone:""}`}>{v.vda}</span>))}</div>
      </div>
      <div className={styles.vdaCard}>
        <div className={styles.vdaHead}><div><div className={styles.vdaNome}>{vehicle.vda}</div><div className={styles.vdaMeta}>{vehicle.rota} · {vehicle.vehicle_type} · {vehicle.motorista_name}</div></div></div>
        <PaletesVisual volumes={volumes}/>
        <div className={styles.totais}>
          {totals.kg3>0&&<span><b>{totals.kg3}</b> 3kg</span>}
          {totals.kg5>0&&<span><b>{totals.kg5}</b> 5kg</span>}
          {totals.kg10>0&&<span><b>{totals.kg10}</b> 10kg</span>}
          {totals.kg20>0&&<span><b>{totals.kg20}</b> 20kg</span>}
          {totals.kg40>0&&<span><b>{totals.kg40}</b> 40kg</span>}
          {totals.kg50>0&&<span><b>{totals.kg50}</b> 50kg</span>}
        </div>
      </div>
      <div style={{background:'#fff',border:'1.5px solid #cde0d5',borderRadius:12,margin:'0 0 12px',overflow:'hidden'}}>
        <button onClick={()=>setShowBau(b=>!b)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'#f5faf7',border:'none',cursor:'pointer',fontSize:12,fontWeight:700,color:'#1a2e22'}}>
          <span>🚛 Plano de carga — {simuPlan.totalP}/{simuPlan.maxP} pallets · {simuPlan.pct}% ocupação</span>
          <span style={{fontSize:14,color:'#6b8f7a'}}>{showBau?'▲':'▼'}</span>
        </button>
        {showBau&&<div style={{padding:'12px 14px'}}><BauCaminhao plan={simuPlan} vdaLabel={vehicle.vda||''} tipo={simuPlan.tipo||vehicle.vehicle_type||''}/></div>}
      </div>
      {fase==="em_carga"&&(<div className={styles.timer}><div className={styles.timerVal}>{formatTimer(secs)}</div><div className={styles.timerLabel}>em carregamento</div></div>)}
      {fase==="em_carga"&&(
        <div className={styles.campos}>
          <div className={styles.camposGrid}>
            <div className={styles.campo}><label className={styles.campoLabel}>PALETES</label><input type="number" inputMode="numeric" className={styles.campoInput} value={paletes} onChange={e=>setPaletes(e.target.value)} placeholder="0"/></div>
            <div className={styles.campo}><label className={styles.campoLabel}>ESTRADOS</label><input type="number" inputMode="numeric" className={styles.campoInput} value={estrados} onChange={e=>setEstrados(e.target.value)} placeholder="0"/></div>
          </div>
          <div className={styles.campoLabel}>LOTES CARREGADOS</div>
          <div className={styles.loteChips}>{lotes.map((l,i)=>(<div key={i} className={styles.loteChip}>{l}<button onClick={()=>setLotes(prev=>prev.filter((_,j)=>j!==i))}>×</button></div>))}</div>
          <div className={styles.loteRow}><input ref={loteRef} type="text" className={styles.loteInput} value={lote} onChange={e=>setLote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddLote()} placeholder="ex: L-2409"/><button className={styles.loteBtn} onClick={handleAddLote}>+ Adicionar</button></div>
        </div>
      )}
      {erro&&<div className={styles.erro}>{erro}</div>}
      <div className={styles.actions}>
        {fase==="aguardando"&&(<><button className={styles.btnPular} onClick={()=>setShowPular(true)}>Pular</button><button className={styles.btnIniciar} onClick={handleIniciar}>▶ Iniciar carga</button></>)}
        {fase==="em_carga"&&(<><button className={styles.btnPular} onClick={()=>setShowPular(true)}>Pular</button><button className={styles.btnFinalizar} onClick={()=>setShowFinalizar(true)}>✓ Finalizar carga</button></>)}
        {fase==="finalizado"&&<div className={styles.finMsg}>✅ {vehicle.vda} carregado — Asistente notificado</div>}
      </div>
      {showPular&&(<div className={styles.overlay}><div className={styles.modal}><div className={styles.modalTitle}>Pular {vehicle.vda}?</div><div className={styles.modalSub}>O carro volta ao final da fila quando disponível.</div>{MOTIVOS_PULAR.map(m=>(<div key={m.value} className={`${styles.opt} ${motivoPular===m.value?styles.optSel:""}`} onClick={()=>setMotivoPular(m.value)}><div className={styles.radio}/><span>{m.label}</span></div>))}{motivoPular==="outro"&&<textarea className={styles.textarea} placeholder="Descreva o motivo..." value={motivoLivre} onChange={e=>setMotivoLivre(e.target.value)} rows={3}/>}{erro&&<div className={styles.erro}>{erro}</div>}<div className={styles.modalBtns}><button className={styles.btnCancel} onClick={()=>{setShowPular(false);setErro("")}}>Cancelar</button><button className={styles.btnConfirm} onClick={handlePular}>Confirmar</button></div></div></div>)}
      {showFinalizar&&(<div className={styles.overlay}><div className={styles.modal}><div className={styles.modalTitle}>Finalizar {vehicle.vda}?</div><div className={styles.modalSub}>Duração: {formatTimer(secs)}</div><div className={styles.resumo}><div className={styles.resumoRow}><span>Paletes</span><strong>{parseInt(paletes)||0}</strong></div><div className={styles.resumoRow}><span>Estrados</span><strong>{parseInt(estrados)||0}</strong></div><div className={styles.resumoRow}><span>Lotes</span><strong>{lotes.length===0?"—":lotes.join(", ")}</strong></div></div>{(parseInt(paletes)||0)===0&&<label className={styles.check}><input type="checkbox" checked={paletesZero} onChange={e=>setPaletesZero(e.target.checked)}/>Confirmo que não colocou paletes</label>}{lotes.length===0&&<label className={styles.check}><input type="checkbox" checked={lotesVazio} onChange={e=>setLotesVazio(e.target.checked)}/>Confirmo que não há lotes a registrar</label>}{erro&&<div className={styles.erro}>{erro}</div>}<div className={styles.modalBtns}><button className={styles.btnCancel} onClick={()=>{setShowFinalizar(false);setErro("")}}>Voltar</button><button className={styles.btnConfirm} onClick={handleFinalizar}>✓ Confirmar</button></div></div></div>)}
    </div>
  )
}