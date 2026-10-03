import styles from "./BomDia.module.css"

export default function BomDia({ totalCarros, vehicles, onStart }) {
  const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  const data = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })

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
      <div className={styles.fila}>
        {vehicles.map((v, i) => (
          <div key={v.id} className={styles.filaItem}>
            <div className={styles.filaSeq}>{i + 1}º</div>
            <div className={styles.filaVda}>{v.vda}</div>
            <div className={styles.filaRota}>{v.rota} · {v.motorista_name}</div>
          </div>
        ))}
      </div>

      <button className={styles.btnStart} onClick={onStart}>
        ▶ Iniciar turno
      </button>
    </div>
  )
}
