import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";

/* ─────────────────────────────────────────
   CONFIG  — à mettre dans .env.local
   REACT_APP_API_URL=http://localhost:4242
   REACT_APP_STRIPE_PK=pk_test_XXXX
───────────────────────────────────────── */
const API     = process.env.REACT_APP_API_URL    || "http://localhost:4242";
const STRIPE_PK = process.env.REACT_APP_STRIPE_PK || "pk_test_VOTRE_CLE_PUBLISHABLE";
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
   AUTH PAGE
═══════════════════════════════════════════ */
function AuthPage({onLogin}){
  const [mode,setMode]=useState("login");
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
    await new Promise(r=>setTimeout(r,800));
    if(mode==="login"){
      const u=MOCK_USERS.find(u=>u.email===email&&u.password===pass);
      u ? onLogin(u) : setErr({global:"Email ou mot de passe incorrect"});
    } else {
      const u={id:`user_${Date.now()}`,email,password:pass,name,
        company:company||"Mon entreprise",plan:"trial",
        avatar:name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"U"};
      MOCK_USERS.push(u); onLogin(u);
    }
    setLoad(false);
  }

  return(
    <div style={{minHeight:"100vh",display:"flex",background:"#F0F4FF",fontFamily:"'DM Sans',sans-serif"}}>
      {/* Left */}
      <div style={{flex:"0 0 420px",background:"#0F172A",display:"flex",flexDirection:"column",
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
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
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

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,maxWidth:860,margin:"0 auto"}}>
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:16}}>
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
      type:form.type});
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

/* ═══════════════════════════════════════════
   APP SHELL
═══════════════════════════════════════════ */
const NAV=[
  {id:"dashboard",icon:"ti-layout-dashboard",label:"Dashboard"},
  {id:"devis",icon:"ti-file-description",label:"Devis"},
  {id:"factures",icon:"ti-receipt",label:"Factures"},
  {id:"relances",icon:"ti-bell-ringing",label:"Relances"},
  {id:"tarifs",icon:"ti-credit-card",label:"Abonnement"},
];

