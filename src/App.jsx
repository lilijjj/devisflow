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
        <div style={{padding:"16px 32px",background:N.white,borderBottom:`1px solid ${N.outline}`,
          display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,
          boxShadow:"0 1px 0 rgba(0,0,0,.04)"}}>
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
        <div style={{padding:32,flex:1,overflow:"auto"}}>
          {page==="dashboard"&&<DashboardNew devis={devis} totalSigne={totalSigne} enCours={enCours} tauxSign={tauxSign} onNewDevis={()=>{setPage("devis");setNewOpen(true);}}/>}
          {page==="devis"&&<AIQuotePage devis={devis} onDone={addDevis} user={user}/>}
          {page==="factures"&&<FactureStatic/>}
          {page==="relances"&&<RelancesStatic/>}
          {page==="tarifs"&&<Tarifs user={user}/>}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="mobile-nav" style={{display:"none"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>{setPage(n.id);setNewOpen(false);}}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",
              color:page===n.id?N.navy:N.textTer,padding:"4px 0"}}>
            <span className="material-symbols-outlined" style={{fontSize:20}}>{n.icon}</span>
            <span style={{fontSize:9,fontWeight:page===n.id?600:400}}>{n.label}</span>
          </button>
        ))}
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
          aside{display:none !important}
          .mobile-nav{display:flex !important;position:fixed;bottom:0;left:0;right:0;
            background:#fff;border-top:1px solid #c6c5d3;z-index:100;padding:6px 0 10px;}
          main{padding-bottom:80px !important}
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16,marginBottom:24}}>
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
      <div style={{background:N.white,border:`1px solid ${N.outline}`,borderRadius:12,
        overflow:"hidden",boxShadow:N.shadow}}>
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:24,height:"calc(100vh - 160px)",minHeight:600,animation:"fadeUp .3s ease"}}>

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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
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
      <div style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,maxWidth:860,margin:"0 auto"}}>
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
  if(!user) return <AuthPage onLogin={setUser}/>;
  return <AppShell user={user} onLogout={()=>setUser(null)}/>;
}
