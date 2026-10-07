import styles from "./BomDia.module.css"

export default function BomDia({ totalCarros, vehicles, onStart, importando, importStatus, onImportarExcel }) {
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

      {/* Botão de importação da programação Excel — para Victor Analista */}
      <div style={{ padding: "0 0 8px" }}>
        <button
          onClick={onImportarExcel}
          disabled={importando}
          style={{
            width: "100%",
            padding: "11px 16px",
            background: importando ? "#dce8e2" : "#f0f8f4",
            border: "1.5px dashed #8aaa96",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: importando ? "#6b8f7a" : "#1a5c36",
            cursor: importando ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>📋</span>
          {importando ? "Importando programação..." : "Importar Programação Excel"}
        </button>

        {importStatus && (
          <div style={{
            marginTop: 6,
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: importStatus.ok ? "#f0fff4" : "#fff0f0",
            color: importStatus.ok ? "#1a7040" : "#b83030",
            border: `1px solid ${importStatus.ok ? "#a0d8b4" : "#f4a0a0"}`,
          }}>
            {importStatus.msg}
          </div>
        )}
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