function AppShell({user,onLogout}){
  const [page,setPage]=useState("dashboard");
  const [devis,setDevis]=useState(SEED_DEVIS);
  const [newOpen,setNewOpen]=useState(false);
  const [notify,setNotify]=useState(null);

  /* Vérifie si retour de Stripe (success) */
  useEffect(()=>{
    if(window.location.search.includes("plan_success=1")){
      toast("🎉 Abonnement activé ! Bienvenue dans l'aventure.",  "success");
      window.history.replaceState({},"",window.location.pathname);
    }
  },[]);

  function toast(msg,type="success"){
    setNotify({msg,type});
    setTimeout(()=>setNotify(null),3500);
  }

  const totalSigne=devis.filter(d=>d.statut==="signé").reduce((s,d)=>s+d.montant,0);
  const enCours=devis.filter(d=>["envoyé","en attente","relancé"].includes(d.statut)).length;
  const tauxSign=Math.round(devis.filter(d=>d.statut==="signé").length/devis.length*100);

  return(
    <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif",overflow:"hidden"}}>
      {notify&&(
        <div style={{position:"fixed",top:18,right:18,zIndex:999,
          background:notify.type==="success"?"#ECFDF5":T.redLight,
          border:`1px solid ${notify.type==="success"?"#6EE7B7":"#FECACA"}`,
          color:notify.type==="success"?T.green:T.red,
          borderRadius:10,padding:"12px 18px",fontSize:13,fontWeight:500,
          display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 30px rgba(0,0,0,.12)",
          animation:"fadeUp .25s ease"}}>
          <i className={`ti ${notify.type==="success"?"ti-circle-check":"ti-alert-circle"}`}/>
          {notify.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside style={{width:220,background:T.surface,borderRight:`1px solid ${T.border}`,
        display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"20px 18px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:9,background:T.blue,
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 2px 8px rgba(37,99,235,.35)"}}>
              <i className="ti ti-bolt" style={{fontSize:19,color:"#fff"}}/>
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:15,letterSpacing:"-0.3px"}}>DevisFlow</div>
              <div style={{fontSize:10,color:T.blue,fontWeight:500,background:T.blueLight,
                padding:"1px 7px",borderRadius:20,display:"inline-block",marginTop:1}}>
                {user.plan==="pro"?"Plan Pro ✓":"Essai 14j"}
              </div>
            </div>
          </div>
        </div>
        <nav style={{padding:"10px",flex:1}}>
          {NAV.map(n=>{
            const active=page===n.id&&!newOpen;
            return <button key={n.id} onClick={()=>{setPage(n.id);setNewOpen(false);}}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",
                borderRadius:8,border:"none",cursor:"pointer",marginBottom:2,textAlign:"left",
                fontFamily:"inherit",background:active?"#EEF3FE":"transparent",
                color:active?T.blue:T.textSec,fontWeight:active?500:400,fontSize:13,transition:"all .12s"}}>
              <i className={`ti ${n.icon}`} style={{fontSize:18}}/>
              {n.label}
              {n.id==="relances"&&<span style={{marginLeft:"auto",background:T.blue,color:"#fff",
                borderRadius:20,fontSize:10,padding:"1px 7px",fontWeight:600}}>3</span>}
              {n.id==="tarifs"&&user.plan==="trial"&&<span style={{marginLeft:"auto",background:T.yellowLight,
                color:T.yellow,borderRadius:20,fontSize:9,padding:"1px 7px",fontWeight:600}}>!</span>}
            </button>;
          })}
        </nav>
        {user.plan==="trial"&&(
          <div style={{margin:"0 10px 12px",padding:"14px",
            background:"linear-gradient(135deg,#EEF3FE,#F5F0FF)",
            borderRadius:10,border:`1px solid #C7D7FD`}}>
            <div style={{fontSize:12,fontWeight:600,color:T.blue,marginBottom:3}}>✦ 11 jours restants</div>
            <div style={{fontSize:11,color:T.textSec,lineHeight:1.5,marginBottom:9}}>Passez en Pro pour débloquer tout.</div>
            <Btn primary small full onClick={()=>{setPage("tarifs");setNewOpen(false);}}>Voir les tarifs →</Btn>
          </div>
        )}
        <div style={{padding:"12px",borderTop:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.bg}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <Avatar initials={user.avatar} size={32}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
              <div style={{fontSize:10,color:T.textTer,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
            </div>
            <button onClick={onLogout} style={{background:"none",border:"none",cursor:"pointer",color:T.textTer,padding:4,fontSize:16}}>
              <i className="ti ti-logout"/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"20px 28px",borderBottom:`1px solid ${T.border}`,background:T.surface,
          display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <h1 style={{margin:0,fontSize:20,fontWeight:700,letterSpacing:"-0.4px"}}>
              {page==="dashboard"&&`Bonjour, ${user.name.split(" ")[0]} 👋`}
              {page==="devis"&&"Devis"}
              {page==="factures"&&"Factures"}
              {page==="relances"&&"Relances automatiques"}
              {page==="tarifs"&&"Abonnement & Facturation"}
            </h1>
            <p style={{margin:"2px 0 0",fontSize:12,color:T.textSec}}>
              {page==="dashboard"&&new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
              {page==="devis"&&`${devis.length} devis · ${fmt(totalSigne)} signés`}
              {page==="factures"&&"4 factures · 2 en attente"}
              {page==="relances"&&"3 relances actives cette semaine"}
              {page==="tarifs"&&"Gérez votre abonnement Stripe"}
            </p>
          </div>
          {(page==="dashboard"||page==="devis")&&!newOpen&&(
            <Btn primary onClick={()=>{setPage("devis");setNewOpen(true);}}>
              <i className="ti ti-plus"/> Nouveau devis
            </Btn>
          )}
        </div>

        <div style={{padding:28,flex:1}}>
          {page==="dashboard"&&!newOpen&&<Dashboard devis={devis} totalSigne={totalSigne} enCours={enCours} tauxSign={tauxSign}/>}
          {page==="devis"&&!newOpen&&<DevisList devis={devis} toast={toast}/>}
          {page==="devis"&&newOpen&&<NewDevisWizard
            onDone={d=>{setDevis(p=>[d,...p]);setNewOpen(false);toast("Devis envoyé !");}}
            onCancel={()=>setNewOpen(false)}/>}
          {page==="factures"&&<FactureStatic/>}
          {page==="relances"&&<RelancesStatic/>}
          {page==="tarifs"&&<Tarifs user={user}/>}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
      `}</style>
    </div>
  );
}

/* Stubs simples pour factures & relances */
function FactureStatic(){
  const data=[
    {id:"FAC-001",client:"Agence Lumino",date:"10 mai 2025",ech:"10 juin 2025",montant:2880,statut:"payée"},
    {id:"FAC-002",client:"BioTech Lab",date:"2 mai 2025",ech:"2 juin 2025",montant:6960,statut:"en attente"},
    {id:"FAC-003",client:"ComArt Studio",date:"1 avr 2025",ech:"1 mai 2025",montant:888,statut:"en retard"},
    {id:"FAC-004",client:"Nexus Digital",date:"15 avr 2025",ech:"15 mai 2025",montant:3840,statut:"payée"},
  ];
  return <Card style={{padding:0,overflow:"hidden",animation:"fadeUp .3s ease"}}>
    <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`,fontWeight:600,fontSize:13,background:T.bg}}>4 factures</div>
    <table style={{width:"100%",borderCollapse:"collapse"}}>
      <thead><tr style={{background:"#FAFBFC",borderBottom:`1px solid ${T.border}`}}>
        {["N°","Client","Émise le","Échéance","Montant TTC","Statut"].map(h=>(
          <th key={h} style={{padding:"10px 18px",textAlign:"left",fontSize:11,fontWeight:500,color:T.textSec}}>{h}</th>
        ))}
      </tr></thead>
      <tbody>{data.map((f,i)=>(
        <tr key={f.id} style={{borderBottom:i<data.length-1?`1px solid ${T.bg}`:"none"}}>
          <td style={{padding:"12px 18px",fontSize:13,color:T.blue,fontWeight:500}}>{f.id}</td>
          <td style={{padding:"12px 18px",fontWeight:500,fontSize:13}}>{f.client}</td>
          <td style={{padding:"12px 18px",fontSize:12,color:T.textSec}}>{f.date}</td>
          <td style={{padding:"12px 18px",fontSize:12,color:f.statut==="en retard"?T.red:T.textSec,fontWeight:f.statut==="en retard"?600:400}}>{f.ech}</td>
          <td style={{padding:"12px 18px",fontWeight:600,fontSize:13}}>{fmt(f.montant)}</td>
          <td style={{padding:"12px 18px"}}><Badge s={f.statut}/></td>
        </tr>
      ))}</tbody>
    </table>
  </Card>;
}
function RelancesStatic(){
  const [r,setR]=useState({j7:true,j14:true,j30:false});
  return <div style={{animation:"fadeUp .3s ease"}}>
    <Card style={{padding:22}}>
      <div style={{fontWeight:600,fontSize:14,marginBottom:16}}>Relances automatiques</div>
      {[{k:"j7",l:"J+7 — Rappel doux"},{k:"j14",l:"J+14 — Relance directe"},{k:"j30",l:"J+30 — Dernière relance"}].map(x=>(
        <div key={x.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"13px",border:`1px solid ${r[x.k]?T.blue:T.border}`,borderRadius:9,marginBottom:10,
          background:r[x.k]?T.blueLight:"#fff"}}>
          <span style={{fontSize:13,fontWeight:500}}>{x.l}</span>
          <div onClick={()=>setR({...r,[x.k]:!r[x.k]})} style={{width:38,height:21,borderRadius:11,
            background:r[x.k]?T.blue:T.border,cursor:"pointer",position:"relative",transition:"background .2s"}}>
            <div style={{width:17,height:17,borderRadius:"50%",background:"#fff",
              position:"absolute",top:2,left:r[x.k]?19:2,transition:"left .2s"}}/>
          </div>
        </div>
      ))}
    </Card>
  </div>;
}

/* ─── ROOT ─────────────────────────────── */
export default function DevisFlowApp(){
  const [user,setUser]=useState(null);
  if(!user) return <AuthPage onLogin={setUser}/>;
  return <AppShell user={user} onLogout={()=>setUser(null)}/>;
}
