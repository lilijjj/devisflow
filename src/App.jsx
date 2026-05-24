import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";

/* ─── Supabase client ───────────────────── */
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const API = process.env.REACT_APP_API_URL || "http://localhost:4242";
const STRIPE_PK = process.env.REACT_APP_STRIPE_PK || "pk_test_VOTRE_CLE";
const stripePromise = loadStripe(STRIPE_PK);

/* ─── MOCK DB local (avant vrai backend) ── */
const MOCK_USERS = [
  { id:"user_demo", email:"demo@devisflow.fr", password:"demo1234",
    name:"Sophie Martin", company:"Studio Martin", plan:"pro", avatar:"SM" },
];

const SEED_DEVIS = [
  { id:"DEV-001", client:"Agence Lumino",  email:"contact@lumino.fr",    montant:2400, statut:"signé",      date:"10 mai 2025", type:"Design UI/UX" },
  { id:"DEV-002", client:"Studio Craft",   email:"hello@studiocraft.fr", montant:850,  statut:"envoyé",     date:"14 mai 2025", type:"Rédaction"    },
  { id:"DEV-003", client:"TechStart SAS",  email:"ops@techstart.io",     montant:4200, statut:"en attente", date:"18 mai 2025", type:"Dev Web"       },
  { id:"DEV-004", client:"Maison Dupont",  email:"info@dupont.com",      montant:1100, statut:"relancé",    date:"5 mai 2025",  type:"Conseil"      },
  { id:"DEV-005", client:"Innov Corp",     email:"daf@innovcorp.eu",     montant:3600, statut:"brouillon",  date:"20 mai 2025", type:"Dev Web"       },
];

/* ─── API calls ─────────────────────────── */
async function apiPost(path, body) {
  const r = await fetch(`${API}${path}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    credentials:"include", body:JSON.stringify(body),
  });
  return r.json();
}
async function apiGet(path) {
  const r = await fetch(`${API}${path}`, { credentials:"include" });
  return r.json();
}

/* ─── Helpers ───────────────────────────── */
const fmt = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);

const T = {
  bg:"#F7F8FA", surface:"#FFFFFF", border:"#E8EBF0",
  text:"#0D1117", textSec:"#5C6470", textTer:"#9BA3AF",
  blue:"#2563EB", blueLight:"#EEF3FE",
  green:"#059669", greenLight:"#D1FAE5",
  yellow:"#D97706", yellowLight:"#FEF3C7",
  red:"#DC2626", redLight:"#FEE2E2",
  purple:"#7C3AED", purpleLight:"#EDE9FE",
  shadow:"0 1px 3px rgba(0,0,0,.07)", shadowMd:"0 4px 12px rgba(0,0,0,.08)",
};

const STATUS_CFG = {
  "signé":{"c":"#059669","bg":"#D1FAE5"},
  "envoyé":{"c":"#2563EB","bg":"#DBEAFE"},
  "en attente":{"c":"#D97706","bg":"#FEF3C7"},
  "relancé":{"c":"#7C3AED","bg":"#EDE9FE"},
  "brouillon":{"c":"#6B7280","bg":"#F3F4F6"},
  "payée":{"c":"#059669","bg":"#D1FAE5"},
  "en retard":{"c":"#DC2626","bg":"#FEE2E2"},
  "envoyée":{"c":"#2563EB","bg":"#DBEAFE"},
  "programmée":{"c":"#7C3AED","bg":"#EDE9FE"},
};

function Badge({s}){
  const c=STATUS_CFG[s]||STATUS_CFG.brouillon;
  return <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:500,
    background:c.bg,color:c.c,display:"inline-block",whiteSpace:"nowrap"}}>
    {s.charAt(0).toUpperCase()+s.slice(1)}
  </span>;
}
function Card({children,style={}}){
  return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,boxShadow:T.shadow,...style}}>{children}</div>;
}
function Btn({children,primary,danger,ghost,small,full,loading:ld,onClick,disabled,style={}}){
  return <button onClick={disabled||ld?undefined:onClick} disabled={disabled||ld} style={{
    display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
    padding:small?"6px 12px":"9px 18px",borderRadius:7,fontSize:small?12:13,fontWeight:500,
    cursor:(disabled||ld)?"not-allowed":"pointer",border:"none",transition:"all .15s",fontFamily:"inherit",
    opacity:(disabled||ld)?.6:1,
    ...(full?{width:"100%"}:{}),
    ...(primary?{background:T.blue,color:"#fff",boxShadow:"0 1px 4px rgba(37,99,235,.3)"}:{}),
    ...(danger?{background:T.redLight,color:T.red,border:`1px solid #FECACA`}:{}),
    ...(ghost?{background:"transparent",color:T.textSec,border:`1px solid ${T.border}`}:{}),
    ...(!primary&&!danger&&!ghost?{background:T.surface,color:T.text,border:`1px solid ${T.border}`,boxShadow:T.shadow}:{}),
    ...style,
  }}>
    {ld?<><i className="ti ti-loader-2" style={{animation:"spin 1s linear infinite"}}/> Chargement…</>:children}
  </button>;
}
function Avatar({initials,size=36,color=T.blue}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:color,color:"#fff",
    display:"flex",alignItems:"center",justifyContent:"center",fontSize:size/2.8,fontWeight:600,flexShrink:0}}>
    {initials}
  </div>;
}
function Input({label,type="text",value,onChange,placeholder,error,icon,autoFocus}){
  return <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontSize:12,fontWeight:500,color:T.text,marginBottom:5}}>{label}</label>}
    <div style={{position:"relative"}}>
      {icon&&<i className={`ti ${icon}`} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.textTer,fontSize:16,pointerEvents:"none"}}/>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus}
        style={{width:"100%",boxSizing:"border-box",padding:icon?"9px 12px 9px 38px":"9px 12px",
          borderRadius:8,fontSize:13,border:`1px solid ${error?T.red:T.border}`,
          background:T.surface,color:T.text,outline:"none",fontFamily:"inherit"}}
        onFocus={e=>e.target.style.borderColor=error?T.red:T.blue}
        onBlur={e=>e.target.style.borderColor=error?T.red:T.border}
      />
    </div>
    {error&&<p style={{margin:"4px 0 0",fontSize:11,color:T.red}}>{error}</p>}
  </div>;
}


