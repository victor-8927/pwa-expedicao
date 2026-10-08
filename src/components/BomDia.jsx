import styles from "./BomDia.module.css"

function calcPesoTotal(volumes) {
  return volumes.reduce((acc, vol) => acc
    + (vol.planned_kg3  || 0) *  3
    + (vol.planned_kg5  || 0) *  5
    + (vol.planned_kg10 || 0) * 10
    + (vol.planned_kg20 || 0) * 20
    + (vol.planned_kg40 || 0) * 40
    + (vol.planned_kg50 || 0) * 50
  , 0)
}

function SkuLine({ volumes }) {
  const skus = []
  volumes.forEach(vol => {
    if (vol.planned_kg3  > 0) skus.push(`${vol.planned_kg3}×3kg`)
    if (vol.planned_kg5  > 0) skus.push(`${vol.planned_kg5}×5kg`)
    if (vol.planned_kg10 > 0) skus.push(`${vol.planned_kg10}×10kg`)
    if (vol.planned_kg20 > 0) skus.push(`${vol.planned_kg20}×20kg`)
    if (vol.planned_kg40 > 0) skus.push(`${vol.planned_kg40}×40kg`)
    if (vol.planned_kg50 > 0) skus.push(`${vol.planned_kg50}×50kg`)
  })
  const peso = calcPesoTotal(volumes)
  return (
    <div style={{ fontSize:11, color:"#4a6b58", marginTop:2, lineHeight:1.4 }}>
      {skus.length > 0
        ? <>{skus.join(" · ")} <span style={{ color:"#8aaa96" }}>({(peso/1000).toFixed(1)} t)</span></>
        : <span style={{ color:"#b0c8bc", fontStyle:"italic" }}>Aguardando programação</span>
      }
    </div>
  )
}

export default function BomDia({ totalCarros, vehicles, onStart }) {
  const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  const data = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
  const semDados = vehicles.length === 0

  return (
    <div className={styles.screen}>
      <div className={styles.top}>
        <div className={styles.logo}>GELOCRIM · EXPEDIÇÃO</div>
        <div className={styles.hora}>{hora}</div>
        <div className={styles.data}>{data}</div>
      </div>

      <div className={styles.card}>
        <div className={styles.greeting}>Bom dia, <strong>Edinaldo!</strong></div>
        <div className={styles.msg}>Bora começar nosso carregamento. Hoje temos {totalCarros} carros para carregar!</div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statNum}>{totalCarros}</div>
          <div className={styles.statLabel}>carros hoje</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>07:30</div>
          <div className={styles.statLabel}>meta de saída</div>
        </div>
      </div>

      <div className={styles.filaLabel}>SEQUÊNCIA DE HOJE</div>
      {semDados ? (
        <div style={{ padding:"24px 16px", textAlign:"center", color:"#4a6b58", fontSize:14 }}>
          Programação ainda não carregada.<br />
          <span style={{ fontSize:12, color:"#3a5a48" }}>Aguarde Victor enviar a programação do dia.</span>
        </div>
      ) : (
        <div className={styles.fila}>
          {vehicles.map((v, i) => (
            <div key={v.id} className={styles.filaItem}>
              <div className={styles.filaSeq}>{i + 1}º</div>
              <div>
                <div className={styles.filaVda}>{v.vda}</div>
                <div className={styles.filaRota}>{v.rota} · {v.motorista_name}</div>
                <SkuLine volumes={v.volumes || []} />
              </div>
            </div>
          ))}
        </div>
      )}

      <button className={styles.btnStart} onClick={onStart} disabled={semDados}
        style={semDados ? { opacity: 0.4, cursor: "not-allowed" } : {}}>
        ▶ Iniciar turno
      </button>
    </div>
  )
}
