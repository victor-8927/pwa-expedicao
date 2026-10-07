const FLEET={
  '66':{tipo:'Truncado',maxKg:16000,cols:6,rows:2},
  '94':{tipo:'Truncado',maxKg:16000,cols:6,rows:2},
  '90':{tipo:'Truncado',maxKg:16000,cols:6,rows:2},
  '47':{tipo:'Truncado',maxKg:16000,cols:6,rows:2},
  '46':{tipo:'Truncado',maxKg:16000,cols:5,rows:2},
  '70':{tipo:'Toco',maxKg:8800,cols:5,rows:2},
  '80':{tipo:'Toco',maxKg:8800,cols:5,rows:2},
  '81':{tipo:'Toco',maxKg:8800,cols:5,rows:2},
  '1':{tipo:'Toco',maxKg:8800,cols:5,rows:2},
  '2':{tipo:'Toco',maxKg:8800,cols:5,rows:2},
  '3':{tipo:'Toco',maxKg:8800,cols:5,rows:2},
  'ACCELO':{tipo:'3/4',maxKg:5000,cols:2,rows:2},
  '59':{tipo:'Container 20 pes',maxKg:12000,cols:2,rows:2},
}
const SKU_CFG={
  kg3:{sacos:240,kg:3.2,cor:'#20639b',label:'GELO 3KG'},
  kg5:{sacos:180,kg:6,cor:'#1558a8',label:'GELO 5KG'},
  kg10:{sacos:110,kg:11,cor:'#a07000',label:'GELO 10KG'},
  kg20:{sacos:50,kg:23,cor:'#1a7040',label:'GELO 20KG'},
  kg40:{sacos:27,kg:45,cor:'#b83030',label:'GELO 40KG'},
  kg50:{sacos:20,kg:53,cor:'#7a2d8c',label:'GELO 50KG'},
}
const PROM=0.60
function extractVdaNum(v){if(!v)return null;const s=String(v).toUpperCase().trim();if(s.includes('ACCELO')||s.includes('ACELO'))return'ACCELO';const m=s.match(/\d+/);return m?String(parseInt(m[0])):null}
function getTruckConfig(v,t){
  const n=extractVdaNum(v)
  if(n&&FLEET[n])return FLEET[n]
  const tt=(t||'').toLowerCase()
  if(tt.includes('truncado')||tt.includes('truck'))return{tipo:'Truncado',maxKg:16000,cols:6,rows:2}
  if(tt.includes('toco'))return{tipo:'Toco',maxKg:8800,cols:5,rows:2}
  if(tt.includes('container')||tt.includes('conte'))return{tipo:'Container',maxKg:12000,cols:2,rows:2}
  if(tt.includes('3/4')||tt.includes('accelo')||tt.includes('34'))return{tipo:'3/4',maxKg:5000,cols:2,rows:2}
  return{tipo:'Toco',maxKg:6685,cols:5,rows:2}
}
export function calcSimuCarga(volumes,vdaStr,vehicleType){
  const trk=getTruckConfig(vdaStr,vehicleType)
  const maxP=trk.cols*trk.rows
  const qty={kg3:0,kg5:0,kg10:0,kg20:0,kg40:0,kg50:0}
  for(const vol of(volumes||[])){qty.kg3+=Number(vol.planned_kg3)||0;qty.kg5+=Number(vol.planned_kg5)||0;qty.kg10+=Number(vol.planned_kg10)||0;qty.kg20+=Number(vol.planned_kg20)||0;qty.kg40+=Number(vol.planned_kg40)||0;qty.kg50+=Number(vol.planned_kg50)||0}
  const ord=['kg40','kg50','kg20','kg10','kg5','kg3']
  const full={},bat={}
  let totalP=0
  for(const s of ord){const q=qty[s]||0;full[s]=Math.floor(q/SKU_CFG[s].sacos);bat[s]=q%SKU_CFG[s].sacos;totalP+=full[s]}
  let usedP=totalP
  const promoted={}
  for(const s of ord){if(!bat[s])continue;const fp=bat[s]/SKU_CFG[s].sacos;if(fp>=PROM){const hasBatOthers=ord.filter(x=>x!==s).some(x=>bat[x]>0);const needed=usedP+1+(hasBatOthers?1:0);if(needed<=maxP){promoted[s]={sacos:bat[s],fillPct:Math.round(fp*100),faltam:SKU_CFG[s].sacos-bat[s]};bat[s]=0;usedP++}}}
  const hasBat=Object.values(bat).some(v=>v>0)
  if(hasBat)usedP++
  totalP=usedP
  const ordered=[]
  for(const s of ord){for(let i=0;i<full[s];i++)ordered.push({tipo:s,sacos:SKU_CFG[s].sacos,kg:SKU_CFG[s].sacos*SKU_CFG[s].kg,cor:SKU_CFG[s].cor,label:SKU_CFG[s].label})}
  for(const s of ord){if(!promoted[s])continue;const d=promoted[s];ordered.push({tipo:'PROM',base:s,sacos:d.sacos,kg:d.sacos*SKU_CFG[s].kg,cor:'#b07800',label:SKU_CFG[s].label+' PROM.',fillPct:d.fillPct,faltam:d.faltam})}
  if(hasBat){const det=ord.filter(s=>bat[s]>0).map(s=>`${bat[s]}sc ${s}`).join(' + ');const kgB=ord.reduce((a,s)=>a+bat[s]*SKU_CFG[s].kg,0);const scB=ord.reduce((a,s)=>a+bat[s],0);ordered.push({tipo:'BAT',sacos:scB,kg:kgB,cor:'#5a28b0',label:'BATIDO',det,batMap:{...bat}})}
  const grid=new Array(maxP).fill(null)
  const batPal=ordered.filter(p=>p.tipo==='BAT')
  const restPals=ordered.filter(p=>p.tipo!=='BAT')
  const lptSorted=[...restPals].sort((a,b)=>b.kg-a.kg)
  let kgSimL=0,kgSimR=0
  for(const pal of lptSorted){if(kgSimL<=kgSimR)kgSimL+=pal.kg;else kgSimR+=pal.kg}
  const batRow=batPal.length>0?(kgSimL<=kgSimR?0:1):-1
  let kgLeft=batRow===0?(batPal[0]?.kg||0):0,kgRight=batRow===1?(batPal[0]?.kg||0):0
  const leftPals=[],rightPals=[]
  for(const pal of lptSorted){if(kgLeft<=kgRight){leftPals.push(pal);kgLeft+=pal.kg}else{rightPals.push(pal);kgRight+=pal.kg}}
  let li=0,ri=0,seqN=0
  for(let col=0;col<trk.cols&&(li<leftPals.length||ri<rightPals.length);col++){const hasL=li<leftPals.length,hasR=ri<rightPals.length;if(hasL&&hasR){grid[0*trk.cols+col]={...leftPals[li++],seq:++seqN};grid[1*trk.cols+col]={...rightPals[ri++],seq:++seqN}}else{const pal=hasL?leftPals[li++]:rightPals[ri++];grid[0*trk.cols+col]={...pal,seq:++seqN,centered:true}}}
  for(const pal of batPal){let placed=false;for(let col=0;col<trk.cols&&!placed;col++){const rp=batRow>=0?batRow:(kgLeft<=kgRight?0:1),ra=1-rp;for(const row of[rp,ra]){const gi=row*trk.cols+col;if(!grid[gi]){grid[gi]={...pal,seq:++seqN};if(row===0)kgLeft+=pal.kg;else kgRight+=pal.kg;const o=(1-row)*trk.cols+col;if(grid[o]?.centered)grid[o]={...grid[o],centered:false};placed=true;break}}}}
  const totalKg=ordered.reduce((a,p)=>a+p.kg,0)
  const pct=maxP>0?Math.round((totalP/maxP)*100):0
  const kgTS=kgLeft+kgRight||1
  const pctLeft=Math.round(kgLeft/kgTS*100),pctRight=100-pctLeft
  const sideOk=pctLeft>=35&&pctLeft<=65
  const acao=pct>=80?'Bem aproveitada':pct>=50?'Verificar complemento':'Baixo aproveitamento'
  return{grid,cols:trk.cols,rows:trk.rows,totalP,maxP,totalKg,maxKg:trk.maxKg,tipo:trk.tipo,pct,acao,kgLeft,kgRight,pctLeft,pctRight,sideOk,overPallets:totalP>maxP,overWeight:totalKg>trk.maxKg,ordered,promoted,hasPromo:Object.keys(promoted).length>0,bat,hasBat,qty}
}
export default function BauCaminhao({plan,vdaLabel,tipo}){
  if(!plan)return null
  const{grid,cols,rows,totalP,maxP,pct,acao,kgLeft,kgRight,pctLeft,pctRight,sideOk,overPallets,overWeight,totalKg,maxKg,hasPromo,promoted,hasBat,ordered}=plan
  const PW=66,PH=66,GAP=4,PAD=8,CAB=42
  const bW=cols*(PW+GAP)+GAP+PAD*2,bH=rows*(PH+GAP)+GAP+PAD*2
  const W=CAB+bW+6,H=bH+20
  const centeredCols=new Set()
  for(let col=0;col<cols;col++){if(grid[0*cols+col]?.centered)centeredCols.add(col)}
  const aprovClr=overWeight||overPallets?'#b83030':pct>=80?'#1a7040':pct>=50?'#b07800':'#b83030'
  return(
    <div style={{fontFamily:'system-ui,sans-serif'}}>
      <div style={{overflowX:'auto',paddingBottom:4}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{display:'block',minWidth:W}}>
          <g transform="translate(0,4)">
            <rect x="2" y="4" width={CAB-6} height={bH-8} rx="5" fill="#dce8e2" stroke="#b8d4c4" strokeWidth="1"/>
            <rect x="5" y="6" width={CAB-13} height={bH*0.25} rx="2" fill="#c2d8cc"/>
            <rect x="0" y="6" width="5" height="4" rx="1" fill="#8aaa96"/>
            <rect x="0" y={bH-10} width="5" height="4" rx="1" fill="#8aaa96"/>
            <rect x="4" y={bH-7} width="14" height="5" rx="2" fill="#1a2e22"/>
            <text x={CAB/2-2} y={bH/2+4} fill="#6b8f7a" fontSize="7" textAnchor="middle" fontWeight="700">CAB.</text>
          </g>
          <g transform={`translate(${CAB},4)`}>
            <rect x="0" y="0" width={bW} height={bH} rx="5" fill="#f5f9f7" stroke="#b8d4c4" strokeWidth="1.5"/>
            <rect x={bW-4} y={bH*0.3} width="3" height={bH*0.4} rx="1" fill="#8aaa96"/>
            <rect x="4" y={bH-6} width="14" height="5" rx="2" fill="#1a2e22"/>
            <rect x={bW-18} y={bH-6} width="14" height="5" rx="2" fill="#1a2e22"/>
            <text x={PAD+GAP+2} y={bH-8} fill="#aac8b8" fontSize="6.5" fontWeight="700">FUNDO</text>
            <text x={bW-PAD-GAP-2} y={bH-8} fill="#aac8b8" fontSize="6.5" fontWeight="700" textAnchor="end">PORTA</text>
            {Array.from({length:rows},(_,row)=>Array.from({length:cols},(_,col)=>{
              if(centeredCols.has(col)&&row===1)return null
              const gi=row*cols+col,pl=grid[gi]
              const px=PAD+col*(PW+GAP)+GAP
              const py=centeredCols.has(col)&&row===0?PAD+GAP+Math.round((PH+GAP)/2):PAD+row*(PH+GAP)+GAP
              const key=`${row}-${col}`
              if(pl){
                const sl=pl.tipo==='BAT'?'BAT.':pl.tipo==='PROM'?(SKU_CFG[pl.base]?.label||'').replace('GELO ','')+' *':(SKU_CFG[pl.tipo]?.label||pl.tipo).replace('GELO ','')
                return(<g key={key}><rect x={px+2} y={py+2} width={PW} height={PH} rx="4" fill="rgba(0,0,0,0.08)"/><rect x={px} y={py} width={PW} height={PH} rx="4" fill={pl.cor}/>{pl.tipo==='PROM'&&<rect x={px+3} y={py+3} width={PW-6} height={PH-6} rx="2" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="4,2"/>}<line x1={px+4} y1={py+PH/3} x2={px+PW-4} y2={py+PH/3} stroke="rgba(0,0,0,0.15)" strokeWidth="1.5"/><line x1={px+4} y1={py+PH*2/3} x2={px+PW-4} y2={py+PH*2/3} stroke="rgba(0,0,0,0.15)" strokeWidth="1.5"/><rect x={px} y={py} width={PW} height="2" rx="1" fill="rgba(255,255,255,0.15)"/><circle cx={px+9} cy={py+9} r="6.5" fill="rgba(0,0,0,0.38)"/><text x={px+9} y={py+9} fill="white" fontSize="6.5" fontWeight="800" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">{pl.seq}</text><text x={px+PW/2} y={py+PH/2-4} fill="white" fontSize="10" fontWeight="700" textAnchor="middle">{sl}</text><text x={px+PW/2} y={py+PH/2+8} fill="rgba(255,255,255,0.82)" fontSize="8.5" textAnchor="middle" fontFamily="monospace">{pl.sacos}sc</text></g>)
              }
              return(<g key={key}><rect x={px} y={py} width={PW} height={PH} rx="4" fill="#eaf5ef" stroke="#cde0d5" strokeWidth="1" strokeDasharray="5,2"/><text x={px+PW/2} y={py+PH/2+5} fill="#c8ddd0" fontSize="16" textAnchor="middle" dominantBaseline="middle">o</text></g>)
            }))}
          </g>
          <text x={CAB+bW/2} y={H-4} fill="#8aaa96" fontSize="8.5" textAnchor="middle" fontWeight="600">{vdaLabel} - {tipo} - {(maxKg||0).toLocaleString('pt-BR')} KG MAX.</text>
        </svg>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:'5px 10px',padding:'6px 0 2px'}}>
        {Object.entries(SKU_CFG).map(([k,v])=>(<div key={k} style={{display:'flex',alignItems:'center',gap:4,fontSize:9.5}}><div style={{width:11,height:11,borderRadius:2,background:v.cor,flexShrink:0}}/><span style={{color:'#6b8f7a'}}>{v.label.replace('GELO ','')}</span></div>))}
        <div style={{display:'flex',alignItems:'center',gap:4,fontSize:9.5}}><div style={{width:11,height:11,borderRadius:2,background:'#b07800',border:'1.5px dashed #e0a800'}}/><span style={{color:'#6b8f7a'}}>PROM. +60%</span></div>
        <div style={{display:'flex',alignItems:'center',gap:4,fontSize:9.5}}><div style={{width:11,height:11,borderRadius:2,background:'#5a28b0'}}/><span style={{color:'#6b8f7a'}}>BATIDO</span></div>
        <div style={{display:'flex',alignItems:'center',gap:4,fontSize:9.5}}><div style={{width:11,height:11,borderRadius:2,background:'#eaf5ef',border:'1px dashed #cde0d5'}}/><span style={{color:'#6b8f7a'}}>Livre</span></div>
      </div>
      <div style={{fontSize:8.5,color:'#aac8b8',marginTop:2,marginBottom:6}}>N = ordem de carregamento - FUNDO entra 1o - PORTA entra por ultimo</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:8}}>
        {[{val:`${totalP}/${maxP}`,label:'PALLETS',extra:overPallets?'EXCESSO':null,color:overPallets?'#b83030':'#1a2e22'},{val:`${pct}%`,label:'OCUPACAO',extra:acao,color:aprovClr},{val:(totalKg||0).toLocaleString('pt-BR'),label:'KG TOTAL',extra:overWeight?'SOBREPESO':null,color:overWeight?'#b83030':'#1a2e22'}].map(k=>(<div key={k.label} style={{textAlign:'center',background:'#fff',border:'1px solid #cde0d5',borderRadius:8,padding:'8px 4px'}}><div style={{fontSize:18,fontWeight:800,color:k.color,lineHeight:1}}>{k.val}</div><div style={{fontSize:9,color:'#6b8f7a',marginTop:2}}>{k.label}</div>{k.extra&&<div style={{fontSize:8,color:k.color,fontWeight:600,marginTop:2}}>{k.extra}</div>}</div>))}
      </div>
      <div style={{marginTop:10,background:'#fff',border:'1px solid #cde0d5',borderRadius:8,padding:'10px 12px'}}>
        <div style={{fontSize:10,fontWeight:700,color:'#1a2e22',marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span>Equilibrio Lateral</span><span style={{fontSize:9,color:sideOk?'#1a7040':'#b07800',fontWeight:600}}>{sideOk?'OK Equilibrado':'Verificar'}</span></div>
        <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{fontSize:11,fontWeight:800,color:'#1a7040',minWidth:38,textAlign:'right'}}>E {pctLeft}%</div><div style={{flex:1,height:14,background:'#f0f5f0',borderRadius:7,overflow:'hidden',display:'flex'}}><div style={{width:`${pctLeft}%`,background:sideOk?'#1a7040':'#b83030',transition:'width 0.3s'}}/><div style={{width:`${pctRight}%`,background:sideOk?'#1558a8':'#b83030',transition:'width 0.3s'}}/></div><div style={{fontSize:11,fontWeight:800,color:'#1558a8',minWidth:38}}>{pctRight}% D</div></div>
        <div style={{fontSize:8.5,color:'#8aaa96',marginTop:4,textAlign:'center'}}>Esq: {(kgLeft||0).toLocaleString('pt-BR')} kg - Dir: {(kgRight||0).toLocaleString('pt-BR')} kg - Ideal 35%-65%</div>
      </div>
      {hasPromo&&<div style={{marginTop:8,background:'#fffbf0',border:'1px solid #e0a800',borderRadius:8,padding:'8px 10px',fontSize:11}}>Pode paletizar: {Object.entries(promoted).map(([s,d])=>`${SKU_CFG[s]?.label||s}: ${d.sacos}sc (${d.fillPct}%) - faltam ${d.faltam}sc`).join(' / ')}</div>}
      {hasBat&&!hasPromo&&<div style={{marginTop:8,background:'#f3f0fa',border:'1px solid #8b5cf6',borderRadius:8,padding:'8px 10px',fontSize:11,color:'#5a28b0'}}>Carga batida: {ordered.find(p=>p.tipo==='BAT')?.det||'sacos soltos sem pallet completo'}</div>}
      {overWeight&&<div style={{marginTop:8,background:'#fff0f0',border:'1px solid #b83030',borderRadius:8,padding:'8px 10px',fontSize:11,color:'#b83030',fontWeight:700}}>SOBREPESO: {((totalKg||0)-(maxKg||0)).toLocaleString('pt-BR')} kg acima do limite!</div>}
      {!sideOk&&<div style={{marginTop:8,background:'#fffbf0',border:'1px solid #e0a800',borderRadius:8,padding:'8px 10px',fontSize:11,color:'#b07800'}}>Desequilibrio lateral ({Math.abs(pctLeft-pctRight)}% de diferenca). Redistribuir pallets para evitar risco.</div>}
    </div>
  )
}