/* ═══════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════ */
function LandingPage({onGetStarted, onLogin}){
  const [scrolled, setScrolled] = useState(false);

  useEffect(()=>{
    const fn = ()=>setScrolled(window.scrollY>50);
    window.addEventListener("scroll",fn);
    return ()=>window.removeEventListener("scroll",fn);
  },[]);

  const FEATURES = [
    {
      icon:"auto_awesome", bg:"#1e2b78", color:"#8a96e9",
      title:"Génération de Devis IA",
      desc:"Créez des devis complexes en quelques secondes. Notre IA analyse vos anciens contrats pour suggérer les meilleurs tarifs et services.",
      highlight:null
    },
    {
      icon:"schedule_send", bg:"#712ae2", color:"#fff",
      title:"Relances Automatisées",
      desc:"Ne perdez plus de temps à courir après les paiements. ",
      highlight:"+24% de trésorerie",
      desc2:" constatée chez nos clients grâce à nos scénarios intelligents."
    },
    {
      icon:"query_stats", bg:"#003b34", color:"#3cddc7",
      title:"Suivi Live 360°",
      desc:"Visualisez en temps réel qui a ouvert vos devis, validé vos factures et effectué les virements bancaires.",
      highlight:null
    },
  ];

  const AI_FEATURES = [
    {title:"Analyse Prédictive des Risques", desc:"Identifiez les clients à risque de retard de paiement avant même d'envoyer la facture."},
    {title:"Extraction de Données Automatique", desc:"Importez vos anciens documents PDF et laissez l'IA remplir votre catalogue de produits."},
    {title:"Synchronisation Bancaire Native", desc:"Le lettrage automatique rapproche vos paiements reçus de vos factures émises sans erreur."},
  ];

  return(
    <div style={{fontFamily:"'Hanken Grotesk',sans-serif",color:"#0b1c30",overflowX:"hidden",background:"#f8f9ff"}}>

      {/* ── TOP NAV ── */}
      <header style={{
        position:"fixed",top:0,left:0,right:0,zIndex:50,
        background:scrolled?"rgba(248,249,255,.92)":"#f8f9ff",
        backdropFilter:scrolled?"blur(12px)":"none",
        borderBottom:"1px solid #c6c5d3",
        transition:"all .3s",boxShadow:scrolled?"0 1px 12px rgba(1,17,99,.06)":"none"
      }}>
        <nav style={{maxWidth:1200,margin:"0 auto",padding:"0 20px",
          display:"flex",justifyContent:"space-between",alignItems:"center",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:40}}>
            <span style={{fontSize:22,fontWeight:700,color:"#011163",letterSpacing:"-0.3px"}}>DevisFlow</span>
            <div style={{display:"flex",gap:28}}>
              {["Features","Pricing","Testimonials"].map((item,i)=>(
                <a key={item} href="#" style={{
                  fontSize:15,color:i===0?"#011163":"#454651",
                  textDecoration:"none",fontWeight:i===0?600:400,
                  borderBottom:i===0?"2px solid #011163":"2px solid transparent",
                  paddingBottom:2,transition:"color .15s"
                }}>{item}</a>
              ))}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={onLogin} style={{background:"none",border:"none",cursor:"pointer",
              fontFamily:"inherit",fontSize:15,fontWeight:600,color:"#454651",padding:"8px 16px"}}>
              Login
            </button>
            <button onClick={onGetStarted} style={{
              background:"#011163",color:"#fff",border:"none",borderRadius:10,
              padding:"10px 22px",fontSize:14,fontWeight:700,cursor:"pointer",
              fontFamily:"inherit",boxShadow:"0 4px 14px rgba(1,17,99,.25)",
              transition:"all .2s"
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="#1e2b78";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="#011163";e.currentTarget.style.transform="translateY(0)";}}>
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{
        background:"linear-gradient(160deg, #011163 0%, #1e2b78 60%, #2d3a8c 100%)",
        clipPath:"polygon(0 0, 100% 0, 100% 90%, 0% 100%)",
        padding:"140px 20px 120px",minHeight:520,
        position:"relative",overflow:"hidden"
      }}>
        {/* Decorative circles */}
        <div style={{position:"absolute",top:-100,right:-100,width:400,height:400,
          borderRadius:"50%",background:"rgba(113,42,226,.15)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-50,left:-50,width:300,height:300,
          borderRadius:"50%",background:"rgba(62,221,199,.08)",pointerEvents:"none"}}/>

        <div style={{maxWidth:1200,margin:"0 auto",display:"grid",
          gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center",position:"relative",zIndex:1}}>

          {/* Left */}
          <div>
            <h1 style={{fontSize:44,fontWeight:800,color:"#fff",margin:"0 0 8px",
              lineHeight:1.15,letterSpacing:"-0.02em"}}>
              Facturez plus vite.<br/>
              Relancez sans effort.<br/>
              <span style={{color:"#3cddc7"}}>Encaissez davantage.</span>
            </h1>
            <p style={{fontSize:16,color:"rgba(255,255,255,.75)",lineHeight:1.65,
              margin:"20px 0 36px",maxWidth:440}}>
              L'outil de facturation nouvelle génération qui automatise vos processus financiers avec l'intelligence artificielle pour booster votre trésorerie de +24%.
            </p>
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              <button onClick={onGetStarted} style={{
                background:"linear-gradient(135deg,#62fae3,#3cddc7)",
                color:"#003b34",border:"none",borderRadius:12,
                padding:"14px 28px",fontSize:15,fontWeight:700,cursor:"pointer",
                fontFamily:"inherit",boxShadow:"0 4px 20px rgba(62,221,199,.4)",
                transition:"all .2s"
              }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                Essayer gratuitement
              </button>
              <button style={{
                background:"rgba(255,255,255,.1)",color:"#fff",
                border:"1px solid rgba(255,255,255,.25)",borderRadius:12,
                padding:"14px 24px",fontSize:15,fontWeight:500,cursor:"pointer",
                fontFamily:"inherit",backdropFilter:"blur(8px)",
                display:"flex",alignItems:"center",gap:8,transition:"all .2s"
              }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.18)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.1)"}>
                <span className="material-symbols-outlined" style={{fontSize:18}}>play_circle</span>
                Voir la démo
              </button>
            </div>
          </div>

          {/* Right — Mock dashboard */}
          <div style={{position:"relative"}}>
            <div style={{
              background:"rgba(255,255,255,.05)",borderRadius:16,
              border:"1px solid rgba(255,255,255,.12)",padding:20,
              backdropFilter:"blur(8px)",overflow:"hidden"
            }}>
              {/* Mock UI inside */}
              <div style={{background:"rgba(255,255,255,.08)",borderRadius:10,padding:"12px 16px",marginBottom:10,
                display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#3cddc7"}}/>
                <div style={{height:8,width:120,background:"rgba(255,255,255,.2)",borderRadius:4}}/>
                <div style={{marginLeft:"auto",height:8,width:60,background:"rgba(62,221,199,.3)",borderRadius:4}}/>
              </div>
              {/* Fake chart */}
              <div style={{background:"rgba(255,255,255,.04)",borderRadius:10,padding:"16px",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
                  {[40,55,45,70,60,85,75,95,88].map((h,i)=>(
                    <div key={i} style={{flex:1,borderRadius:"3px 3px 0 0",
                      background:i===8?"#3cddc7":"rgba(255,255,255,.2)",
                      height:`${h}%`,transition:"height .3s"}}/>
                  ))}
                </div>
              </div>
              {/* Fake rows */}
              {[["Agence Lumino","2 400 €","signé"],["TechStart SAS","4 200 €","envoyé"],["Studio Craft","850 €","relancé"]].map(([c,m,s],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"8px 12px",background:"rgba(255,255,255,.06)",borderRadius:8,marginBottom:6}}>
                  <span style={{fontSize:12,color:"rgba(255,255,255,.8)",fontWeight:500}}>{c}</span>
                  <span style={{fontSize:12,color:"#fff",fontWeight:700}}>{m}</span>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:600,
                    background:s==="signé"?"rgba(62,221,199,.2)":s==="envoyé"?"rgba(113,42,226,.3)":"rgba(255,255,255,.1)",
                    color:s==="signé"?"#3cddc7":s==="envoyé"?"#d2bbff":"rgba(255,255,255,.7)"}}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{padding:"40px 20px",borderBottom:"1px solid #c6c5d3"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",
          justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {[1,2,3,4,5].map(i=>(
              <span key={i} className="material-symbols-outlined" style={{color:"#f59e0b",fontSize:20,
                fontVariationSettings:"'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"}}>star</span>
            ))}
            <span style={{fontSize:14,fontWeight:600,color:"#454651",marginLeft:4}}>Noté 4,8/5 sur Trustpilot</span>
          </div>
          <div style={{display:"flex",gap:32}}>
            {["LOGO_A","LOGO_B","LOGO_C","LOGO_D"].map(l=>(
              <span key={l} style={{fontSize:13,fontWeight:600,color:"#c6c5d3",letterSpacing:"0.08em"}}>{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section style={{padding:"60px 20px",background:"#fff"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <div style={{background:"#f8f9ff",borderRadius:16,padding:"32px",
            border:"1px solid #c6c5d3",boxShadow:"0 2px 16px rgba(1,17,99,.05)"}}>
            <p style={{fontSize:16,lineHeight:1.7,color:"#0b1c30",margin:"0 0 20px",fontStyle:"italic"}}>
              "Depuis que nous utilisons DevisFlow, le temps consacré à la facturation a été divisé par trois. Les relances automatiques par IA sont d'une efficacité redoutable, nos clients paient beaucoup plus rapidement."
            </p>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:"#1e2b78",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#fff",fontWeight:700,fontSize:16,flexShrink:0}}>AL</div>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>Arnaud Leblanc</div>
                <div style={{fontSize:13,color:"#767682"}}>CEO, Leblanc & Associés</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{padding:"80px 20px",background:"#f8f9ff"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <h2 style={{fontSize:32,fontWeight:700,color:"#011163",margin:"0 0 12px",letterSpacing:"-0.3px"}}>
              L'efficacité au cœur de votre entreprise
            </h2>
            <p style={{fontSize:16,color:"#454651",margin:0}}>
              Optimisez chaque étape de votre cycle de vente grâce à nos outils intelligents et intuitifs.
            </p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>
            {FEATURES.map((f,i)=>(
              <div key={i}
                style={{background:"#fff",borderRadius:16,padding:32,
                  border:"1px solid rgba(198,197,211,.3)",
                  boxShadow:"0 2px 8px rgba(1,17,99,.04)",transition:"all .3s",cursor:"default"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow="0 12px 32px rgba(1,17,99,.1)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(1,17,99,.04)";}}>
                <div style={{width:48,height:48,background:f.bg,borderRadius:12,
                  display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,
                  transition:"transform .3s"}}>
                  <span className="material-symbols-outlined" style={{fontSize:24,color:f.color}}>{f.icon}</span>
                </div>
                <h3 style={{fontSize:20,fontWeight:600,color:"#011163",margin:"0 0 12px"}}>{f.title}</h3>
                <p style={{fontSize:15,color:"#454651",lineHeight:1.65,margin:0}}>
                  {f.desc}
                  {f.highlight&&<><strong style={{color:"#712ae2"}}>{f.highlight}</strong>{f.desc2}</>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section style={{padding:"80px 20px",background:"#fff"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"grid",
          gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center"}}>
          <div>
            <h2 style={{fontSize:32,fontWeight:700,color:"#011163",margin:"0 0 32px",
              letterSpacing:"-0.3px",lineHeight:1.2}}>
              L'intelligence artificielle<br/>au service de votre sérénité
            </h2>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {AI_FEATURES.map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:"#8a4cfc",
                    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                    <span className="material-symbols-outlined" style={{fontSize:14,color:"#fff",
                      fontVariationSettings:"'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24"}}>check</span>
                  </div>
                  <div>
                    <h4 style={{fontWeight:700,fontSize:15,color:"#011163",margin:"0 0 4px"}}>{f.title}</h4>
                    <p style={{fontSize:14,color:"#454651",margin:0,lineHeight:1.6}}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Mock dashboard image */}
          <div style={{position:"relative"}}>
            <div style={{
              borderRadius:16,padding:16,background:"#0d1f3c",
              boxShadow:"0 0 25px rgba(113,42,226,.15)",border:"1px solid rgba(113,42,226,.2)"
            }}>
              {/* Mock dark dashboard */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[["Total CA","124 500 €","#3cddc7"],["En attente","32 120 €","#bbc3ff"]].map(([l,v,c])=>(
                  <div key={l} style={{background:"rgba(255,255,255,.06)",borderRadius:8,padding:"12px"}}>
                    <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginBottom:4,fontWeight:600}}>{l}</div>
                    <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Chart area */}
              <div style={{background:"rgba(255,255,255,.04)",borderRadius:10,padding:"16px 12px",marginBottom:10}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginBottom:10,fontWeight:600}}>REVENUE EVOLUTION</div>
                <svg width="100%" viewBox="0 0 300 80" style={{overflow:"visible"}}>
                  <defs>
                    <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3cddc7" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#3cddc7" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,65 L33,58 L66,50 L99,38 L132,45 L165,28 L198,32 L231,18 L265,15 L300,8"
                    fill="none" stroke="#3cddc7" strokeWidth="2.5" strokeLinejoin="round"/>
                  <path d="M0,65 L33,58 L66,50 L99,38 L132,45 L165,28 L198,32 L231,18 L265,15 L300,8 L300,80 L0,80 Z"
                    fill="url(#lg2)"/>
                  {[[0,65],[99,38],[165,28],[300,8]].map(([x,y],i)=>(
                    <circle key={i} cx={x} cy={y} r="3" fill="#3cddc7"/>
                  ))}
                </svg>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <div style={{background:"rgba(255,255,255,.08)",borderRadius:20,padding:"5px 12px",
                  display:"flex",alignItems:"center",gap:6}}>
                  <span className="material-symbols-outlined" style={{fontSize:14,color:"#712ae2"}}>bolt</span>
                  <span style={{fontSize:10,fontWeight:600,color:"#712ae2",letterSpacing:"0.08em",fontFamily:"'JetBrains Mono',monospace"}}>IA ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{padding:"80px 20px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{background:"#1e2b78",borderRadius:20,padding:"56px 48px",
            textAlign:"center",position:"relative",overflow:"hidden"}}>
            {/* Grid texture */}
            <div style={{position:"absolute",inset:0,opacity:0.05,pointerEvents:"none",
              backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
              backgroundSize:"30px 30px"}}/>
            <h2 style={{fontSize:34,fontWeight:700,color:"#8a96e9",margin:"0 0 14px",
              letterSpacing:"-0.3px",position:"relative",zIndex:1}}>
              Prêt à transformer votre facturation ?
            </h2>
            <p style={{fontSize:16,color:"rgba(138,150,233,.8)",margin:"0 0 36px",
              maxWidth:500,marginLeft:"auto",marginRight:"auto",lineHeight:1.6,
              position:"relative",zIndex:1}}>
              Rejoignez plus de 5,000 entreprises qui automatisent leur croissance avec DevisFlow. Aucun frais caché, résiliation possible à tout moment.
            </p>
            <div style={{position:"relative",zIndex:1}}>
              <button onClick={onGetStarted} style={{
                background:"linear-gradient(135deg,#62fae3,#3cddc7)",
                color:"#003b34",border:"none",borderRadius:12,
                padding:"16px 40px",fontSize:17,fontWeight:700,cursor:"pointer",
                fontFamily:"inherit",boxShadow:"0 8px 28px rgba(62,221,199,.35)",
                transition:"all .2s"
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}>
                Créer un compte gratuit
              </button>
              <p style={{marginTop:12,fontSize:13,color:"rgba(138,150,233,.6)"}}>
                Essai gratuit de 14 jours • Pas de carte bancaire requise
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{background:"#011163",padding:"40px 20px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",
          justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div>
            <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:4}}>DevisFlow</div>
            <div style={{fontSize:13,color:"rgba(138,150,233,.7)"}}>© 2024 DevisFlow AI. All rights reserved.</div>
          </div>
          <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
            {["Privacy Policy","Terms of Service","Contact Us","Documentation"].map(l=>(
              <a key={l} href="#" style={{fontSize:13,color:"rgba(138,150,233,.8)",textDecoration:"none",
                transition:"color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.color="#3cddc7"}
                onMouseLeave={e=>e.currentTarget.style.color="rgba(138,150,233,.8)"}>{l}</a>
            ))}
          </div>
          <div style={{display:"flex",gap:10}}>
            {["share","language"].map(icon=>(
              <button key={icon} style={{width:40,height:40,borderRadius:"50%",
                background:"rgba(138,150,233,.1)",border:"none",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#fff",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#3cddc7";e.currentTarget.style.color="#003b34";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(138,150,233,.1)";e.currentTarget.style.color="#fff";}}>
                <span className="material-symbols-outlined" style={{fontSize:18}}>{icon}</span>
              </button>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;font-family:'Material Symbols Outlined';vertical-align:middle;}
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr !important;}
          .hero-mock{display:none !important;}
          .features-grid{grid-template-columns:1fr !important;}
          .ai-grid{grid-template-columns:1fr !important;}
          .nav-links{display:none !important;}
          .cta-section{padding:40px 24px !important;}
          .footer-inner{flex-direction:column !important;text-align:center !important;}
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════ */
function AuthPage({onLogin, initialMode="login", onBack}){
  const [mode,setMode]=useState(initialMode);
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [name,setName]=useState("");
  const [company,setCo]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState({});
  const [loading,setLoad]=useState(false);

  function validate(){
    const e={};
    if(!email||!/\S+@\S+\.\S+/.test(email)) e.email="Email invalide";
    if(!pass||pass.length<6) e.pass="6 caractères minimum";
    if(mode==="signup"&&!name.trim()) e.name="Nom requis";
    return e;
  }

  async function submit(){
    const e=validate(); if(Object.keys(e).length){setErr(e);return;}
    setErr({}); setLoad(true);

    // ── Compte démo (pas Supabase) ──
    if(email==="demo@devisflow.fr"&&pass==="demo1234"){
      onLogin(MOCK_USERS[0]); setLoad(false); return;
    }

    try {
      if(mode==="login"){
        // Connexion Supabase Auth
        const {data,error} = await supabase.auth.signInWithPassword({email,password:pass});
        if(error) throw new Error("Email ou mot de passe incorrect");
        // Récupère le profil dans la table users
        const {data:profile} = await supabase.from("users").select("*").eq("id",data.user.id).single();
        const u = profile || {id:data.user.id,email,name:email.split("@")[0],plan:"trial",avatar:email[0].toUpperCase()};
        onLogin({...u, avatar:(u.name||email).split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()});
      } else {
        // Inscription Supabase Auth
        const {data,error} = await supabase.auth.signUp({email,password:pass});
        if(error) throw new Error(error.message);
        // Crée le profil dans la table users
        const avatar = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"U";
        const newUser = {id:data.user.id,email,name,company:company||"Mon entreprise",plan:"trial",avatar};
        await supabase.from("users").insert([newUser]);
        onLogin(newUser);
      }
    } catch(err) {
      setErr({global: err.message || "Une erreur est survenue"});
    }
    setLoad(false);
  }

  return(
    <div style={{minHeight:"100vh",display:"flex",background:"#F0F4FF",fontFamily:"'DM Sans',sans-serif"}}>
      {/* Left */}
      <div className="auth-left" style={{flex:"0 0 420px",background:"#0F172A",display:"flex",flexDirection:"column",
        padding:"40px 44px",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:"rgba(37,99,235,.15)"}}/>
        <div style={{position:"absolute",bottom:40,left:-60,width:200,height:200,borderRadius:"50%",background:"rgba(124,58,237,.1)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:60,position:"relative"}}>
          <div style={{width:38,height:38,borderRadius:10,background:T.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <i className="ti ti-bolt" style={{fontSize:20}}/>
          </div>
          <span style={{fontWeight:700,fontSize:20,letterSpacing:"-0.4px"}}>DevisFlow</span>
        </div>
        <div style={{position:"relative",flex:1}}>
          <p style={{fontSize:11,letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,.4)",marginBottom:14}}>Rejoignez 3 400+ freelances</p>
          <h2 style={{fontSize:28,fontWeight:700,lineHeight:1.25,letterSpacing:"-0.6px",margin:"0 0 20px"}}>
            Facturez plus vite.<br/>Relancez sans effort.<br/>
            <span style={{color:"#60A5FA"}}>Encaissez davantage.</span>
          </h2>
          <div style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"16px 18px",
            border:"1px solid rgba(255,255,255,.1)",marginTop:32}}>
            <p style={{fontSize:13,color:"rgba(255,255,255,.7)",lineHeight:1.6,margin:"0 0 12px",fontStyle:"italic"}}>
              « J'ai récupéré 8 400 € de factures impayées en 3 mois grâce aux relances auto. »
            </p>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Avatar initials="AL" size={30} color="#7C3AED"/>
              <div>
                <div style={{fontSize:12,fontWeight:500}}>Arnaud Leblanc</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>Dev freelance · Paris</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{color:"rgba(255,255,255,.2)",fontSize:11}}>© 2025 DevisFlow · RGPD · CGU</div>
      </div>

      {/* Right */}
      <div className="auth-right" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
        <div style={{width:"100%",maxWidth:420}}>
          <h3 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.4px",margin:"0 0 4px",color:T.text}}>
            {mode==="login"?"Bon retour 👋":"Créer votre compte 🚀"}
          </h3>
          <p style={{fontSize:13,color:T.textSec,margin:"0 0 24px"}}>
            {mode==="login"?"Connectez-vous à votre espace.":"Essai gratuit 14 jours · Sans carte bancaire."}
          </p>

          {mode==="login"&&(
            <div style={{background:T.blueLight,border:"1px dashed #93C5FD",borderRadius:8,
              padding:"10px 14px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
              <div>
                <div style={{fontSize:12,fontWeight:500,color:T.blue}}>✦ Compte démo</div>
                <div style={{fontSize:11,color:T.textSec}}>demo@devisflow.fr · demo1234</div>
              </div>
              <Btn small primary onClick={()=>{setEmail("demo@devisflow.fr");setPass("demo1234");
                setTimeout(()=>onLogin(MOCK_USERS[0]),300);}}>Tester →</Btn>
            </div>
          )}

          {err.global&&<div style={{background:T.redLight,border:`1px solid #FECACA`,borderRadius:8,
            padding:"10px 14px",marginBottom:16,fontSize:13,color:T.red,display:"flex",gap:8}}>
            <i className="ti ti-alert-circle"/>{err.global}
          </div>}

          {mode==="signup"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label="Prénom & Nom *" value={name} onChange={e=>setName(e.target.value)}
                placeholder="Sophie Martin" error={err.name} icon="ti-user" autoFocus/>
              <Input label="Entreprise" value={company} onChange={e=>setCo(e.target.value)}
                placeholder="Mon Studio" icon="ti-building"/>
            </div>
          )}

          <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="vous@exemple.fr" error={err.email} icon="ti-mail" autoFocus={mode==="login"}/>

          <div style={{marginBottom:20,position:"relative"}}>
            <label style={{display:"block",fontSize:12,fontWeight:500,color:T.text,marginBottom:5}}>Mot de passe</label>
            <div style={{position:"relative"}}>
              <i className="ti ti-lock" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.textTer,fontSize:16}}/>
              <input type={showPw?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)}
                placeholder="••••••••"
                style={{width:"100%",boxSizing:"border-box",padding:"9px 38px 9px 38px",borderRadius:8,
                  fontSize:13,border:`1px solid ${err.pass?T.red:T.border}`,background:T.surface,
                  color:T.text,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",
                transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:T.textTer}}>
                <i className={`ti ${showPw?"ti-eye-off":"ti-eye"}`}/>
              </button>
            </div>
            {err.pass&&<p style={{margin:"4px 0 0",fontSize:11,color:T.red}}>{err.pass}</p>}
          </div>

          <Btn primary full loading={loading} onClick={submit}
            style={{padding:"11px",fontSize:14,fontWeight:600,borderRadius:8}}>
            {mode==="login"?"Se connecter →":"Créer mon compte →"}
          </Btn>

          <div style={{display:"flex",alignItems:"center",gap:12,margin:"18px 0"}}>
            <div style={{flex:1,height:1,background:T.border}}/>
            <span style={{fontSize:11,color:T.textTer}}>ou</span>
            <div style={{flex:1,height:1,background:T.border}}/>
          </div>

          <Btn ghost full onClick={()=>{setMode(mode==="login"?"signup":"login");setErr({});}}>
            {mode==="login"?<><i className="ti ti-user-plus"/> Créer un compte gratuit</>
              :<><i className="ti ti-login"/> J'ai déjà un compte</>}
          </Btn>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STRIPE TARIFS  (avec vrai checkout)
═══════════════════════════════════════════ */
function Tarifs({user, onPlanChange}){
  const [annual,setAnnual]=useState(false);
  const [loading,setLoading]=useState(null);
  const [portalLoading,setPortalLoading]=useState(false);
  const [subStatus,setSubStatus]=useState(null);
  const [err,setErr]=useState("");

  /* Charge le statut d'abonnement réel */
  useEffect(()=>{
    apiGet(`/api/subscription-status/${user.id}`)
      .then(s=>setSubStatus(s))
      .catch(()=>{});
  },[user.id]);

  async function subscribe(planId){
    setErr(""); setLoading(planId);
    try{
      const stripe = await stripePromise;
      const data = await apiPost("/api/create-checkout-session",{
        userId: user.id,
        planId,
        annual,
        successUrl: window.location.origin + "/?plan_success=1",
        cancelUrl:  window.location.origin + "/",
      });
      if(data.error) throw new Error(data.error);
      /* Redirect vers Stripe Checkout */
      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if(result.error) throw new Error(result.error.message);
    }catch(e){
      setErr(e.message || "Erreur lors de la connexion à Stripe");
    }
    setLoading(null);
  }

  async function openPortal(){
    setPortalLoading(true);
    try{
      const data = await apiPost("/api/create-portal-session",{ userId: user.id });
      if(data.error) throw new Error(data.error);
      window.location.href = data.url;
    }catch(e){
      setErr(e.message);
    }
    setPortalLoading(false);
  }

  const activePlan = subStatus?.plan || user.plan;

  const plans=[
    {id:"starter",name:"Starter",price:19,priceY:15,desc:"Pour démarrer",
      features:["5 devis / mois","Facturation basique","Relances manuelles","Export PDF","Support email"],
      cta:"Démarrer",color:"#6B7280"},
    {id:"pro",name:"Pro",price:39,priceY:31,featured:true,desc:"Pour les freelances actifs",
      features:["Devis illimités","IA rédaction devis","Relances auto J+7/J+14/J+30",
        "Signature électronique","Dashboard avancé","Support prioritaire"],
      cta:"Commencer l'essai 14j",color:T.blue},
    {id:"business",name:"Business",price:79,priceY:63,desc:"Pour les agences",
      features:["Tout Pro inclus","Multi-utilisateurs (5)","API & webhooks",
        "Comptabilité connectée","Manager dédié","SLA 99.9 %"],
      cta:"Nous contacter",color:T.purple},
  ];

  return(
    <div style={{animation:"fadeUp .3s ease"}}>

      {/* Abonnement actif */}
      {subStatus&&subStatus.status==="active"&&(
        <div style={{background:T.greenLight,border:`1px solid #6EE7B7`,borderRadius:10,
          padding:"14px 18px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,color:T.green,fontSize:13,fontWeight:500}}>
            <i className="ti ti-circle-check" style={{fontSize:18}}/>
            Plan <strong>{activePlan}</strong> actif · Renouvellement le {
              subStatus.currentPeriodEnd
                ? new Date(subStatus.currentPeriodEnd).toLocaleDateString("fr-FR")
                : "—"
            }
          </div>
          <Btn small loading={portalLoading} onClick={openPortal}>
            <i className="ti ti-settings"/> Gérer l'abonnement
          </Btn>
        </div>
      )}

      {err&&<div style={{background:T.redLight,border:`1px solid #FECACA`,borderRadius:8,
        padding:"11px 16px",marginBottom:18,fontSize:13,color:T.red,display:"flex",gap:8}}>
        <i className="ti ti-alert-circle"/>{err}
        <span style={{marginLeft:"auto",fontSize:11,color:T.textTer}}>Vérifiez que le backend tourne sur {API}</span>
      </div>}

      {/* Toggle mensuel / annuel */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:28}}>
        <span style={{fontSize:13,fontWeight:500,color:annual?T.textTer:T.text}}>Mensuel</span>
        <div onClick={()=>setAnnual(!annual)} style={{width:44,height:24,borderRadius:12,
          background:annual?T.blue:T.border,cursor:"pointer",position:"relative",transition:"background .2s"}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",
            position:"absolute",top:2,left:annual?22:2,transition:"left .2s"}}/>
        </div>
        <span style={{fontSize:13,fontWeight:500,color:annual?T.text:T.textTer}}>
          Annuel <span style={{background:T.greenLight,color:T.green,
            padding:"1px 8px",borderRadius:20,fontSize:11,fontWeight:600,marginLeft:4}}>-20%</span>
        </span>
      </div>

      <div className="plans-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,maxWidth:860,margin:"0 auto"}}>
        {plans.map(p=>{
          const isCurrent = activePlan===p.id;
          return(
            <div key={p.id} style={{background:"#fff",borderRadius:14,padding:"24px",
              border:p.featured?`2px solid ${T.blue}`:`1px solid ${T.border}`,
              position:"relative",boxShadow:p.featured?T.shadowMd:T.shadow}}>
              {p.featured&&<div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",
                background:T.blue,color:"#fff",padding:"3px 16px",borderRadius:20,fontSize:11,fontWeight:600,
                whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(37,99,235,.3)"}}>✦ Le plus populaire</div>}
              {isCurrent&&<div style={{position:"absolute",top:14,right:14,background:T.greenLight,
                color:T.green,padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:600}}>Votre plan</div>}
              <div style={{fontSize:11,color:p.color,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:".8px"}}>{p.name}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:2,marginBottom:2}}>
                <span style={{fontSize:32,fontWeight:800,letterSpacing:"-0.6px"}}>{annual?p.priceY:p.price}€</span>
                <span style={{fontSize:12,color:T.textTer}}>/mois</span>
              </div>
              <div style={{fontSize:11,color:T.textTer,marginBottom:4}}>{annual?`${(annual?p.priceY:p.price)*12}€ facturé/an`:"Sans engagement"} · HT</div>
              <div style={{fontSize:13,color:T.textSec,marginBottom:18}}>{p.desc}</div>
              <div style={{borderTop:`1px solid ${T.bg}`,paddingTop:14,marginBottom:18}}>
                {p.features.map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:9,fontSize:13}}>
                    <i className="ti ti-check" style={{color:T.green,fontSize:14,marginTop:2,flexShrink:0}}/>
                    {f}
                  </div>
                ))}
              </div>
              <Btn primary={p.featured} full
                loading={loading===p.id}
                disabled={isCurrent||loading!==null}
                onClick={()=>subscribe(p.id)}
                style={{background:isCurrent?"#E5E7EB":p.featured?T.blue:p.id==="business"?T.purple:"#F1F5F9",
                  color:isCurrent?T.textSec:p.featured||p.id==="business"?"#fff":T.text}}>
                {isCurrent?"Plan actuel":p.cta}
              </Btn>
            </div>
          );
        })}
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"center",
        gap:20,marginTop:22,color:T.textTer,fontSize:12,flexWrap:"wrap"}}>
        {["🔒 Paiement sécurisé Stripe","🇫🇷 Hébergement France","✓ RGPD","⭐ 4.9/5"].map(t=>(
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DASHBOARD / DEVIS / FACTURES  (inchangés)
═══════════════════════════════════════════ */
function Dashboard({devis,totalSigne,enCours,tauxSign}){
  const MONTHS=[["D",3200],["J",4800],["F",3900],["M",6200],["A",5100],["M",totalSigne||8150]];
  const max=Math.max(...MONTHS.map(m=>m[1]));
  return(
    <div style={{animation:"fadeUp .3s ease"}}>
      <div className="kpi-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {l:"CA signé ce mois",v:fmt(totalSigne),i:"ti-trending-up",c:T.green,bg:T.greenLight},
          {l:"Devis en cours",v:enCours,i:"ti-file-time",c:T.blue,bg:T.blueLight},
          {l:"Taux signature",v:`${tauxSign}%`,i:"ti-rosette",c:T.purple,bg:T.purpleLight},
          {l:"Relances envoyées",v:"3",i:"ti-send",c:T.yellow,bg:T.yellowLight},
        ].map((m,i)=>(
          <Card key={i} style={{padding:"16px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:11,color:T.textSec,marginBottom:6,fontWeight:500}}>{m.l}</div>
                <div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.5px"}}>{m.v}</div>
              </div>
              <div style={{width:38,height:38,borderRadius:9,background:m.bg,
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <i className={`ti ${m.i}`} style={{fontSize:18,color:m.c}}/>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="chart-grid" style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:16}}>
        <Card style={{padding:20}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>CA mensuel</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100}}>
            {MONTHS.map(([m,v],i)=>(
              <div key={m+i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                {i===5&&<div style={{fontSize:9,color:T.blue,fontWeight:600}}>{fmt(v)}</div>}
                {i!==5&&<div style={{fontSize:9,color:"transparent"}}>x</div>}
                <div style={{width:"100%",borderRadius:"3px 3px 0 0",
                  background:i===5?T.blue:"#BFDBFE",
                  height:`${Math.round(v/max*80)}px`,minHeight:4}}/>
                <span style={{fontSize:10,color:T.textTer}}>{m}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,fontWeight:600,fontSize:13}}>Derniers devis</div>
          {devis.slice(0,5).map((d,i)=>(
            <div key={d.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"10px 18px",borderBottom:i<4?`1px solid ${T.bg}`:"none"}}>
              <div>
                <div style={{fontWeight:500,fontSize:13}}>{d.client}</div>
                <div style={{fontSize:11,color:T.textTer}}>{d.id} · {d.date}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontWeight:600,fontSize:13}}>{fmt(d.montant)}</span>
                <Badge s={d.statut}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function DevisList({devis,toast}){
  const [filter,setFilter]=useState("Tous");
  const filtered=filter==="Tous"?devis:devis.filter(d=>d.statut===filter.toLowerCase());
  return(
    <Card style={{padding:0,overflow:"hidden",animation:"fadeUp .3s ease"}}>
      <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`,
        display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg}}>
        <div style={{display:"flex",gap:5}}>
          {["Tous","Signé","Envoyé","En attente","Brouillon"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:"5px 13px",borderRadius:20,border:`1px solid ${filter===f?T.blue:T.border}`,
              background:filter===f?T.blue:"#fff",color:filter===f?"#fff":T.textSec,
              fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
              {f}
            </button>
          ))}
        </div>
        <span style={{fontSize:11,color:T.textTer}}>{filtered.length} résultat(s)</span>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:"#FAFBFC",borderBottom:`1px solid ${T.border}`}}>
            {["Référence","Client","Type","Date","Montant HT","Statut",""].map(h=>(
              <th key={h} style={{padding:"10px 18px",textAlign:"left",fontSize:11,fontWeight:500,color:T.textSec}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((d,i)=>(
            <tr key={d.id} style={{borderBottom:i<filtered.length-1?`1px solid ${T.bg}`:"none"}}
              onMouseEnter={e=>e.currentTarget.style.background="#FAFBFC"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{padding:"12px 18px",fontSize:13,color:T.blue,fontWeight:500}}>{d.id}</td>
              <td style={{padding:"12px 18px"}}>
                <div style={{fontWeight:500,fontSize:13}}>{d.client}</div>
                <div style={{fontSize:11,color:T.textTer}}>{d.email}</div>
              </td>
              <td style={{padding:"12px 18px",fontSize:12,color:T.textSec}}>{d.type}</td>
              <td style={{padding:"12px 18px",fontSize:12,color:T.textSec}}>{d.date}</td>
              <td style={{padding:"12px 18px",fontWeight:600,fontSize:13}}>{fmt(d.montant)}</td>
              <td style={{padding:"12px 18px"}}><Badge s={d.statut}/></td>
              <td style={{padding:"12px 18px"}}>
                <div style={{display:"flex",gap:5}}>
                  <Btn small ghost><i className="ti ti-eye"/></Btn>
                  {d.statut!=="signé"&&<Btn small ghost onClick={()=>toast(`Relance envoyée à ${d.client}`)}>
                    <i className="ti ti-send"/></Btn>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   NEW DEVIS WIZARD  (IA branchée)
═══════════════════════════════════════════ */
function NewDevisWizard({onDone,onCancel}){
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({client:"",email:"",type:"Développement web",desc:""});
  const [loading,setLoading]=useState(false);
  const [gen,setGen]=useState(null);

  async function generate(){
    if(!form.client.trim()) return;
    setLoading(true); setStep(2);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          messages:[{role:"user",content:
            `Génère un devis pro français. Client: ${form.client}. Prestation: ${form.type}. `+
            `Détails: ${form.desc||"prestation standard"}.\n`+
            `Réponds UNIQUEMENT avec JSON (sans backticks): `+
            `{"intro":"phrase intro","lignes":[{"desc":"libellé","qte":1,"pu":1200}],"conditions":"conditions","delai":"délai"}`
          }]})
      });
      const d=await r.json();
      const txt=d.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      setGen(JSON.parse(txt));
    }catch{
      setGen({intro:`Proposition pour ${form.type}.`,
        lignes:[{desc:form.type,qte:1,pu:1200},{desc:"Accompagnement 30j",qte:1,pu:150}],
        conditions:"50% à la commande, 50% à la livraison.",delai:"3 semaines"});
    }
    setLoading(false); setStep(3);
  }

  function send(){
    const total=gen?.lignes.reduce((s,l)=>s+l.qte*(l.pu||0),0)||1200;
    onDone({id:`DEV-0${(Math.random()*900+100).toFixed(0)}`,client:form.client,email:form.email,
      montant:total,statut:"envoyé",
      date:new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),
      type:form.type, lignes:gen?.lignes||[]});
  }

  return(
    <div style={{maxWidth:720,margin:"0 auto",animation:"fadeUp .3s ease"}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:28}}>
        {[{n:1,l:"Infos"},{n:2,l:"Génération IA"},{n:3,l:"Aperçu"}].map((s,i)=>(
          <div key={s.n} style={{display:"flex",alignItems:"center",flex:i<2?1:"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,
                background:step>s.n?T.green:step===s.n?T.blue:T.border,
                color:step>=s.n?"#fff":T.textTer,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:12,fontWeight:600}}>
                {step>s.n?<i className="ti ti-check" style={{fontSize:13}}/>:s.n}
              </div>
              <span style={{fontSize:12,color:step===s.n?T.text:T.textTer,fontWeight:step===s.n?500:400,whiteSpace:"nowrap"}}>{s.l}</span>
            </div>
            {i<2&&<div style={{flex:1,height:1,background:step>s.n?T.green:T.border,margin:"0 14px",minWidth:20}}/>}
          </div>
        ))}
      </div>

      {step===1&&(
        <Card style={{padding:28}}>
          <div style={{fontWeight:600,fontSize:15,marginBottom:20}}>Informations du devis</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Client *" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}
              placeholder="Agence Lumino" icon="ti-building" autoFocus/>
            <Input label="Email client" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
              placeholder="contact@agence.fr" icon="ti-mail"/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,fontWeight:500,color:T.text,marginBottom:5}}>Type de prestation</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}
              style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${T.border}`,
                fontSize:13,background:T.surface,color:T.text,fontFamily:"inherit"}}>
              {["Développement web","Design UI/UX","Rédaction","Conseil","Formation","Audit","Marketing","Autre"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{marginBottom:24}}>
            <label style={{display:"block",fontSize:12,fontWeight:500,color:T.text,marginBottom:5}}>Description</label>
            <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})}
              placeholder="Ex : Refonte site vitrine, 5 pages, formulaire contact…"
              style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${T.border}`,
                fontSize:13,height:80,resize:"vertical",fontFamily:"inherit",lineHeight:1.5,
                color:T.text,background:T.surface,outline:"none"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <Btn ghost onClick={onCancel}><i className="ti ti-arrow-left"/> Annuler</Btn>
            <Btn primary onClick={generate} disabled={!form.client.trim()}>
              <i className="ti ti-sparkles"/> Générer avec l&apos;IA →
            </Btn>
          </div>
        </Card>
      )}

      {step===2&&(
        <Card style={{padding:"64px 40px",textAlign:"center"}}>
          <div style={{width:60,height:60,borderRadius:"50%",background:T.blueLight,
            display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
            <i className="ti ti-sparkles" style={{fontSize:28,color:T.blue}}/>
          </div>
          <div style={{fontWeight:700,fontSize:17,marginBottom:8}}>L&apos;IA rédige votre devis…</div>
          <div style={{color:T.textSec,fontSize:13,maxWidth:300,margin:"0 auto",lineHeight:1.6}}>
            Analyse · Tarification · Rédaction professionnelle
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:7,marginTop:22}}>
            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:T.blue,
              animation:`pulse 1.3s ${i*0.25}s ease-in-out infinite`}}/>)}
          </div>
        </Card>
      )}

      {step===3&&gen&&(
        <div>
          <div style={{background:T.greenLight,border:`1px solid #6EE7B7`,borderRadius:9,
            padding:"11px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:9,
            color:T.green,fontSize:13,fontWeight:500}}>
            <i className="ti ti-circle-check" style={{fontSize:17}}/> Devis généré · Relisez et envoyez
          </div>
          <Card style={{padding:"32px 36px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:24}}>
              <div>
                <div style={{fontWeight:800,fontSize:20,color:T.blue,letterSpacing:"-0.5px",marginBottom:2}}>DevisFlow</div>
                <div style={{fontSize:12,color:T.textSec,lineHeight:1.7}}>12 rue de la Paix, 75001 Paris<br/>contact@devisflow.fr</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:700,fontSize:18,marginBottom:4}}>DEVIS</div>
                <div style={{fontSize:12,color:T.textSec,lineHeight:1.7}}>
                  N° DEV-2025-{String(Math.floor(Math.random()*900)+100).padStart(3,"0")}<br/>
                  Date : {new Date().toLocaleDateString("fr-FR")}<br/>Validité : 30 jours
                </div>
              </div>
            </div>
            <div style={{background:"#F8FAFC",borderRadius:8,padding:"12px 16px",marginBottom:20,borderLeft:`3px solid ${T.blue}`}}>
              <div style={{fontSize:10,color:T.textTer,marginBottom:2,textTransform:"uppercase",letterSpacing:".8px"}}>Devis établi pour</div>
              <div style={{fontWeight:600,fontSize:14}}>{form.client}</div>
              {form.email&&<div style={{fontSize:12,color:T.textSec}}>{form.email}</div>}
            </div>
            <p style={{fontSize:13,color:T.textSec,marginBottom:18,lineHeight:1.7}}>{gen.intro}</p>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:16}}>
              <thead>
                <tr style={{background:"#1E3A8A"}}>
                  {["Description","Qté","Prix unit. HT","Total HT"].map((h,i)=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:i>0?"right":"left",fontSize:11,
                      fontWeight:500,color:"#fff",borderRadius:i===0?"8px 0 0 8px":i===3?"0 8px 8px 0":"0"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gen.lignes.map((l,i)=>{
                  const t=l.qte*(l.pu||0);
                  return <tr key={i} style={{borderBottom:`1px solid ${T.bg}`,background:i%2?"#FAFBFC":"#fff"}}>
                    <td style={{padding:"10px 14px",fontSize:13}}>{l.desc}</td>
                    <td style={{padding:"10px 14px",textAlign:"right",fontSize:13}}>{l.qte}</td>
                    <td style={{padding:"10px 14px",textAlign:"right",fontSize:13}}>{l.pu?fmt(l.pu):"Inclus"}</td>
                    <td style={{padding:"10px 14px",textAlign:"right",fontSize:13,fontWeight:600}}>{t?fmt(t):"—"}</td>
                  </tr>;
                })}
              </tbody>
            </table>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}>
              <div style={{width:220}}>
                {(()=>{const ht=gen.lignes.reduce((s,l)=>s+l.qte*(l.pu||0),0);const tva=Math.round(ht*.2);
                  return[["Total HT",fmt(ht)],["TVA 20%",fmt(tva)],["Total TTC",fmt(ht+tva)]].map(([k,v],i)=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",
                      padding:i===2?"10px 0 0":"6px 0",
                      borderTop:i===2?`2px solid ${T.border}`:`1px solid ${T.bg}`,
                      fontSize:i===2?14:13,fontWeight:i===2?700:400}}>
                      <span style={{color:i===2?T.text:T.textSec}}>{k}</span>
                      <span style={{color:i===2?T.blue:T.text}}>{v}</span>
                    </div>
                  ));})()}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{background:"#F8FAFC",borderRadius:8,padding:"12px 14px",borderLeft:`3px solid ${T.blue}`}}>
                <div style={{fontSize:11,fontWeight:600,color:T.text,marginBottom:3}}>Règlement</div>
                <div style={{fontSize:12,color:T.textSec,lineHeight:1.5}}>{gen.conditions}</div>
              </div>
              <div style={{background:"#F8FAFC",borderRadius:8,padding:"12px 14px",borderLeft:`3px solid ${T.purple}`}}>
                <div style={{fontSize:11,fontWeight:600,color:T.text,marginBottom:3}}>Délai</div>
                <div style={{fontSize:12,color:T.textSec}}>{gen.delai}</div>
              </div>
            </div>
          </Card>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <Btn ghost onClick={()=>setStep(1)}><i className="ti ti-edit"/> Modifier</Btn>
            <div style={{display:"flex",gap:10}}>
              <Btn ghost><i className="ti ti-download"/> PDF</Btn>
              <Btn primary onClick={send}><i className="ti ti-send"/> Envoyer au client</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ─────────────────────────────────────────
   HOOK  — détection mobile
───────────────────────────────────────── */
function useIsMobile(){ 
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(()=>{
    const fn = ()=>setMobile(window.innerWidth<768);
    window.addEventListener("resize",fn);
    return ()=>window.removeEventListener("resize",fn);
  },[]);
  return mobile;
}


/* ═══════════════════════════════════════════
   MOBILE APP  — interface native mobile
   Basée sur le design screenshot fourni
═══════════════════════════════════════════ */
function MobileApp({user, onLogout, page, setPage}){
  const [devis, setDevis] = useState(SEED_DEVIS);
  const initials = (user.name||user.email||"U").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  const TABS = [
    {id:"dashboard", icon:"dashboard",     label:"Dashboard"},
    {id:"devis",     icon:"auto_awesome",  label:"Devis AI"},
    {id:"factures",  icon:"description",   label:"Factures"},
    {id:"tarifs",    icon:"sell",          label:"Tarifs"},
  ];

  async function addDevis(d){
    setDevis(prev=>[d,...prev]);
  }

  return(
    <div style={{minHeight:"100dvh",background:N.surface,fontFamily:"'Hanken Grotesk',sans-serif",
      color:N.text,paddingTop:64,paddingBottom:80,position:"relative",overflow:"hidden"}}>

      {/* Decorative blobs */}
      <div style={{position:"fixed",top:"-10%",right:"-5%",width:"40%",height:"40%",
        borderRadius:"50%",background:"rgba(62,221,199,.05)",filter:"blur(80px)",
        pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"-5%",left:"-5%",width:"30%",height:"30%",
        borderRadius:"50%",background:"rgba(1,17,99,.04)",filter:"blur(80px)",
        pointerEvents:"none",zIndex:0}}/>

      {/* ── TOP NAV ── */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:50,
        background:N.white,borderBottom:`1px solid ${N.outline}20`,
        display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"0 16px",height:64}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:N.navy,
            display:"flex",alignItems:"center",justifyContent:"center",
            color:"#fff",fontSize:12,fontWeight:700,flexShrink:0}}>
            {initials}
          </div>
          <span style={{fontSize:20,fontWeight:700,color:N.navy,letterSpacing:"-0.3px"}}>DevisFlow</span>
        </div>
        <button style={{background:"none",border:"none",cursor:"pointer",padding:8,color:N.textSec}}>
          <span className="material-symbols-outlined" style={{fontSize:24}}>notifications</span>
        </button>
      </nav>

      {/* ── CONTENT ── */}
      <div style={{position:"relative",zIndex:1}}>
        {page==="devis"  && <MobileDevisPage devis={devis} onDone={addDevis} user={user}/>}
        {page==="dashboard" && <MobileDashboard devis={devis} onNewDevis={()=>setPage("devis")}/>}
        {page==="factures" && <MobileFactures/>}
        {page==="tarifs"   && <MobileTarifs/>}
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,
        background:N.white,borderTop:`1px solid rgba(198,197,211,.3)`,
        display:"flex",justifyContent:"space-around",alignItems:"center",
        padding:"8px 8px env(safe-area-inset-bottom,8px)",
        boxShadow:"0 -4px 20px rgba(30,43,120,.05)"}}>
        {TABS.map(t=>{
          const active = page===t.id;
          return(
            <button key={t.id} onClick={()=>setPage(t.id)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                gap:2,border:"none",cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",
                background:active?"rgba(138,76,252,.12)":"transparent",
                borderRadius:12,minWidth:60,transition:"all .15s",
                color:active?"#8a4cfc":N.textSec}}>
              <span className="material-symbols-outlined" style={{fontSize:22,
                fontVariationSettings:active?"'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24":"'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24"}}>
                {t.icon}
              </span>
              <span style={{fontSize:10,fontWeight:active?600:400,letterSpacing:"0.04em",
                fontFamily:"'JetBrains Mono',monospace"}}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@600&display=swap');
        .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;font-family:'Material Symbols Outlined';}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}
        *{box-sizing:border-box}
      `}</style>
    </div>
  );
}

/* ─── Mobile Devis Page ─────────────────── */
function MobileDevisPage({devis, onDone, user}){
  const [desc,setDesc]=useState("");
  const [client,setClient]=useState("");
  const [email,setEmail]=useState("");
  const [gen,setGen]=useState(null);
  const [loading,setLoading]=useState(false);
  const [sent,setSent]=useState(false);
  const [focused,setFocused]=useState(false);

  const EXAMPLES=[
    {icon:"📸","label":"Shooting photo événementiel"},
    {icon:"🖥️","label":"Maintenance serveur (1 an)"},
    {icon:"✍️","label":"Rédaction 4 articles SEO"},
    {icon:"🎨","label":"Design logo + charte"},
    {icon:"⚡","label":"Dev app mobile React"},
  ];

  async function generate(){
    if(!desc.trim()&&!client.trim()) return;
    setLoading(true);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          messages:[{role:"user",content:
            `Génère un devis professionnel français. Client: ${client||"Client"}. `+
            `Description: ${desc||"prestation professionnelle"}.
`+
            `Réponds UNIQUEMENT avec JSON sans backticks:
`+
            `{"client":"nom client","lignes":[{"desc":"libellé","detail":"sous-détail","qte":1,"pu":800}],"conditions":"conditions","delai":"délai"}`
          }]})
      });
      const d=await r.json();
      const txt=d.content.map(b=>b.text||"").join("").replace(/\`\`\`json|\`\`\`/g,"").trim();
      setGen(JSON.parse(txt));
    }catch{
      setGen({
        client:client||"TechCorp Solutions",
        lignes:[
          {desc:"Prestation principale",detail:desc||"Selon cahier des charges",qte:1,pu:1200},
          {desc:"Support post-livraison",detail:"Assistance technique (1 mois)",qte:1,pu:450},
        ],
        conditions:"Règlement à 30 jours à réception de facture. Pénalités de retard : 3 fois le taux d'intérêt légal.",
        delai:"3 à 4 semaines ouvrées"
      });
    }
    setLoading(false);
  }

  function send(){
    const total=gen?.lignes.reduce((s,l)=>s+l.qte*(l.pu||0),0)||1200;
    const c = gen?.client||client||"Client";
    onDone({
      id:`DEV-${String(Math.floor(Math.random()*90000)+10000)}`,
      client:c, email, montant:total, statut:"envoyé",
      date:new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),
      type:"Devis IA", lignes:gen?.lignes||[]
    });
    setSent(true);
    setGen(null); setDesc(""); setClient(""); setEmail("");
    setTimeout(()=>setSent(false),3000);
  }

  const ref = `F${new Date().getFullYear()}${String(Math.floor(Math.random()*90000)+10000)}`;
  const ht = gen?.lignes.reduce((s,l)=>s+l.qte*(l.pu||0),0)||0;
  const tva = Math.round(ht*.2);
  const now = new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"});

  return(
    <div style={{padding:"0 16px 16px",animation:"fadeUp .3s ease"}}>

      {/* Page title */}
      <div style={{marginBottom:20,paddingTop:8}}>
        <h1 style={{fontSize:26,fontWeight:700,color:N.text,margin:"0 0 4px",letterSpacing:"-0.4px"}}>
          Assistant Devis IA
        </h1>
        <p style={{fontSize:13,color:N.textSec,margin:0,lineHeight:1.5}}>
          Transformez vos besoins en devis professionnels en quelques secondes.
        </p>
      </div>

      {/* AI Status badge */}
      <div style={{background:"rgba(62,221,199,.1)",border:"1px solid rgba(62,221,199,.3)",
        borderRadius:20,padding:"6px 14px",display:"inline-flex",alignItems:"center",gap:6,
        marginBottom:20}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:"#3cddc7",display:"inline-block"}}/>
        <span style={{fontSize:12,fontWeight:600,color:"#005047",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.04em"}}>
          Moteur AI v4.0 Actif
        </span>
      </div>

      {/* Input card */}
      <div style={{background:N.white,borderRadius:16,padding:20,marginBottom:16,
        border:`1px solid ${N.outline}20`,boxShadow:"0 2px 16px rgba(1,17,99,.06)",
        transition:"transform .2s",transform:focused?"scale(1.01)":"scale(1)"}}>
        <h3 style={{fontSize:16,fontWeight:700,margin:"0 0 6px"}}>Expression du besoin</h3>
        <p style={{fontSize:12,color:N.textSec,margin:"0 0 14px",lineHeight:1.5}}>
          Décrivez votre prestation, vos tarifs ou importez une discussion client. Notre IA s'occupe de la structure.
        </p>

        {/* Client field */}
        <input value={client} onChange={e=>setClient(e.target.value)}
          placeholder="Nom du client (ex: TechCorp Solutions)"
          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${N.outline}30`,
            background:N.surface,fontSize:13,color:N.text,marginBottom:10,fontFamily:"inherit",outline:"none"}}
          onFocus={e=>e.target.style.borderColor=N.violet}
          onBlur={e=>e.target.style.borderColor=`${N.outline}30`}/>

        {/* Textarea */}
        <div style={{position:"relative",border:`1px solid ${N.outline}30`,borderRadius:12,
          background:N.surface,transition:"border-color .2s"}}>
          <textarea
            value={desc} onChange={e=>setDesc(e.target.value)}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            placeholder={`Ex: Génère-moi un devis pour une formation de 2 jours sur React pour 5 personnes chez TechCorp. Tarif: 800€/jour...`}
            style={{width:"100%",padding:"14px 14px 48px",borderRadius:12,border:"none",
              fontSize:13,height:130,resize:"none",fontFamily:"inherit",lineHeight:1.55,
              color:N.text,background:"transparent",outline:"none"}}/>
          <div style={{position:"absolute",bottom:10,right:10,display:"flex",gap:8}}>
            <button style={{width:36,height:36,borderRadius:"50%",background:N.surfaceHigh,
              border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span className="material-symbols-outlined" style={{fontSize:18,color:N.textSec}}>mic</span>
            </button>
            <button style={{width:36,height:36,borderRadius:"50%",background:N.surfaceHigh,
              border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span className="material-symbols-outlined" style={{fontSize:18,color:N.textSec}}>attach_file</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick examples */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:600,color:N.textSec,letterSpacing:"0.06em",
          textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>
          Exemples rapides
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {EXAMPLES.map(ex=>(
            <button key={ex.label} onClick={()=>setDesc(ex.label)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                background:N.white,border:`1px solid ${N.outline}20`,borderRadius:12,
                fontSize:13,cursor:"pointer",fontFamily:"inherit",color:N.text,
                textAlign:"left",boxShadow:"0 1px 4px rgba(1,17,99,.04)",
                transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=N.surfaceHigh}
              onMouseLeave={e=>e.currentTarget.style.background=N.white}>
              <span>{ex.icon}</span>{ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button onClick={generate} disabled={loading||(!desc.trim()&&!client.trim())}
        style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
          background:loading||(!desc.trim()&&!client.trim())
            ?"#ccc"
            :"linear-gradient(135deg, #3cddc7 0%, #00d2b4 100%)",
          color:loading||(!desc.trim()&&!client.trim())?N.textSec:"#003b34",
          fontSize:15,fontWeight:700,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:10,
          boxShadow:"0 4px 16px rgba(62,221,199,.4)",marginBottom:24,
          transition:"all .2s"}}>
        {loading
          ?<><span className="material-symbols-outlined" style={{animation:"spin 1s linear infinite",fontSize:20}}>sync</span> Analyse en cours…</>
          :<><span className="material-symbols-outlined" style={{fontSize:20}}>auto_awesome</span> Générer avec l&apos;IA</>}
      </button>

      {/* Success toast */}
      {sent&&(
        <div style={{background:"#ecfdf5",border:"1px solid #6ee7b7",borderRadius:12,
          padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:8,
          color:"#059669",fontSize:13,fontWeight:500,animation:"fadeUp .3s ease"}}>
          <span className="material-symbols-outlined" style={{fontSize:18}}>check_circle</span>
          Devis enregistré avec succès !
        </div>
      )}

      {/* Document preview */}
      {gen&&(
        <div style={{animation:"fadeUp .4s ease"}}>
          {/* Draft header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{background:N.violet,color:"#fff",padding:"4px 10px",borderRadius:8,
                fontSize:10,fontWeight:700,letterSpacing:"0.05em",fontFamily:"'JetBrains Mono',monospace"}}>
                BROUILLON IA
              </div>
              <span style={{fontSize:12,color:N.textSec}}>
                Dernière modification : {new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
              </span>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button style={{width:36,height:36,background:N.white,border:`1px solid ${N.outline}30`,
                borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
                <span className="material-symbols-outlined" style={{fontSize:18,color:N.textSec}}>edit</span>
              </button>
              <button style={{width:36,height:36,background:N.white,border:`1px solid ${N.outline}30`,
                borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
                <span className="material-symbols-outlined" style={{fontSize:18,color:N.textSec}}>file_download</span>
              </button>
            </div>
          </div>

          {/* Invoice document */}
          <div style={{background:N.white,borderRadius:16,padding:20,
            boxShadow:"0 8px 32px rgba(1,17,99,.12)",marginBottom:16,position:"relative",overflow:"hidden"}}>

            {/* Watermark */}
            <div style={{position:"absolute",top:20,right:10,opacity:0.03,pointerEvents:"none",fontSize:120}}>
              <span className="material-symbols-outlined">verified_user</span>
            </div>

            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:20,fontWeight:700,color:N.navy,letterSpacing:"-0.3px",marginBottom:2}}>
                  DEVIS {ref}
                </div>
                <div style={{fontSize:12,color:N.textSec}}>Date : {now}</div>
              </div>
              <div style={{width:52,height:52,background:N.navy,borderRadius:12,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#fff",fontSize:14,fontWeight:700,fontStyle:"italic",flexShrink:0}}>
                {(user.company||user.name||"DF").slice(0,3)}.
              </div>
            </div>

            {/* Émetteur / Destinataire */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:N.textSec,textTransform:"uppercase",
                  letterSpacing:"0.08em",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>Émetteur</div>
                <div style={{fontWeight:700,fontSize:13}}>{user.company||user.name||"Mon Entreprise"}</div>
                <div style={{fontSize:11,color:N.textSec,lineHeight:1.6}}>
                  {user.email||"contact@monentreprise.fr"}
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:N.textSec,textTransform:"uppercase",
                  letterSpacing:"0.08em",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>Destinataire</div>
                <div style={{fontWeight:700,fontSize:13}}>{gen.client||client||"Client"}</div>
                {email&&<div style={{fontSize:11,color:N.textSec}}>{email}</div>}
              </div>
            </div>

            {/* Table */}
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:16,minWidth:280}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${N.outline}30`}}>
                    {["DÉTAIL","PU HT","QTÉ","TOTAL HT"].map((h,i)=>(
                      <th key={h} style={{padding:"8px 0",textAlign:i===0?"left":"right",
                        fontSize:9,fontWeight:600,color:N.textSec,letterSpacing:"0.08em",
                        fontFamily:"'JetBrains Mono',monospace"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gen.lignes.map((l,i)=>{
                    const t=l.qte*(l.pu||0);
                    return(
                      <tr key={i} style={{borderBottom:`1px solid rgba(198,197,211,.2)`}}>
                        <td style={{padding:"10px 0"}}>
                          <div style={{fontWeight:600,fontSize:12}}>{l.desc}</div>
                          {l.detail&&<div style={{fontSize:10,color:N.textSec,fontStyle:"italic"}}>{l.detail}</div>}
                        </td>
                        <td style={{padding:"10px 0",textAlign:"right",fontSize:11,whiteSpace:"nowrap"}}>
                          {l.pu?`${l.pu.toLocaleString("fr-FR")},00 €`:"Inclus"}
                        </td>
                        <td style={{padding:"10px 0",textAlign:"right",fontSize:11}}>{l.qte}</td>
                        <td style={{padding:"10px 0",textAlign:"right",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>
                          {t?`${t.toLocaleString("fr-FR")},00 €`:"—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
              <div style={{width:200}}>
                {[["Total HT",`${ht.toLocaleString("fr-FR")},00 €`],
                  ["TVA (20%)",`${tva.toLocaleString("fr-FR")},00 €`]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",
                    padding:"4px 0",fontSize:12}}>
                    <span style={{color:N.textSec}}>{k}</span>
                    <span style={{fontWeight:600}}>{v}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",
                  borderTop:`1px solid ${N.navy}`,paddingTop:6,marginTop:4}}>
                  <span style={{fontWeight:700,color:N.navy,fontSize:13}}>Total TTC</span>
                  <span style={{fontWeight:700,color:N.navy,fontSize:16}}>
                    {(ht+tva).toLocaleString("fr-FR")},00 €
                  </span>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div style={{borderTop:`1px solid rgba(198,197,211,.2)`,paddingTop:12}}>
              <div style={{fontSize:9,fontWeight:700,color:N.textSec,textTransform:"uppercase",
                letterSpacing:"0.08em",marginBottom:4}}>Conditions de règlement</div>
              <div style={{fontSize:10,color:N.textSec,lineHeight:1.6}}>{gen.conditions}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={send}
              style={{width:"100%",padding:"14px",background:N.navy,color:"#fff",border:"none",
                borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                boxShadow:"0 4px 14px rgba(1,17,99,.25)"}}>
              <span className="material-symbols-outlined" style={{fontSize:20}}>send</span>
              Envoyer au client
            </button>
            <button style={{width:"100%",padding:"14px",background:N.white,
              border:`1px solid ${N.outline}30`,color:N.text,borderRadius:12,
              fontSize:14,fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              boxShadow:"0 2px 8px rgba(1,17,99,.06)"}}>
              <span className="material-symbols-outlined" style={{fontSize:20}}>content_copy</span>
              Convertir en facture
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Mobile Dashboard ──────────────────── */
function MobileDashboard({devis, onNewDevis}){
  const totalSigne = devis.filter(d=>d.statut==="signé").reduce((s,d)=>s+d.montant,0);
  const enCours = devis.filter(d=>["envoyé","en attente","relancé"].includes(d.statut)).length;

  return(
    <div style={{padding:"0 16px 16px",animation:"fadeUp .3s ease"}}>
      <div style={{paddingTop:8,marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:700,color:N.text,margin:"0 0 4px",letterSpacing:"-0.4px"}}>
          Bonjour 👋
        </h1>
        <p style={{fontSize:13,color:N.textSec,margin:0}}>Voici votre activité du jour</p>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        {[
          {l:"CA signé",v:fmt(totalSigne),icon:"trending_up",c:"#059669",bg:"#d1fae5"},
          {l:"En cours",v:enCours,icon:"description",c:N.violet,bg:"#eaddff"},
          {l:"Retards",v:"3",icon:"warning",c:"#dc2626",bg:"#fee2e2"},
          {l:"Ce mois",v:fmt(totalSigne+2400),icon:"payments",c:N.navy,bg:N.surfaceHigh},
        ].map((m,i)=>(
          <div key={i} style={{background:N.white,border:`1px solid ${N.outline}20`,
            borderRadius:14,padding:"16px 14px",boxShadow:"0 2px 8px rgba(1,17,99,.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:600,color:N.textSec,textTransform:"uppercase",
                letterSpacing:"0.05em",fontFamily:"'JetBrains Mono',monospace"}}>{m.l}</div>
              <div style={{width:28,height:28,borderRadius:8,background:m.bg,
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span className="material-symbols-outlined" style={{fontSize:15,color:m.c}}>{m.icon}</span>
              </div>
            </div>
            <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.3px"}}>{m.v}</div>
          </div>
        ))}
      </div>

      {/* New Quote CTA */}
      <button onClick={onNewDevis}
        style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#712ae2,#8a4cfc)",
          color:"#fff",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16,
          boxShadow:"0 4px 16px rgba(113,42,226,.35)"}}>
        <span className="material-symbols-outlined" style={{fontSize:20}}>add</span>
        Nouveau devis IA
      </button>

      {/* Recent devis */}
      <div style={{background:N.white,borderRadius:16,overflow:"hidden",
        border:`1px solid ${N.outline}20`,boxShadow:"0 2px 8px rgba(1,17,99,.06)"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${N.outline}20`,
          fontSize:14,fontWeight:600,color:N.text}}>Derniers devis</div>
        {devis.slice(0,5).map((d,i)=>{
          const s = {"signé":{c:"#059669",bg:"#d1fae5"},"envoyé":{c:N.navy,bg:N.surfaceHigh},
            "en attente":{c:"#d97706",bg:"#fef3c7"},"relancé":{c:N.violet,bg:"#eaddff"},
            "brouillon":{c:N.textSec,bg:N.surface}}[d.statut]||{c:N.textSec,bg:N.surface};
          return(
            <div key={d.id||i} style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"12px 16px",
              borderBottom:i<4?`1px solid ${N.surface}`:"none"}}>
              <div>
                <div style={{fontWeight:500,fontSize:13}}>{d.client}</div>
                <div style={{fontSize:11,color:N.textSec}}>{d.date}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontWeight:600,fontSize:13}}>{fmt(d.montant)}</span>
                <span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:600,
                  background:s.bg,color:s.c,whiteSpace:"nowrap"}}>
                  {d.statut.charAt(0).toUpperCase()+d.statut.slice(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Mobile Factures ───────────────────── */
function MobileFactures(){
  const data=[
    {id:"FAC-001",client:"Agence Lumino",date:"10 mai",montant:2880,statut:"payée"},
    {id:"FAC-002",client:"BioTech Lab",date:"2 mai",montant:6960,statut:"en attente"},
    {id:"FAC-003",client:"ComArt Studio",date:"1 avr",montant:888,statut:"en retard"},
    {id:"FAC-004",client:"Nexus Digital",date:"15 avr",montant:3840,statut:"payée"},
  ];
  const STATUS={"payée":{c:"#059669",bg:"#d1fae5",l:"PAID"},"en attente":{c:"#d97706",bg:"#fef3c7",l:"PENDING"},"en retard":{c:"#dc2626",bg:"#fee2e2",l:"OVERDUE"}};

  return(
    <div style={{padding:"0 16px 16px",animation:"fadeUp .3s ease"}}>
      <div style={{paddingTop:8,marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:700,color:N.text,margin:"0 0 4px",letterSpacing:"-0.4px"}}>Factures</h1>
        <p style={{fontSize:13,color:N.textSec,margin:0}}>4 factures · 2 en attente</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {data.map((f,i)=>{
          const s=STATUS[f.statut]||STATUS["en attente"];
          return(
            <div key={f.id} style={{background:N.white,borderRadius:14,padding:"16px",
              border:`1px solid ${N.outline}20`,boxShadow:"0 2px 8px rgba(1,17,99,.04)",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:N.violet,fontFamily:"'JetBrains Mono',monospace",marginBottom:2}}>{f.id}</div>
                <div style={{fontWeight:500,fontSize:14}}>{f.client}</div>
                <div style={{fontSize:11,color:N.textSec}}>{f.date}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{fmt(f.montant)}</div>
                <span style={{padding:"2px 10px",borderRadius:20,fontSize:9,fontWeight:700,
                  letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",
                  background:s.bg,color:s.c}}>{s.l}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Mobile Tarifs ─────────────────────── */
function MobileTarifs(){
  const [annual,setAnnual]=useState(false);
  const plans=[
    {id:"starter",name:"Starter",price:19,priceY:15,desc:"Pour démarrer",
      features:["5 devis/mois","Facturation basique","Export PDF"],cta:"Démarrer",c:N.textSec},
    {id:"pro",name:"Pro",price:39,priceY:31,featured:true,desc:"Pour les freelances",
      features:["Devis illimités","IA rédaction","Relances auto","Signature élec.","Support prioritaire"],
      cta:"Essai 14j gratuit",c:N.violet},
    {id:"business",name:"Business",price:79,priceY:63,desc:"Pour les agences",
      features:["Tout Pro inclus","Multi-users (5)","API & webhooks","Manager dédié"],
      cta:"Nous contacter",c:N.navy},
  ];
  return(
    <div style={{padding:"0 16px 16px",animation:"fadeUp .3s ease"}}>
      <div style={{paddingTop:8,marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:700,color:N.text,margin:"0 0 4px",letterSpacing:"-0.4px"}}>Tarifs</h1>
        <p style={{fontSize:13,color:N.textSec,margin:0}}>Sans engagement · résiliation immédiate</p>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:20}}>
        <span style={{fontSize:13,fontWeight:500,color:annual?N.textSec:N.text}}>Mensuel</span>
        <div onClick={()=>setAnnual(!annual)} style={{width:44,height:24,borderRadius:12,
          background:annual?N.violet:N.outline,cursor:"pointer",position:"relative",transition:"background .2s"}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",
            position:"absolute",top:2,left:annual?22:2,transition:"left .2s"}}/>
        </div>
        <span style={{fontSize:13,fontWeight:500,color:annual?N.text:N.textSec}}>
          Annuel <span style={{background:"#d1fae5",color:"#059669",padding:"1px 7px",borderRadius:20,fontSize:10,fontWeight:600,marginLeft:4}}>-20%</span>
        </span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {plans.map(p=>(
          <div key={p.id} style={{background:N.white,borderRadius:16,padding:"20px",
            border:p.featured?`2px solid ${N.violet}`:`1px solid ${N.outline}20`,
            boxShadow:p.featured?"0 8px 32px rgba(113,42,226,.15)":"0 2px 8px rgba(1,17,99,.04)",
            position:"relative"}}>
            {p.featured&&<div style={{position:"absolute",top:-12,left:20,
              background:N.violet,color:"#fff",padding:"2px 12px",borderRadius:20,
              fontSize:10,fontWeight:600}}>✦ Le plus populaire</div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:11,color:p.c,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{p.name}</div>
                <div style={{fontSize:13,color:N.textSec}}>{p.desc}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <span style={{fontSize:28,fontWeight:800,letterSpacing:"-0.5px"}}>{annual?p.priceY:p.price}€</span>
                <span style={{fontSize:11,color:N.textSec}}>/mois</span>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              {p.features.map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,fontSize:13}}>
                  <span className="material-symbols-outlined" style={{fontSize:14,color:"#059669"}}>check_circle</span>
                  {f}
                </div>
              ))}
            </div>
            <button style={{width:"100%",padding:"12px",borderRadius:10,border:"none",cursor:"pointer",
              fontSize:13,fontWeight:700,fontFamily:"inherit",
              background:p.featured?N.violet:p.id==="business"?N.navy:"#f1f5ff",
              color:p.featured||p.id==="business"?"#fff":N.text}}>
              {p.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   APP SHELL  — New UI (Navy + Violet)
═══════════════════════════════════════════ */

/* Design tokens matching the screenshot */
const N = {
  navy:"#011163", navyLight:"#1e2b78",
  violet:"#712ae2", violetLight:"#eaddff", violetDark:"#5a00c6",
  surface:"#f8f9ff", surfaceContainer:"#e5eeff", surfaceHigh:"#dce9ff",
  outline:"#c6c5d3", outlineStrong:"#767682",
  text:"#0b1c30", textSec:"#454651", textTer:"#767682",
  white:"#ffffff", teal:"#3cddc7",
  shadow:"0 2px 8px rgba(1,17,99,.08)", shadowLg:"0 8px 32px rgba(1,17,99,.12)",
};

const NAV=[
  {id:"dashboard", icon:"dashboard",      label:"Dashboard"},
  {id:"devis",     icon:"auto_awesome",   label:"AI Quote Creation"},
  {id:"factures",  icon:"receipt_long",   label:"Factures"},
  {id:"relances",  icon:"notifications",  label:"Relances"},
  {id:"tarifs",    icon:"payments",       label:"Abonnement"},
];

function NavLink({item, active, onClick}){
  return(
    <a onClick={onClick} style={{
      display:"flex",alignItems:"center",gap:16,
      padding:"10px 24px",cursor:"pointer",
      borderLeft:active?"4px solid #3cddc7":"4px solid transparent",
      background:active?"rgba(30,43,120,.08)":"transparent",
      color:active?N.navy:N.textSec,fontWeight:active?600:400,
      fontSize:15,transition:"all .15s",textDecoration:"none",
    }}
    onMouseEnter={e=>!active&&(e.currentTarget.style.background="rgba(229,238,255,.5)")}
    onMouseLeave={e=>!active&&(e.currentTarget.style.background="transparent")}>
      <span className="material-symbols-outlined" style={{fontSize:22,color:active?N.navy:N.textSec}}>{item.icon}</span>
      {item.label}
    </a>
  );
}

function AppShell({user,onLogout}){
  const isMobile = useIsMobile();
  const [page,setPage]=useState("devis");
  const [devis,setDevis]=useState([]);
  const [loadingDevis,setLoadingDevis]=useState(true);
  const [newOpen,setNewOpen]=useState(false);
  const [notify,setNotify]=useState(null);

  useEffect(()=>{
    if(user.id==="user_demo"){ setDevis(SEED_DEVIS); setLoadingDevis(false); return; }
    supabase.from("devis").select("*").order("created_at",{ascending:false})
      .then(({data})=>{ setDevis((data||[]).map(d=>({...d,client:d.client_name,email:d.client_email,date:new Date(d.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}))); setLoadingDevis(false); });
  },[user.id]);

  useEffect(()=>{
    if(window.location.search.includes("plan_success=1")){
      toast("🎉 Abonnement activé !","success");
      window.history.replaceState({},"",window.location.pathname);
    }
  },[]);

  function toast(msg,type="success"){
    setNotify({msg,type}); setTimeout(()=>setNotify(null),3500);
  }

  async function addDevis(d){
    if(user.id!=="user_demo"){
      const {data,error}=await supabase.from("devis").insert([{
        user_id:user.id,client_name:d.client,client_email:d.email,
        type:d.type,montant:d.montant,statut:"envoyé",lignes:d.lignes||[],
      }]).select().single();
      if(!error&&data) setDevis(prev=>[{...data,client:data.client_name,email:data.client_email,
        date:new Date(data.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})
      },...prev]);
    } else { setDevis(prev=>[d,...prev]); }
    toast("Devis envoyé avec succès !");
  }

  const totalSigne=devis.filter(d=>d.statut==="signé").reduce((s,d)=>s+d.montant,0);
  const enCours=devis.filter(d=>["envoyé","en attente","relancé"].includes(d.statut)).length;
  const tauxSign=devis.length?Math.round(devis.filter(d=>d.statut==="signé").length/devis.length*100):0;
  const initials=(user.name||user.email||"U").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  if(isMobile) return <MobileApp user={user} onLogout={onLogout} page={page} setPage={setPage}/>;

  return(
    <div style={{display:"flex",height:"100vh",background:N.surface,fontFamily:"'Hanken Grotesk','DM Sans',sans-serif",overflow:"hidden",color:N.text}}>

      {/* Toast */}
      {notify&&(
        <div style={{position:"fixed",top:18,right:18,zIndex:999,
          background:notify.type==="success"?"#ecfdf5":"#fef2f2",
          border:`1px solid ${notify.type==="success"?"#6ee7b7":"#fecaca"}`,
          color:notify.type==="success"?"#059669":"#dc2626",
          borderRadius:10,padding:"12px 18px",fontSize:13,fontWeight:500,
          display:"flex",alignItems:"center",gap:8,boxShadow:N.shadowLg,
          animation:"fadeUp .25s ease"}}>
          <span className="material-symbols-outlined" style={{fontSize:18}}>{notify.type==="success"?"check_circle":"error"}</span>
          {notify.msg}
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{width:260,background:N.surface,borderRight:`1px solid ${N.outline}`,
        display:"flex",flexDirection:"column",flexShrink:0,position:"relative",zIndex:10}}>

        {/* Logo */}
        <div style={{padding:"24px 24px 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:N.navy,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span className="material-symbols-outlined" style={{color:"#fff",fontSize:22}}>auto_awesome</span>
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:18,color:N.navy,letterSpacing:"-0.3px"}}>DevisFlow</div>
              <div style={{fontSize:10,color:N.textSec,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>AI-Driven Finance</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1}}>
          {NAV.map(n=><NavLink key={n.id} item={n} active={page===n.id&&!newOpen}
            onClick={()=>{setPage(n.id);setNewOpen(false);}}/>)}
        </nav>

        {/* New Quote CTA */}
        <div style={{padding:"16px"}}>
          <button onClick={()=>{setPage("devis");setNewOpen(false);}}
            style={{width:"100%",padding:"13px",background:N.violet,color:"#fff",
              border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              boxShadow:"0 4px 14px rgba(113,42,226,.3)",transition:"all .2s"}}>
            <span className="material-symbols-outlined" style={{fontSize:18}}>add</span>
            New Quote
          </button>
        </div>

        {/* Bottom */}
        <div style={{borderTop:`1px solid ${N.outline}`,padding:"12px 0"}}>
          <a onClick={()=>{}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 24px",cursor:"pointer",color:N.textSec,fontSize:14,textDecoration:"none"}}
            onMouseEnter={e=>e.currentTarget.style.background=N.surfaceContainer}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span className="material-symbols-outlined" style={{fontSize:20}}>help</span> Support
          </a>
          <a onClick={onLogout} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 24px",cursor:"pointer",color:N.textSec,fontSize:14,textDecoration:"none"}}
            onMouseEnter={e=>e.currentTarget.style.background=N.surfaceContainer}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span className="material-symbols-outlined" style={{fontSize:20}}>logout</span> Déconnexion
          </a>
        </div>

        {/* User */}
        <div style={{borderTop:`1px solid ${N.outline}`,padding:"16px 24px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:N.navy,
            display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:600,flexShrink:0}}>
            {initials}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:N.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name||user.email}</div>
            <div style={{fontSize:11,color:N.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.plan==="pro"?"Plan Pro ✓":"Essai gratuit"}</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column"}}>

        {/* Top bar */}
        <div className="topbar" style={{padding:"16px 32px",background:N.white,borderBottom:`1px solid ${N.outline}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 1px 0 rgba(0,0,0,.04)"}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,color:N.text,letterSpacing:"-0.3px"}}>
            {page==="dashboard"&&"Dashboard"}
            {page==="devis"&&"AI Quote Generator"}
            {page==="factures"&&"Factures"}
            {page==="relances"&&"Relances automatiques"}
            {page==="tarifs"&&"Abonnement & Tarifs"}
          </h2>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <button style={{background:"none",border:"none",cursor:"pointer",color:N.textSec,padding:4}}>
              <span className="material-symbols-outlined" style={{fontSize:22}}>notifications</span>
            </button>
            <button style={{background:"none",border:"none",cursor:"pointer",color:N.textSec,padding:4}}>
              <span className="material-symbols-outlined" style={{fontSize:22}}>settings</span>
            </button>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",
              border:`1px solid ${N.outline}`,borderRadius:20,background:N.surface}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:N.navy,
                display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:600}}>
                {initials}
              </div>
              <span style={{fontSize:11,fontWeight:600,color:N.navy,letterSpacing:"0.05em",textTransform:"uppercase",fontFamily:"monospace"}}>
                {user.company||"MON COMPTE"}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="page-content" style={{padding:32,flex:1,overflow:"auto"}}>
          {page==="dashboard"&&<DashboardNew devis={devis} totalSigne={totalSigne} enCours={enCours} tauxSign={tauxSign} onNewDevis={()=>{setPage("devis");setNewOpen(true);}}/>}
          {page==="devis"&&<AIQuotePage devis={devis} onDone={addDevis} user={user}/>}
          {page==="factures"&&<FactureStatic/>}
          {page==="relances"&&<RelancesStatic/>}
          {page==="tarifs"&&<Tarifs user={user}/>}
        </div>
      </main>

      {/* Mobile bottom nav — app native style */}
      <div className="mobile-nav" style={{display:"none"}}>
        {NAV.slice(0,4).map(n=>{
          const active = page===n.id;
          return(
            <button key={n.id} onClick={()=>{setPage(n.id);setNewOpen(false);}}
              style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",
                color:active?N.violet:N.textTer,padding:"4px 0",position:"relative"}}>
              {/* Active pill */}
              {active&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
                width:32,height:3,borderRadius:"0 0 3px 3px",background:N.violet}}/>}
              <div style={{width:40,height:28,borderRadius:8,
                background:active?"rgba(113,42,226,.1)":"transparent",
                display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                <span className="material-symbols-outlined" style={{fontSize:21,
                  fontVariationSettings:active?"'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24":"'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24"}}>
                  {n.icon}
                </span>
              </div>
              <span style={{fontSize:9,fontWeight:active?600:400,letterSpacing:"0.02em"}}>{n.label.split(" ")[0]}</span>
            </button>
          );
        })}
        {/* FAB New Quote */}
        <button onClick={()=>{setPage("devis");setNewOpen(false);}}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,
            background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",
            color:N.violet,padding:"4px 0"}}>
          <div style={{width:42,height:28,borderRadius:8,background:N.violet,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 2px 8px rgba(113,42,226,.35)"}}>
            <span className="material-symbols-outlined" style={{fontSize:21,color:"#fff"}}>add</span>
          </div>
          <span style={{fontSize:9,fontWeight:600,color:N.violet}}>New Quote</span>
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;font-family:'Material Symbols Outlined';}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:#d3e4fe;border-radius:10px}
        @media(max-width:768px){
          /* Sidebar cachée */
          aside{display:none !important}

          /* Bottom nav visible */
          .mobile-nav{
            display:flex !important;
            position:fixed;bottom:0;left:0;right:0;
            background:#fff;border-top:1px solid #c6c5d3;
            z-index:200;padding:6px 0 env(safe-area-inset-bottom,10px);
            box-shadow:0 -2px 12px rgba(1,17,99,.08);
          }

          /* Main content padding */
          main{ padding-bottom:72px !important; }

          /* Top bar compact */
          .topbar{ padding:12px 16px !important; }
          .topbar h2{ font-size:17px !important; }
          .topbar-actions{ gap:8px !important; }
          .topbar-search{ display:none !important; }
          .topbar-user-label{ display:none !important; }

          /* Page content */
          .page-content{ padding:16px !important; }

          /* KPI grid → 1 col sur très petit, 2 col sinon */
          .kpi-grid{ grid-template-columns:1fr 1fr !important; gap:10px !important; }

          /* Chart grid → colonne */
          .chart-ai-grid{ grid-template-columns:1fr !important; }
          .ai-relance-panel{ order:-1; }

          /* Invoice table scrollable */
          .invoice-table-wrap{ overflow-x:auto !important; }
          .invoice-table-wrap table{ min-width:600px; }

          /* AI Quote page → colonne */
          .quote-grid{ grid-template-columns:1fr !important; height:auto !important; }
          .quote-preview{ min-height:500px; }

          /* Form 2col → 1col */
          .form-2col{ grid-template-columns:1fr !important; }

          /* Plans → 1col */
          .plans-grid{ grid-template-columns:1fr !important; }

          /* Auth → cache left panel */
          .auth-left{ display:none !important; }
          .auth-right{ padding:24px 20px !important; }

          /* Hide chart on small screen */
          .revenue-chart{ display:none !important; }
        }

        @media(max-width:480px){
          .kpi-grid{ grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   DASHBOARD NEW  (style screenshot)
───────────────────────────────────────── */
function DashboardNew({devis, totalSigne, enCours, tauxSign, onNewDevis}){
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [remindersSent, setRemindersSent] = useState(false);
  const [checks, setChecks] = useState({sk:true, nv:true, bt:false});

  const LATE = [
    {k:"sk", init:"SK", name:"Skyline Corp",   days:"12 Days Late", c:"#dc2626", bg:"rgba(186,26,26,.1)"},
    {k:"nv", init:"NV", name:"Nova Ventures",  days:"5 Days Late",  c:N.textSec, bg:N.surfaceHigh},
    {k:"bt", init:"BT", name:"BlueTech Ltd",   days:"3 Days Late",  c:N.textSec, bg:N.surfaceHigh},
  ];

  const INVOICES = [
    {id:"#INV-2024-001", client:"Acme Solutions",   init:"A", date:"12 mai 2024", amount:"1 250,00 €", statut:"payée"},
    {id:"#INV-2024-002", client:"Skyline Corp",      init:"S", date:"10 mai 2024", amount:"3 400,00 €", statut:"en retard"},
    {id:"#INV-2024-003", client:"Velocity Digital",  init:"V", date:"8 mai 2024",  amount:"890,50 €",  statut:"en attente"},
  ];

  const STATUS_MAP = {
    "payée":      {label:"PAID",    c:"#00af9d", bg:"rgba(62,221,199,.15)"},
    "en retard":  {label:"OVERDUE", c:"#dc2626", bg:"rgba(186,26,26,.1)"},
    "en attente": {label:"PENDING", c:N.textSec, bg:N.surfaceHigh},
  };

  async function launchReminders(){
    setRemindersLoading(true);
    await new Promise(r=>setTimeout(r,2000));
    setRemindersLoading(false); setRemindersSent(true);
    setTimeout(()=>setRemindersSent(false), 3000);
  }

  // SVG line chart points
  const pts = [[0,80],[1,70],[2,55],[3,45],[4,35],[5,40],[6,30],[7,20],[8,10]];
  const proj = [[0,85],[1,78],[2,68],[3,60],[4,52],[5,50],[6,45],[7,42],[8,38]];
  const W=580, H=180;
  const toX = i => 40 + i*(W-60)/8;
  const toY = v => H - 20 - v*1.4;
  const line = pts.map((p,i)=>`${i===0?"M":"L"}${toX(i)},${toY(p[1])}`).join(" ");
  const linePr = proj.map((p,i)=>`${i===0?"M":"L"}${toX(i)},${toY(p[1])}`).join(" ");
  const area = `${line} L${toX(8)},${H-20} L${toX(0)},${H-20} Z`;
  const months = ["JAN","FÉV","MAR","AVR","MAI","JUN","JUL","AOÛ","SEP"];

  return(
    <div style={{animation:"fadeUp .3s ease"}}>

      {/* KPIs */}
      <div className="kpi-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        {[
          {label:"TOTAL REVENUE",    val:"124 500,00 €", sub:"+12.5% from last month", subC:"#059669", subIcon:"trending_up", icon:"account_balance_wallet", iconC:N.navy, iconBg:N.surfaceHigh},
          {label:"PENDING INVOICES", val:"32 120,45 €",  sub:"8 invoices awaiting approval", subC:N.textSec, subIcon:null, icon:"pending_actions", iconC:N.violet, iconBg:"#eaddff"},
          {label:"LATE PAYMENTS",    val:"4 210,00 €",   sub:"Action required for 3 clients", subC:"#dc2626", subIcon:null, icon:"warning", iconC:"#dc2626", iconBg:"rgba(186,26,26,.08)", isAlert:true},
        ].map((m,i)=>(
          <div key={i} style={{background:N.white,border:`1px solid ${m.isAlert?"rgba(186,26,26,.2)":N.outline}`,
            borderRadius:12,padding:"20px 24px",boxShadow:N.shadow,
            transition:"transform .2s",cursor:"default"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:600,color:m.isAlert?"#dc2626":N.textSec,
                letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{m.label}</div>
              <div style={{width:36,height:36,borderRadius:8,background:m.iconBg,
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span className="material-symbols-outlined" style={{fontSize:20,color:m.iconC}}>{m.icon}</span>
              </div>
            </div>
            <div style={{fontSize:28,fontWeight:700,color:m.isAlert?"#dc2626":N.text,
              letterSpacing:"-0.5px",marginBottom:6}}>{m.val}</div>
            <div style={{fontSize:12,color:m.subC,display:"flex",alignItems:"center",gap:4}}>
              {m.subIcon&&<span className="material-symbols-outlined" style={{fontSize:14}}>{m.subIcon}</span>}
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + AI Relance */}
      <div className="chart-ai-grid" style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16,marginBottom:24}}>
        {/* Line Chart */}
        <div style={{background:N.white,border:`1px solid ${N.outline}`,borderRadius:12,
          padding:"24px",boxShadow:N.shadow}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:N.text,letterSpacing:"-0.3px"}}>Revenue Evolution</div>
              <div style={{fontSize:12,color:N.textSec}}>Realized vs. Projected performance</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:16,fontSize:12,color:N.textSec}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:N.navy}}/>Real
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#c6c5d3"}}/>Projected
              </div>
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H+20}`} style={{overflow:"visible"}}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={N.navy} stopOpacity="0.12"/>
                <stop offset="100%" stopColor={N.navy} stopOpacity="0"/>
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0,1,2,3].map(i=>(
              <line key={i} x1="40" y1={H-20-i*45} x2={W-20} y2={H-20-i*45}
                stroke="#e5eeff" strokeWidth="1"/>
            ))}
            {/* Area fill */}
            <path d={area} fill="url(#areaGrad)"/>
            {/* Projected line */}
            <path d={linePr} fill="none" stroke="#c6c5d3" strokeWidth="2" strokeDasharray="6,4"/>
            {/* Main line */}
            <path d={line} fill="none" stroke={N.navy} strokeWidth="2.5" strokeLinejoin="round"/>
            {/* Dots */}
            {pts.map((p,i)=>(
              <circle key={i} cx={toX(i)} cy={toY(p[1])} r="4" fill={N.white} stroke={N.navy} strokeWidth="2.5"/>
            ))}
            {/* Last dot highlight */}
            <circle cx={toX(8)} cy={toY(pts[8][1])} r="6" fill={N.navy}/>
            {/* X labels */}
            {months.map((m,i)=>(
              <text key={m} x={toX(i)} y={H+16} textAnchor="middle"
                fontSize="10" fill={N.textTer} fontFamily="'JetBrains Mono',monospace">{m}</text>
            ))}
          </svg>
        </div>

        {/* AI Relance panel */}
        <div style={{background:N.white,border:`1px solid rgba(138,76,252,.2)`,borderRadius:12,
          padding:"20px",display:"flex",flexDirection:"column",
          boxShadow:"0 0 15px rgba(138,76,252,.1)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span className="material-symbols-outlined" style={{fontSize:20,color:N.violet}}>auto_awesome</span>
            <div style={{fontSize:17,fontWeight:700,color:N.violet}}>AI Relance</div>
          </div>
          <p style={{fontSize:12,color:N.textSec,lineHeight:1.5,marginBottom:16}}>
            L'IA a détecté 3 clients à risque élevé de retard. Relances automatiques prêtes.
          </p>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {LATE.map(l=>(
              <div key={l.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"10px 12px",background:N.surface,borderRadius:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:l.bg,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:l.c,fontSize:11,fontWeight:700}}>{l.init}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:N.text}}>{l.name}</div>
                    <div style={{fontSize:10,fontWeight:600,color:l.c,letterSpacing:"0.05em",
                      textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{l.days}</div>
                  </div>
                </div>
                <div onClick={()=>setChecks({...checks,[l.k]:!checks[l.k]})}
                  style={{width:20,height:20,borderRadius:5,border:`2px solid ${checks[l.k]?N.violet:N.outline}`,
                    background:checks[l.k]?N.violet:"transparent",cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}>
                  {checks[l.k]&&<span className="material-symbols-outlined" style={{fontSize:14,color:"#fff"}}>check</span>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={launchReminders} disabled={remindersLoading}
            style={{width:"100%",padding:"13px",background:remindersSent?"#059669":N.violet,
              color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              boxShadow:"0 4px 14px rgba(113,42,226,.3)",transition:"all .2s",
              transform:"scale(1)"}}>
            {remindersLoading
              ?<><span className="material-symbols-outlined" style={{animation:"spin 1s linear infinite",fontSize:18}}>sync</span>Sending…</>
              :remindersSent
              ?<><span className="material-symbols-outlined" style={{fontSize:18}}>check_circle</span>Reminders Sent!</>
              :<><span className="material-symbols-outlined" style={{fontSize:18}}>send</span>Launch Reminders</>}
          </button>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="invoice-table-wrap" style={{background:N.white,border:`1px solid ${N.outline}`,borderRadius:12,overflow:"hidden",boxShadow:N.shadow}}>
        <div style={{padding:"18px 24px",borderBottom:`1px solid ${N.outline}`,
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:18,fontWeight:700,color:N.text}}>Recent Invoices</div>
          <button style={{display:"flex",alignItems:"center",gap:4,color:N.navy,
            fontSize:13,fontWeight:600,background:"none",border:"none",cursor:"pointer"}}>
            View All <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_forward</span>
          </button>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#eff4ff",borderBottom:`1px solid ${N.outline}`}}>
              {["INVOICE ID","CLIENT","DATE","AMOUNT","STATUS","ACTION"].map((h,i)=>(
                <th key={h} style={{padding:"12px 24px",textAlign:i===5?"right":"left",
                  fontSize:10,fontWeight:600,color:N.textSec,letterSpacing:"0.08em",
                  fontFamily:"'JetBrains Mono',monospace"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv,i)=>{
              const s=STATUS_MAP[inv.statut]||STATUS_MAP["en attente"];
              return(
                <tr key={inv.id} style={{borderBottom:i<INVOICES.length-1?`1px solid ${N.surfaceContainer}`:"none",
                  transition:"background .15s",cursor:"default"}}
                  onMouseEnter={e=>e.currentTarget.style.background=N.surface}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"14px 24px",fontSize:13,fontWeight:700,color:N.text}}>{inv.id}</td>
                  <td style={{padding:"14px 24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:N.surfaceContainer,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:N.navy,fontSize:12,fontWeight:700,flexShrink:0}}>{inv.init}</div>
                      <span style={{fontSize:13}}>{inv.client}</span>
                    </div>
                  </td>
                  <td style={{padding:"14px 24px",fontSize:13,color:N.textSec}}>{inv.date}</td>
                  <td style={{padding:"14px 24px",fontSize:13,fontWeight:700}}>{inv.amount}</td>
                  <td style={{padding:"14px 24px"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,
                      letterSpacing:"0.08em",textTransform:"uppercase",
                      background:s.bg,color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>
                      {s.label}
                    </span>
                  </td>
                  <td style={{padding:"14px 24px",textAlign:"right"}}>
                    <button style={{background:"none",border:"none",cursor:"pointer",color:N.textSec,padding:4}}>
                      <span className="material-symbols-outlined" style={{fontSize:20}}>more_horiz</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Quote CTA in sidebar (rendered as floating button on mobile) */}
    </div>
  );
}

/* ─────────────────────────────────────────
   AI QUOTE PAGE  (style screenshot)
───────────────────────────────────────── */
function AIQuotePage({devis, onDone, user}){
  const [desc,setDesc]=useState("");
  const [client,setClient]=useState("");
  const [email,setEmail]=useState("");
  const [type,setType]=useState("Développement web");
  const [gen,setGen]=useState(null);
  const [loading,setLoading]=useState(false);
  const [sent,setSent]=useState(false);

  const EXAMPLES=["Design UI/UX","Dev Web","Rédaction","Conseil Stratégie","Formation","Audit SEO"];

  async function generate(){
    if(!client.trim()) return;
    setLoading(true); setSent(false);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          messages:[{role:"user",content:
            `Génère un devis professionnel français. Client: ${client}. Prestation: ${type}. Description: ${desc||"prestation standard"}.
`+
            `Réponds UNIQUEMENT avec JSON sans backticks:
`+
            `{"intro":"phrase intro","lignes":[{"desc":"libellé","detail":"sous-détail","qte":1,"pu":1200}],"conditions":"conditions de paiement","delai":"délai"}`
          }]})
      });
      const d=await r.json();
      const txt=d.content.map(b=>b.text||"").join("").replace(/\`\`\`json|\`\`\`/g,"").trim();
      setGen(JSON.parse(txt));
    }catch{
      setGen({
        intro:`Proposition commerciale pour la prestation "${type}" selon votre cahier des charges.`,
        lignes:[{desc:type,detail:"Prestation principale selon brief",qte:1,pu:1200},{desc:"Révisions & ajustements",detail:"3 cycles de retours inclus",qte:1,pu:0},{desc:"Support post-livraison",detail:"Accompagnement 30 jours",qte:1,pu:150}],
        conditions:"50 % à la commande, 50 % à la livraison. Paiement sous 30 jours.",
        delai:"3 à 4 semaines ouvrées"
      });
    }
    setLoading(false);
  }

  function handleSend(){
    const total=gen?.lignes.reduce((s,l)=>s+l.qte*(l.pu||0),0)||1200;
    onDone({client,email,type,montant:total,lignes:gen?.lignes||[],
      date:new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})});
    setSent(true);
  }

  const ref=`#DEVIS ${new Date().getFullYear()}-${String(Math.floor(Math.random()*90000)+10000)}`;
  const ht=gen?.lignes.reduce((s,l)=>s+l.qte*(l.pu||0),0)||0;
  const tva=Math.round(ht*.2);

  return(
    <div className="quote-grid" style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:24,height:"calc(100vh - 160px)",minHeight:600,animation:"fadeUp .3s ease"}}>

      {/* LEFT — Input panel */}
      <div style={{display:"flex",flexDirection:"column",gap:16,overflowY:"auto"}}>
        {/* Form card */}
        <div style={{background:N.white,border:`1px solid ${N.outline}`,borderRadius:12,padding:24,boxShadow:"0 0 20px rgba(113,42,226,.08),0 0 0 1px rgba(113,42,226,.1)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <span className="material-symbols-outlined" style={{color:N.violet,fontSize:22}}>auto_awesome</span>
            <h3 style={{margin:0,fontSize:17,fontWeight:700,color:N.text}}>Générer un devis</h3>
          </div>
          <p style={{margin:"0 0 20px",fontSize:13,color:N.textSec,lineHeight:1.5}}>
            Décrivez votre projet en langage naturel. L'IA extrait les lignes, quantités et prix automatiquement.
          </p>

          {/* Client + Email */}
          <div className="form-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:N.textSec,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Client *</label>
              <input value={client} onChange={e=>setClient(e.target.value)} placeholder="Acme Corporation"
                style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${N.outline}`,
                  fontSize:13,background:N.surface,color:N.text,outline:"none",fontFamily:"inherit"}}
                onFocus={e=>e.target.style.borderColor=N.violet}
                onBlur={e=>e.target.style.borderColor=N.outline}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:N.textSec,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="contact@acme.com"
                style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${N.outline}`,
                  fontSize:13,background:N.surface,color:N.text,outline:"none",fontFamily:"inherit"}}
                onFocus={e=>e.target.style.borderColor=N.violet}
                onBlur={e=>e.target.style.borderColor=N.outline}/>
            </div>
          </div>

          {/* Textarea */}
          <div style={{marginBottom:14,position:"relative"}}>
            <label style={{fontSize:11,fontWeight:600,color:N.textSec,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Description du projet</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)}
              placeholder={`Ex: Créer un devis pour la refonte du site web d'Acme Corp. Inclut 5 pages custom à 400€ chacune, 2 rounds de révisions et une charte graphique pour 1500€...`}
              style={{width:"100%",padding:"12px",borderRadius:8,border:`1px solid ${N.outline}`,
                fontSize:13,height:110,resize:"vertical",fontFamily:"inherit",lineHeight:1.55,
                color:N.text,background:N.surface,outline:"none"}}
              onFocus={e=>e.target.style.borderColor=N.violet}
              onBlur={e=>e.target.style.borderColor=N.outline}/>
          </div>

          {/* Quick examples */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:N.textSec,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Exemples rapides</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {EXAMPLES.map(ex=>(
                <button key={ex} onClick={()=>setType(ex)}
                  style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${type===ex?N.violet:N.outline}`,
                    background:type===ex?N.violetLight:"transparent",
                    color:type===ex?N.violetDark:N.textSec,
                    fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={!client.trim()||loading}
            style={{width:"100%",padding:"13px",borderRadius:10,border:"none",
              background:!client.trim()?N.surfaceHigh:N.navy,
              color:!client.trim()?N.textSec:"#fff",
              fontSize:14,fontWeight:700,cursor:!client.trim()?"not-allowed":"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              boxShadow:client.trim()?"0 4px 14px rgba(1,17,99,.25)":"none",transition:"all .2s"}}>
            {loading
              ?<><span className="material-symbols-outlined" style={{fontSize:18,animation:"spin 1s linear infinite"}}>refresh</span> Génération en cours…</>
              :<><span className="material-symbols-outlined" style={{fontSize:18}}>auto_awesome</span> Generate Preview</>}
          </button>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            {icon:"verified",label:"AI ACCURACY",val:"98.4%",c:N.violet},
            {icon:"timer",label:"TIME SAVED",val:"~12m",c:"#0f766e"},
          ].map(s=>(
            <div key={s.label} style={{background:N.surfaceContainer,border:`1px solid ${N.outline}`,borderRadius:12,padding:16}}>
              <span className="material-symbols-outlined" style={{fontSize:24,color:s.c,display:"block",marginBottom:4}}>{s.icon}</span>
              <div style={{fontSize:10,fontWeight:600,color:N.navy,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"monospace",marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:22,fontWeight:700,color:N.text}}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Devis list mini */}
        {devis.length>0&&(
          <div style={{background:N.white,border:`1px solid ${N.outline}`,borderRadius:12,padding:16,boxShadow:N.shadow}}>
            <div style={{fontSize:12,fontWeight:600,color:N.textSec,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>Devis récents</div>
            {devis.slice(0,3).map((d,i)=>(
              <div key={d.id||i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"8px 0",borderBottom:i<2?`1px solid ${N.surface}`:"none",fontSize:13}}>
                <span style={{fontWeight:500}}>{d.client}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontWeight:600}}>{fmt(d.montant)}</span>
                  <Badge s={d.statut}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — Live Preview */}
      <div className="quote-preview" style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
        {/* Header actions */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:600,color:N.text}}>Live Preview</h3>
          {gen&&(
            <div style={{display:"flex",gap:8}}>
              <button style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
                background:N.white,color:N.navy,border:`1.5px solid ${N.navy}`,
                borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                <span className="material-symbols-outlined" style={{fontSize:16}}>send</span> Envoyer au client
              </button>
              <button onClick={handleSend} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
                background:sent?"#059669":N.violet,color:"#fff",border:"none",
                borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",transition:"background .2s"}}>
                <span className="material-symbols-outlined" style={{fontSize:16}}>{sent?"check":"receipt"}</span>
                {sent?"Enregistré !":"Convertir en facture"}
              </button>
            </div>
          )}
        </div>

        {/* Document */}
        <div style={{background:N.white,borderRadius:12,border:`1px solid ${N.outline}`,
          padding:36,flex:1,boxShadow:"0 8px 32px rgba(1,17,99,.08)",position:"relative",minHeight:600}}>

          {!gen&&!loading&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              height:"100%",minHeight:400,color:N.textSec,textAlign:"center",gap:12}}>
              <span className="material-symbols-outlined" style={{fontSize:48,color:N.outline}}>description</span>
              <div style={{fontSize:15,fontWeight:500}}>Le devis apparaîtra ici</div>
              <div style={{fontSize:13}}>Remplissez le formulaire et cliquez sur "Generate Preview"</div>
            </div>
          )}

          {loading&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              height:"100%",minHeight:400,gap:16}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:N.violetLight,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span className="material-symbols-outlined" style={{fontSize:28,color:N.violet,animation:"spin 2s linear infinite"}}>auto_awesome</span>
              </div>
              <div style={{fontWeight:600,fontSize:16,color:N.text}}>L'IA rédige votre devis…</div>
              <div style={{display:"flex",gap:6}}>
                {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:N.violet,
                  animation:`pulse 1.3s ${i*0.25}s ease-in-out infinite`}}/>)}
              </div>
            </div>
          )}

          {gen&&!loading&&(
            <>
              {/* AI Draft badge */}
              <div style={{position:"absolute",top:14,right:14,background:"rgba(62,221,199,.15)",
                color:"#005047",padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:600,
                display:"flex",alignItems:"center",gap:4,letterSpacing:"0.05em",fontFamily:"monospace"}}>
                <span className="material-symbols-outlined" style={{fontSize:12}}>auto_awesome</span> AI DRAFT
              </div>

              {/* Doc header */}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:24}}>
                <div>
                  <div style={{width:56,height:56,background:"rgba(1,17,99,.06)",borderRadius:12,
                    display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
                    <span className="material-symbols-outlined" style={{fontSize:32,color:N.navy}}>business</span>
                  </div>
                  <div style={{fontWeight:700,fontSize:15}}>DevisFlow Agency</div>
                  <div style={{fontSize:12,color:N.textSec}}>42 Innovation St, Paris, FR</div>
                  <div style={{fontSize:12,color:N.textSec}}>contact@devisflow.ai</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:32,fontWeight:700,color:N.navy,letterSpacing:"-0.5px",textTransform:"uppercase"}}>Devis</div>
                  <div style={{fontSize:11,fontWeight:600,color:N.violet,fontFamily:"monospace",letterSpacing:"0.05em"}}>{ref}</div>
                  <div style={{marginTop:12,fontSize:12,color:N.textSec,lineHeight:1.7}}>
                    Date : <strong style={{color:N.text}}>{new Date().toLocaleDateString("fr-FR")}</strong><br/>
                    Validité : <strong style={{color:N.text}}>30 jours</strong>
                  </div>
                </div>
              </div>

              {/* Recipient */}
              <div style={{background:"rgba(229,238,255,.4)",borderRadius:8,padding:"14px 16px",
                marginBottom:20,border:`1px solid rgba(198,197,211,.3)`}}>
                <div style={{fontSize:10,fontWeight:600,color:N.textSec,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>DESTINATAIRE</div>
                <div style={{fontWeight:700,fontSize:14}}>{client||"Client"}</div>
                {email&&<div style={{fontSize:12,color:N.textSec}}>{email}</div>}
              </div>

              {/* Table */}
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:16}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${N.outline}`}}>
                    {["DESCRIPTION","PU HT","QTÉ","TOTAL HT"].map((h,i)=>(
                      <th key={h} style={{padding:"8px 0",textAlign:i>0?"right":"left",
                        fontSize:10,fontWeight:600,color:N.textSec,letterSpacing:"0.06em",
                        fontFamily:"monospace"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{borderBottom:`1px solid rgba(198,197,211,.3)`}}>
                  {gen.lignes.map((l,i)=>{
                    const t=l.qte*(l.pu||0);
                    return(
                      <tr key={i} style={{borderBottom:`1px solid rgba(198,197,211,.2)`}}>
                        <td style={{padding:"12px 0"}}>
                          <div style={{fontWeight:600,fontSize:13}}>{l.desc}</div>
                          {l.detail&&<div style={{fontSize:11,color:N.textSec,fontStyle:"italic"}}>{l.detail}</div>}
                        </td>
                        <td style={{padding:"12px 0",textAlign:"right",fontSize:13}}>{l.pu?`${l.pu.toLocaleString("fr-FR")}.00 €`:"Inclus"}</td>
                        <td style={{padding:"12px 0",textAlign:"right",fontSize:13}}>{l.qte}</td>
                        <td style={{padding:"12px 0",textAlign:"right",fontSize:13,fontWeight:700}}>{t?`${t.toLocaleString("fr-FR")}.00 €`:"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}>
                <div style={{width:240}}>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:13}}>
                    <span style={{color:N.textSec}}>Total HT</span>
                    <span style={{fontWeight:600}}>{ht.toLocaleString("fr-FR")}.00 €</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:13}}>
                    <span style={{color:N.textSec}}>TVA (20%)</span>
                    <span style={{fontWeight:600}}>{tva.toLocaleString("fr-FR")}.00 €</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"10px 0 0",borderTop:`1px solid ${N.outline}`,marginTop:4}}>
                    <span style={{fontSize:16,fontWeight:700,color:N.navy}}>TOTAL TTC</span>
                    <span style={{fontSize:16,fontWeight:700,color:N.violet}}>{(ht+tva).toLocaleString("fr-FR")}.00 €</span>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                <div style={{background:N.surface,borderRadius:8,padding:"11px 14px",border:`1px solid ${N.outline}`}}>
                  <div style={{fontSize:10,fontWeight:600,color:N.textSec,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Règlement</div>
                  <div style={{fontSize:11,color:N.textSec,lineHeight:1.5}}>{gen.conditions}</div>
                </div>
                <div style={{background:N.surface,borderRadius:8,padding:"11px 14px",border:`1px solid ${N.outline}`}}>
                  <div style={{fontSize:10,fontWeight:600,color:N.textSec,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Délai</div>
                  <div style={{fontSize:11,color:N.textSec}}>{gen.delai}</div>
                </div>
              </div>

              {/* Footer */}
              <div style={{fontSize:10,color:N.textTer,borderTop:`1px solid rgba(198,197,211,.3)`,paddingTop:12,lineHeight:1.6}}>
                Devis valide pour une durée de 30 jours à compter de la date d'émission. RIB joint pour le règlement des acomptes.
                DevisFlow Agency SARL au capital de 10.000€ · SIRET 123 456 789 00010.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/* ─── Stubs ─────────────────────────────── */
function FactureStatic(){
  const data=[
    {id:"FAC-001",client:"Agence Lumino",date:"10 mai",ech:"10 juin",montant:2880,statut:"payée"},
    {id:"FAC-002",client:"BioTech Lab",date:"2 mai",ech:"2 juin",montant:6960,statut:"en attente"},
    {id:"FAC-003",client:"ComArt Studio",date:"1 avr",ech:"1 mai",montant:888,statut:"en retard"},
    {id:"FAC-004",client:"Nexus Digital",date:"15 avr",ech:"15 mai",montant:3840,statut:"payée"},
  ];
  return <div style={{animation:"fadeUp .3s ease"}}>
    <div style={{background:N.white,border:`1px solid ${N.outline}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 8px rgba(1,17,99,.08)"}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${N.outline}`,fontWeight:600,fontSize:14,background:N.surface}}>4 factures</div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"#fafbff",borderBottom:`1px solid ${N.outline}`}}>
          {["N°","Client","Émise le","Échéance","Montant TTC","Statut"].map(h=>(
            <th key={h} style={{padding:"10px 20px",textAlign:"left",fontSize:11,fontWeight:600,color:N.textSec,letterSpacing:"0.05em",textTransform:"uppercase"}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>{data.map((f,i)=>(
          <tr key={f.id} style={{borderBottom:i<data.length-1?`1px solid ${N.surface}`:"none"}}>
            <td style={{padding:"13px 20px",fontSize:13,color:N.violet,fontWeight:600}}>{f.id}</td>
            <td style={{padding:"13px 20px",fontWeight:500,fontSize:13}}>{f.client}</td>
            <td style={{padding:"13px 20px",fontSize:12,color:N.textSec}}>{f.date}</td>
            <td style={{padding:"13px 20px",fontSize:12,color:f.statut==="en retard"?"#dc2626":N.textSec,fontWeight:f.statut==="en retard"?600:400}}>{f.ech}</td>
            <td style={{padding:"13px 20px",fontWeight:600,fontSize:13}}>{fmt(f.montant)}</td>
            <td style={{padding:"13px 20px"}}><Badge s={f.statut}/></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </div>;
}

function RelancesStatic(){
  const [r,setR]=useState({j7:true,j14:true,j30:false});
  return <div style={{animation:"fadeUp .3s ease"}}>
    <div style={{background:N.white,border:`1px solid ${N.outline}`,borderRadius:12,padding:24,maxWidth:600,boxShadow:"0 2px 8px rgba(1,17,99,.08)"}}>
      <div style={{fontWeight:600,fontSize:15,marginBottom:6,color:N.text}}>Relances automatiques</div>
      <div style={{fontSize:13,color:N.textSec,marginBottom:20}}>Les emails partent sans action de votre part.</div>
      {[{k:"j7",l:"Relance J+7",d:"7 jours après l'envoi du devis"},{k:"j14",l:"Relance J+14",d:"14 jours sans réponse"},{k:"j30",l:"Relance J+30",d:"Dernière relance avant clôture"}].map(x=>(
        <div key={x.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"14px 16px",border:`1px solid ${r[x.k]?N.violet:N.outline}`,borderRadius:10,marginBottom:10,
          background:r[x.k]?"rgba(113,42,226,.04)":N.white,transition:"all .2s"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:N.text}}>{x.l}</div>
            <div style={{fontSize:12,color:N.textSec}}>{x.d}</div>
          </div>
          <div onClick={()=>setR({...r,[x.k]:!r[x.k]})} style={{width:42,height:24,borderRadius:12,
            background:r[x.k]?N.violet:N.outline,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",
              position:"absolute",top:2,left:r[x.k]?20:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
          </div>
        </div>
      ))}
    </div>
  </div>;
}

function Tarifs({user}){
  const [annual,setAnnual]=useState(false);
  const plans=[
    {id:"starter",name:"Starter",price:19,priceY:15,desc:"Pour démarrer",
      features:["5 devis / mois","Facturation basique","Relances manuelles","Export PDF"],cta:"Démarrer",color:N.textSec},
    {id:"pro",name:"Pro",price:39,priceY:31,featured:true,desc:"Pour les freelances actifs",
      features:["Devis illimités","IA rédaction devis","Relances auto J+7/J+14/J+30","Signature électronique","Dashboard avancé","Support prioritaire"],
      cta:"Commencer l'essai 14j",color:N.violet},
    {id:"business",name:"Business",price:79,priceY:63,desc:"Pour les agences",
      features:["Tout Pro inclus","Multi-utilisateurs (5)","API & webhooks","Comptabilité connectée","Manager dédié"],
      cta:"Nous contacter",color:N.navy},
  ];
  return <div style={{animation:"fadeUp .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:28}}>
      <span style={{fontSize:13,fontWeight:500,color:annual?N.textSec:N.text}}>Mensuel</span>
      <div onClick={()=>setAnnual(!annual)} style={{width:44,height:24,borderRadius:12,
        background:annual?N.violet:N.outline,cursor:"pointer",position:"relative",transition:"background .2s"}}>
        <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",
          position:"absolute",top:2,left:annual?22:2,transition:"left .2s"}}/>
      </div>
      <span style={{fontSize:13,fontWeight:500,color:annual?N.text:N.textSec}}>
        Annuel <span style={{background:"#d1fae5",color:"#059669",padding:"1px 8px",borderRadius:20,fontSize:11,fontWeight:600,marginLeft:4}}>-20%</span>
      </span>
    </div>
    <div className="plans-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,maxWidth:860,margin:"0 auto"}}>
      {plans.map(p=>(
        <div key={p.id} style={{background:N.white,borderRadius:14,padding:"24px",
          border:p.featured?`2px solid ${N.violet}`:`1px solid ${N.outline}`,
          position:"relative",boxShadow:p.featured?"0 8px 32px rgba(113,42,226,.15)":"0 2px 8px rgba(1,17,99,.06)"}}>
          {p.featured&&<div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",
            background:N.violet,color:"#fff",padding:"3px 16px",borderRadius:20,fontSize:11,fontWeight:600,
            whiteSpace:"nowrap"}}>✦ Le plus populaire</div>}
          <div style={{fontSize:11,color:p.color,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>{p.name}</div>
          <div style={{display:"flex",alignItems:"baseline",gap:2,marginBottom:2}}>
            <span style={{fontSize:32,fontWeight:800,letterSpacing:"-0.5px"}}>{annual?p.priceY:p.price}€</span>
            <span style={{fontSize:12,color:N.textSec}}>/mois</span>
          </div>
          <div style={{fontSize:12,color:N.textSec,marginBottom:16}}>{p.desc}</div>
          <div style={{borderTop:`1px solid ${N.surface}`,paddingTop:14,marginBottom:18}}>
            {p.features.map(f=>(
              <div key={f} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8,fontSize:13}}>
                <span className="material-symbols-outlined" style={{color:"#059669",fontSize:16,marginTop:1,flexShrink:0}}>check_circle</span>
                {f}
              </div>
            ))}
          </div>
          <button style={{width:"100%",padding:"11px",borderRadius:8,cursor:"pointer",
            fontSize:13,fontWeight:600,fontFamily:"inherit",border:"none",
            background:p.featured?N.violet:p.id==="business"?N.navy:"#f1f5ff",
            color:p.featured||p.id==="business"?"#fff":N.text}}>
            {p.cta}
          </button>
        </div>
      ))}
    </div>
  </div>;
}

/* ─── ROOT ─────────────────────────────── */
export default function DevisFlowApp(){
  const [user,setUser]=useState(null);
  const [screen,setScreen]=useState("landing"); // "landing" | "login" | "signup" | "app"

  if(user) return <AppShell user={user} onLogout={()=>{setUser(null);setScreen("landing");}}/>;

  if(screen==="landing") return (
    <LandingPage
      onGetStarted={()=>setScreen("signup")}
      onLogin={()=>setScreen("login")}
    />
  );

  return <AuthPage
    initialMode={screen}
    onLogin={u=>{setUser(u);setScreen("app");}}
    onBack={()=>setScreen("landing")}
  />;
}
