import{c as ge,Q as ve,O as je,r,t as P,j as e,R as ye,B as g,a1 as Ne,z as ke,C as m,b as $,d as V,a8 as E,x,e as p,Y as we,ai as Y,g as Z,aa as Ce,T as Je,S as W,Z as X,L as R,I as _e,X as Se,n as K,o as ee,p as se,q as te,s as v,aN as Me,_ as ae}from"./index-1760362772818.js";import{C as T}from"./check-circle-2-1760362772818.js";import{T as qe}from"./trending-up-1760362772818.js";const De=ge("Printer",[["polyline",{points:"6 9 6 2 18 2 18 9",key:"1306q4"}],["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["rect",{width:"12",height:"8",x:"6",y:"14",key:"5ipwut"}]]),Ae=()=>{const{isAdmin:F,isAdherent:le}=ve(),{toast:k}=je(),[A,ie]=r.useState([]),[d,re]=r.useState([]),[b,ne]=r.useState(null),[I,B]=r.useState([]),[c,w]=r.useState(null),[oe,j]=r.useState(!0),[C,G]=r.useState(""),[_,ce]=r.useState("all"),[S,de]=r.useState("all");r.useState("cards");const[o,M]=r.useState(!1),[J,y]=r.useState(null);r.useEffect(()=>{O()},[]);const O=async()=>{j(!0);try{const{data:s,error:t}=await P.from("members").select("*").not("passeport","is",null).order("last_name").order("first_name");if(t)throw t;const{data:l,error:a}=await P.from("passeport_validations").select("*").order("date_validation",{ascending:!1});if(a)throw a;ie(s||[]),re(l||[])}catch{k({title:"Erreur",description:"Impossible de charger les données",variant:"destructive"})}finally{j(!1)}},H=async s=>{j(!0);try{const{data:t,error:l}=await P.from("passeport_validations").select("*").eq("member_id",s).order("date_validation",{ascending:!1});if(l)throw l;B(t||[]),t&&t.length>0&&w(t[0])}catch{k({title:"Erreur",description:"Impossible de charger les validations",variant:"destructive"})}finally{j(!1)}},U=s=>{const t=A.find(l=>l.id===s);ne(t),B([]),w(null),t&&H(s)},ue=()=>{y({...c}),M(!0)},me=()=>{y(null),M(!1)},q=s=>{y(t=>({...t,competences:{...t.competences,[s]:!t.competences[s]}}))},pe=s=>{y(t=>({...t,observations:s}))},xe=async()=>{try{j(!0);const{error:s}=await P.from("passeport_validations").update({competences:J.competences,observations:J.observations}).eq("id",J.id);if(s)throw s;k({title:"Succès",description:"Le passeport a été mis à jour avec succès."}),await H(b.id),await O(),w(J),M(!1),y(null)}catch(s){k({title:"Erreur",description:"Impossible de mettre à jour le passeport.",variant:"destructive"}),console.error("Erreur de mise à jour:",s)}finally{j(!1)}},he=()=>{const s=window.open("","_blank");if(!s){k({title:"Erreur",description:"Impossible d'ouvrir la fenêtre d'impression. Vérifiez que les popups ne sont pas bloquées.",variant:"destructive"});return}const t=c,l=b,a=t.passeport_type.charAt(0).toUpperCase()+t.passeport_type.slice(1),n=t.module?` - Module ${t.module==="bloc"?"Bloc":"Difficulté"}`:"",h=Object.entries(t.competences||{}),i=h.filter(([Pe,fe])=>fe===!0).length,u=h.length,f=`<svg width="120" height="120" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <text x="100" y="120" font-family="Arial Black, sans-serif" font-size="80" font-weight="900" text-anchor="middle" fill="#1a1a1a">ALJ</text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#666">JONAGE</text>
    </svg>`,N=`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diplôme Passeport ${a}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 10px;
    }
    
    .diploma {
      background: white;
      width: 210mm;
      height: 297mm;
      padding: 30px 40px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      border: 15px solid ${t.passeport_type==="blanc"?"#3b82f6":t.passeport_type==="jaune"?"#eab308":t.passeport_type==="orange"?"#f97316":"#ef4444"};
      border-image: linear-gradient(135deg, 
        ${t.passeport_type==="blanc"?"#3b82f6, #60a5fa":t.passeport_type==="jaune"?"#eab308, #fbbf24":t.passeport_type==="orange"?"#f97316, #fb923c":"#ef4444, #f87171"}) 1;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .diploma::before {
      content: '';
      position: absolute;
      top: 35px;
      left: 35px;
      right: 35px;
      bottom: 35px;
      border: 2px solid rgba(0,0,0,0.1);
      pointer-events: none;
    }
    
    .logo {
      text-align: center;
      margin-bottom: 15px;
    }
    
    .logo img, .logo svg {
      width: 120px;
      height: auto;
      display: inline-block;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .club-name {
      font-size: 16px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .diploma-title {
      font-size: 42px;
      color: #1a1a1a;
      margin: 15px 0;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .subtitle {
      font-size: 18px;
      color: #666;
      font-style: italic;
    }
    
    .content {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 10px 0;
    }
    
    .awarded-to {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .recipient-name {
      font-size: 36px;
      color: #1a1a1a;
      font-weight: bold;
      margin: 12px 0;
      border-bottom: 3px solid ${t.passeport_type==="blanc"?"#3b82f6":t.passeport_type==="jaune"?"#eab308":t.passeport_type==="orange"?"#f97316":"#ef4444"};
      padding-bottom: 8px;
      display: inline-block;
    }
    
    .achievement {
      font-size: 14px;
      color: #444;
      margin: 15px auto;
      max-width: 600px;
      line-height: 1.6;
    }
    
    .details {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 15px auto;
      max-width: 600px;
      text-align: left;
    }
    
    .details-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 12px;
      color: #1a1a1a;
      text-align: center;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 14px;
      color: #555;
    }
    
    .detail-label {
      font-weight: bold;
      color: #333;
    }
    
    .comments {
      background: #fff9e6;
      padding: 15px;
      border-left: 4px solid ${t.passeport_type==="blanc"?"#3b82f6":t.passeport_type==="jaune"?"#eab308":t.passeport_type==="orange"?"#f97316":"#ef4444"};
      margin: 15px auto;
      max-width: 600px;
      border-radius: 5px;
      font-style: italic;
      color: #666;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e0e0e0;
    }
    
    .date-section, .signature-section {
      text-align: center;
      flex: 1;
    }
    
    .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .date, .validator-name {
      font-size: 14px;
      color: #1a1a1a;
      font-weight: bold;
    }
    
    .signature {
      font-family: 'Brush Script MT', cursive;
      font-size: 32px;
      color: ${t.passeport_type==="blanc"?"#3b82f6":t.passeport_type==="jaune"?"#eab308":t.passeport_type==="orange"?"#f97316":"#ef4444"};
      margin: 12px 0;
      transform: rotate(-5deg);
      font-weight: bold;
      font-style: italic;
    }
    
    .badge {
      position: absolute;
      top: 30px;
      right: 40px;
      width: 80px;
      height: 80px;
      background: ${t.passeport_type==="blanc"?"#3b82f6":t.passeport_type==="jaune"?"#eab308":t.passeport_type==="orange"?"#f97316":"#ef4444"};
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .badge-text {
      font-size: 10px;
      text-transform: uppercase;
    }
    
    .badge-score {
      font-size: 20px;
      margin: 3px 0;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .diploma {
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="diploma">
    <!-- Badge de réussite -->
    <div class="badge">
      <span class="badge-text">Réussite</span>
      <span class="badge-score">${i}/${u}</span>
    </div>
    
    <!-- Logo -->
    <div class="logo">
      ${f}
    </div>
    
    <!-- En-tête -->
    <div class="header">
      <div class="club-name">ALJ Escalade Amicalelaique Jonage</div>
      <div class="diploma-title">Diplôme</div>
      <div class="subtitle">Passeport ${a}${n}</div>
    </div>
    
    <!-- Contenu principal -->
    <div class="content">
      <div class="awarded-to">Ce diplôme est décerné à</div>
      <div class="recipient-name">${l.first_name} ${l.last_name}</div>
      
      <div class="achievement">
        En reconnaissance de sa réussite au <strong>Passeport ${a}${n}</strong>
        avec succès, ayant validé <strong>${i} compétences sur ${u}</strong>
        dans le domaine de l'escalade.
      </div>
      
      <!-- Détails -->
      <div class="details">
        <div class="details-title">Détails de la validation</div>
        <div class="detail-item">
          <span class="detail-label">Niveau :</span>
          <span>Passeport ${a}</span>
        </div>
        ${t.module?`
        <div class="detail-item">
          <span class="detail-label">Module :</span>
          <span>${t.module==="bloc"?"Bloc":"Difficulté"}</span>
        </div>
        `:""}
        <div class="detail-item">
          <span class="detail-label">Compétences validées :</span>
          <span>${i} / ${u}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Taux de réussite :</span>
          <span>${Math.round(i/u*100)}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Date de validation :</span>
          <span>${new Date(t.date_validation).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</span>
        </div>
      </div>
      
      ${t.observations?`
      <!-- Commentaires du validateur -->
      <div class="comments">
        <strong>Commentaire du validateur :</strong><br/>
        ${t.observations}
      </div>
      `:""}
    </div>
    
    <!-- Pied de page avec signature -->
    <div class="footer">
      <div class="date-section">
        <div class="label">Fait à Jonage, le</div>
        <div class="date">${new Date(t.date_validation).toLocaleDateString("fr-FR")}</div>
      </div>
      
      <div class="signature-section">
        <div class="label">Le validateur</div>
        <div class="signature">${t.validateur}</div>
        <div class="validator-name">${t.validateur}</div>
      </div>
    </div>
  </div>
  
  <script>
    // Lancer l'impression automatiquement
    window.onload = function() {
      window.print();
    };
  <\/script>
</body>
</html>
    `;s.document.write(N),s.document.close()},Q=s=>({blanc:"from-blue-500 to-blue-600",jaune:"from-yellow-500 to-yellow-600",orange:"from-orange-500 to-orange-600",rouge:"from-red-500 to-red-600"})[s==null?void 0:s.toLowerCase()]||"from-gray-500 to-gray-600",z=s=>({blanc:"bg-white border-2 border-gray-400 text-gray-800",jaune:"bg-yellow-400 text-gray-900",orange:"bg-orange-500 text-white",rouge:"bg-red-500 text-white"})[s==null?void 0:s.toLowerCase()]||"bg-gray-400 text-white",be=(s,t)=>{const l=s==null?void 0:s.toLowerCase();if(l==="blanc"){const a=[{title:"Module éco-responsabilité",items:[{key:"apporterAffaires",label:"J'apporte mes affaires et porte une tenue correcte adaptée à l'escalade"},{key:"respecterMoniteur",label:"Je respecte le moniteur"},{key:"respecterCamarades",label:"Je respecte l'activité de mes camarades et ne les distrais pas"},{key:"respecterInstallations",label:"Je respecte les installations et les autres utilisateurs de la salle"},{key:"respecterConsignes",label:"Je respecte les consignes et les règles"},{key:"etreAttentif",label:"Je suis attentif pendant les explications"}]}];return t==="bloc"&&a.push({title:"Module bloc",subsections:[{subtitle:"1. Avant chaque escalade",items:[{key:"verifierReception",label:"Je vérifie que la surface de réception n'est pas encombrée"},{key:"nePasStationner",label:"Dans l'attente de mon tour, je ne stationne pas sous un bloc"},{key:"neJamaisGrimperDessus",label:"Je ne grimpe jamais au-dessus ou au-dessous d'un autre grimpeur"}]},{subtitle:"2. Montée-descente d'un bloc",items:[{key:"repererDescente",label:"Je repère une voie de descente très facile"},{key:"descendreRelache",label:"Je descends relâché"}]},{subtitle:"3. Montée et saut, réception amortie",items:[{key:"amortirReception",label:"J'amortis de manière tonique la réception d'un saut (pieds à 20 cm du sol)"}]},{subtitle:"4. Déplacements en toutes directions",items:[{key:"deplacerAisance",label:"En toutes prises, je me déplace avec aisance dans toutes les directions"}]},{subtitle:"5. Démonstration des qualités de réalisation",items:[{key:"grimperPoussee",label:"En montée, je grimpe à base de poussée d'une ou 2 jambes"},{key:"solutionsVariees",label:"En traversée, je mets en œuvre des solutions variées au niveau des pieds"}]}]}),t==="difficulte"&&a.push({title:"Module difficulté",subsections:[{subtitle:"Test de prise en charge",items:[{key:"seConfierCorde",label:"Je me confie à la corde après avoir vérifié que l'assureur m'a pris en charge"},{key:"demonstrerAisance",label:"Je démontre alors mon aisance (petit saut, pendule…)"}]},{subtitle:"Dans 3 voies sur 4 proposées",items:[{key:"reussirVoies",label:"Je réussis avec aisance 3 voies au 1er essai"},{key:"progresserPoussees",label:"En progressant à base de poussées de jambes"},{key:"nePasImpressioner",label:"Sans me laisser impressionner par la hauteur"}]}]}),a.push({title:"Module sécurité",subsections:[{subtitle:"1. Attitude",items:[{key:"etreConcentre",label:"Je suis concentré et reste vigilant"}]},{subtitle:"2. Équipement",items:[{key:"equiperSansAide",label:"Je m'équipe sans aide et sans erreur"}]},{subtitle:"3. Avec mon partenaire",items:[{key:"realiserNoeud",label:"Je réalise le nœud en bout de corde"},{key:"controlerFeuVert",label:"Je contrôle tout bien et j'attends le feu vert"}]},{subtitle:"4. En situation de grimpeur",items:[{key:"noeudEncordement",label:"Je réalise mon nœud d'encordement sans aide"},{key:"communiquerAssureur",label:"En haut de voie, je communique avec l'assureur"}]},{subtitle:"5. En situation d'assureur",items:[{key:"mousquetonnerAppareil",label:"Je mousquetonne l'appareil au pontet ventral"},{key:"installerCorde",label:"J'installe la corde dans l'appareil"},{key:"avoirMainAval",label:"J'ai ma main aval en aval de l'appareil"},{key:"assurerVoieMoulinette",label:"J'assure une voie en moulinette"}]}]}),a}if(l==="jaune"){const a=[{title:"Module éco-responsabilité",items:[{key:"preserverIntegrite",label:"Je préserve l'intégrité du lieu de pratique"},{key:"eviterGaspillage",label:"J'évite le gaspillage de matériel"},{key:"prendreSoinMateriel",label:"Je prends soin du matériel"},{key:"respecterConsignes",label:"Je respecte les consignes"}]}];return t==="bloc"&&a.push({title:"Module bloc",subsections:[{subtitle:"Principes de sécurité",items:[{key:"connaitreRegles",label:"Je connais les règles de sécurité"},{key:"connaitreZones",label:"Je connais les zones interdites"},{key:"verifierTapis",label:"Je vérifie les tapis de réception"}]},{subtitle:"Montée-descente",items:[{key:"apprecierHauteurs",label:"J'apprécie les hauteurs en fonction de ma capacité"},{key:"anticiperChute",label:"J'anticipe la chute et le retour au sol"},{key:"privilegierDesescalade",label:"Je privilégie la désescalade"},{key:"monterRedescendre",label:"Je monte et redescends en contrôle"}]},{subtitle:"Saut et réception",items:[{key:"amortirSaut",label:"J'amortis le saut de manière tonique"}]},{subtitle:"Réussite blocs",items:[{key:"reussirPoussees",label:"Je réussis des blocs à base de poussées"},{key:"repererChangements",label:"Je repère les changements de direction"}]},{subtitle:"Qualités de réalisation",items:[{key:"solutionsVarieesPieds",label:"Je mets en œuvre des solutions variées (pieds)"},{key:"realisationDalle",label:"Je réalise des déplacements en dalle"}]}]}),t==="difficulte"&&a.push({title:"Module difficulté",subsections:[{subtitle:"Test prise en charge",items:[{key:"communiquerAssureur",label:"Je communique avec l'assureur"},{key:"seConfierCorde",label:"Je me confie à la corde"}]},{subtitle:"Voies",items:[{key:"reussirVoies",label:"Je réussis des voies avec aisance"},{key:"nePasImpressioner",label:"Je ne me laisse pas impressionner par la hauteur"},{key:"utiliserMouvements",label:"J'utilise des mouvements variés"}]}]}),a.push({title:"Module sécurité",subsections:[{subtitle:"Attitude",items:[{key:"etreConcentre",label:"Je suis concentré sur la sécurité"}]},{subtitle:"Avec partenaire",items:[{key:"realiserNoeud",label:"Je réalise le nœud en bout de corde"},{key:"controlerFeuVert",label:"Je contrôle et j'attends le feu vert"}]},{subtitle:"Situation grimpeur",items:[{key:"attentionJambe",label:"Je fais attention à ma jambe libre"},{key:"trouverPosition",label:"Je trouve une position de repos"},{key:"mousquetonnerDegaines",label:"Je mousquetonne les dégaines"},{key:"choisirDescente",label:"Je choisis ma descente"}]},{subtitle:"Situation assureur",items:[{key:"preparerCorde",label:"Je prépare la corde"},{key:"placerMur",label:"Je me place par rapport au mur"},{key:"donnerReprendreMou",label:"Je donne et reprends le mou"},{key:"bloquerPartenaire",label:"Je bloque mon partenaire"},{key:"communiquerProbleme",label:"Je communique en cas de problème"}]}]}),a}return l==="orange"?[{title:"1. Préparer une sortie en falaise école",items:[{key:"choisirSite",label:"Choisir un site adapté à son niveau"},{key:"verifierMeteo",label:"Vérifier les conditions météorologiques"},{key:"preparerMateriel",label:"Préparer le matériel nécessaire"},{key:"evaluerNiveau",label:"Évaluer le niveau de difficulté des voies"},{key:"planifierSortie",label:"Planifier l'horaire et l'organisation"}]},{title:"2. S'équiper pour grimper en falaise",items:[{key:"choisirEquipement",label:"Choisir l'équipement adapté"},{key:"controlerMateriel",label:"Contrôler l'état du matériel"},{key:"enfilerBaudrier",label:"Enfiler correctement son baudrier et casque"},{key:"faireEncordement",label:"Faire son encordement (nœud de huit)"}]},{title:"3. Grimper en tête en falaise école",items:[{key:"choisirVoie",label:"Choisir une voie adaptée"},{key:"evaluerDifficulte",label:"Évaluer la difficulté"},{key:"progresserFluidite",label:"Progresser avec fluidité"},{key:"gererEffort",label:"Gérer son effort et son stress"},{key:"mousquetonnerSecurite",label:"Mousquetonner en sécurité"},{key:"gererChute",label:"Gérer une chute en tête"}]},{title:"4. Assurer un grimpeur en tête",items:[{key:"installerSysteme",label:"Installer le système d'assurage"},{key:"controlerEncordement",label:"Contrôler l'encordement"},{key:"gererCorde",label:"Gérer la corde pendant la montée"},{key:"assurerChute",label:"Assurer une chute dynamique"},{key:"ravaleCorde",label:"Ravaler la corde à la descente"}]},{title:"5. Installer un relais",items:[{key:"choisirRelais",label:"Choisir un relais adapté"},{key:"seVacher",label:"Se vacher correctement"},{key:"installerMouflage",label:"Installer un système de mouflage si besoin"},{key:"rapatrierCorde",label:"Rapatrier la corde"}]},{title:"6. Descendre en rappel",items:[{key:"installerRappel",label:"Installer le matériel de rappel"},{key:"controlerInstallation",label:"Contrôler l'installation"},{key:"descendreControle",label:"Descendre en contrôle"},{key:"recupererCorde",label:"Récupérer la corde"}]}]:[]},L=r.useMemo(()=>A.filter(s=>{if(C){const t=C.toLowerCase();if(!`${s.first_name} ${s.last_name}`.toLowerCase().includes(t))return!1}return!(_!=="all"&&s.passeport!==_||S!=="all"&&!d.filter(a=>a.member_id===s.id).some(a=>a.module===S))}),[A,C,_,S,d]),D=r.useMemo(()=>{const s=d.length,t={blanc:d.filter(a=>a.passeport_type==="blanc").length,jaune:d.filter(a=>a.passeport_type==="jaune").length,orange:d.filter(a=>a.passeport_type==="orange").length},l={bloc:d.filter(a=>a.module==="bloc").length,difficulte:d.filter(a=>a.module==="difficulte").length,none:d.filter(a=>!a.module).length};return{totalValidations:s,byPasseport:t,byModule:l}},[d]);if(!le&&!F)return e.jsx("div",{className:"flex items-center justify-center h-64",children:e.jsx("p",{className:"text-muted-foreground",children:"Accès réservé aux membres du club"})});if(oe&&!b)return e.jsx("div",{className:"flex items-center justify-center h-64",children:e.jsx(ye,{className:"w-8 h-8 animate-spin text-primary"})});if(c){const s=o?J:c,t=Object.entries(s.competences||{}),l=t.filter(([n,h])=>h===!0).length,a=t.length;return e.jsxs("div",{className:"max-w-4xl mx-auto space-y-6",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs(g,{variant:"outline",onClick:()=>{w(null),M(!1),y(null)},children:[e.jsx(Ne,{className:"w-4 h-4 mr-2"}),"Retour à la liste"]}),e.jsxs("div",{className:"flex gap-2",children:[!o&&e.jsxs(g,{onClick:he,className:"bg-purple-600 hover:bg-purple-700",children:[e.jsx(De,{className:"w-4 h-4 mr-2"}),"Imprimer le diplôme"]}),F&&!o&&e.jsxs(g,{onClick:ue,className:"bg-blue-600 hover:bg-blue-700",children:[e.jsx(ke,{className:"w-4 h-4 mr-2"}),"Éditer le passeport"]}),o&&e.jsxs(e.Fragment,{children:[e.jsx(g,{variant:"outline",onClick:me,children:"Annuler"}),e.jsxs(g,{onClick:xe,className:"bg-green-600 hover:bg-green-700",children:[e.jsx(T,{className:"w-4 h-4 mr-2"}),"Enregistrer"]})]})]})]}),o&&e.jsx("div",{className:"bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded",children:e.jsxs("p",{className:"text-sm text-yellow-800",children:["⚠️ ",e.jsx("strong",{children:"Mode édition :"})," Vous pouvez modifier les compétences validées et le commentaire. Les modifications seront enregistrées dans la base de données."]})}),e.jsxs(m,{children:[e.jsx($,{className:`bg-gradient-to-r ${Q(c.passeport_type)} text-white`,children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs(V,{className:"text-2xl flex items-center gap-2",children:[e.jsx(E,{className:"w-8 h-8"}),"Passeport ",c.passeport_type.charAt(0).toUpperCase()+c.passeport_type.slice(1),c.module&&e.jsxs(x,{variant:"secondary",className:"ml-2 bg-white/20 text-white",children:["Module: ",c.module==="bloc"?"🧗 Bloc":"🧗‍♀️ Difficulté"]})]}),e.jsxs(x,{className:z(c.passeport_type),children:[l,"/",a," compétences"]})]})}),e.jsxs(p,{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"bg-gray-50 p-4 rounded-lg",children:[e.jsx("h3",{className:"font-semibold text-lg mb-4",children:"Informations du grimpeur"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 text-sm",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-muted-foreground",children:"Nom"}),e.jsx("p",{className:"font-medium",children:b.last_name})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-muted-foreground",children:"Prénom"}),e.jsx("p",{className:"font-medium",children:b.first_name})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("p",{className:"text-muted-foreground",children:"Club"}),e.jsx("p",{className:"font-medium",children:"Association Lyonnaise de Jonage Escalade"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsx(m,{children:e.jsxs(p,{className:"p-4 flex items-center gap-3",children:[e.jsx(we,{className:"w-5 h-5 text-muted-foreground"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground",children:"Date de validation"}),e.jsx("p",{className:"font-semibold",children:new Date(c.date_validation).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})})]})]})}),e.jsx(m,{children:e.jsxs(p,{className:"p-4 flex items-center gap-3",children:[e.jsx(Y,{className:"w-5 h-5 text-muted-foreground"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground",children:"Validateur"}),e.jsx("p",{className:"font-semibold",children:c.validateur})]})]})})]}),e.jsxs("div",{children:[e.jsxs("h3",{className:"font-semibold text-lg mb-4",children:["Compétences validées (",l,"/",a,")"]}),be(s.passeport_type,s.module).map((n,h)=>e.jsxs("div",{className:"mb-6",children:[e.jsxs("h4",{className:"font-semibold text-md mb-3 text-primary flex items-center gap-2",children:[e.jsx(E,{className:"w-4 h-4"}),n.title]}),n.items&&e.jsx("div",{className:"space-y-2 ml-6",children:n.items.map(i=>{const u=s.competences[i.key]===!0;return e.jsxs("div",{className:`flex items-start gap-3 p-3 bg-gray-50 rounded-lg ${o?"cursor-pointer hover:bg-gray-100":""}`,onClick:()=>o&&q(i.key),children:[o?e.jsx(Z,{checked:u,onCheckedChange:()=>q(i.key),className:"mt-0.5"}):e.jsx("div",{className:`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${u?"bg-green-500":"bg-gray-300"}`,children:u&&e.jsx(T,{className:"w-4 h-4 text-white"})}),e.jsx("span",{className:`flex-1 text-sm ${u?"text-green-700 font-medium":"text-gray-500"}`,children:i.label})]},i.key)})}),n.subsections&&e.jsx("div",{className:"space-y-4 ml-6",children:n.subsections.map((i,u)=>e.jsxs("div",{children:[e.jsx("h5",{className:"text-sm font-medium text-gray-700 mb-2",children:i.subtitle}),e.jsx("div",{className:"space-y-2",children:i.items.map(f=>{const N=s.competences[f.key]===!0;return e.jsxs("div",{className:`flex items-start gap-3 p-3 bg-gray-50 rounded-lg ${o?"cursor-pointer hover:bg-gray-100":""}`,onClick:()=>o&&q(f.key),children:[o?e.jsx(Z,{checked:N,onCheckedChange:()=>q(f.key),className:"mt-0.5"}):e.jsx("div",{className:`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${N?"bg-green-500":"bg-gray-300"}`,children:N&&e.jsx(T,{className:"w-4 h-4 text-white"})}),e.jsx("span",{className:`flex-1 text-sm ${N?"text-green-700 font-medium":"text-gray-500"}`,children:f.label})]},f.key)})})]},u))})]},h))]}),(s.observations||o)&&e.jsx("div",{className:"bg-blue-50 p-4 rounded-lg",children:e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(Ce,{className:"w-5 h-5 text-blue-600 mt-0.5"}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"font-semibold mb-2",children:"Commentaire"}),o?e.jsx(Je,{value:s.observations||"",onChange:n=>pe(n.target.value),placeholder:"Ajoutez un commentaire sur la validation (points forts, axes d'amélioration...)",rows:4,className:"bg-white"}):e.jsx("p",{className:"text-sm text-gray-700",children:s.observations})]})]})})]})]})]})}return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(E,{className:"w-10 h-10 text-primary"}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-4xl font-bold headline",children:"Consultation des Passeports"}),e.jsx("p",{className:"text-muted-foreground",children:"Consultez les passeports validés et suivez la progression des membres"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[e.jsx(m,{children:e.jsx(p,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-primary/10 rounded-lg",children:e.jsx(qe,{className:"w-5 h-5 text-primary"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground",children:"Total Validations"}),e.jsx("p",{className:"text-2xl font-bold",children:D.totalValidations})]})]})})}),e.jsx(m,{children:e.jsx(p,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(x,{className:"bg-white border-2 border-gray-400 text-gray-800",children:"Blanc"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground",children:"Passeports Blancs"}),e.jsx("p",{className:"text-2xl font-bold",children:D.byPasseport.blanc})]})]})})}),e.jsx(m,{children:e.jsx(p,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(x,{className:"bg-yellow-400 text-gray-900",children:"Jaune"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground",children:"Passeports Jaunes"}),e.jsx("p",{className:"text-2xl font-bold",children:D.byPasseport.jaune})]})]})})}),e.jsx(m,{children:e.jsx(p,{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(x,{className:"bg-orange-500 text-white",children:"Orange"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground",children:"Passeports Orange"}),e.jsx("p",{className:"text-2xl font-bold",children:D.byPasseport.orange})]})]})})})]}),e.jsxs(m,{children:[e.jsxs($,{children:[e.jsxs(V,{className:"flex items-center gap-2",children:[e.jsx(W,{className:"w-5 h-5"}),"Recherche et filtres"]}),e.jsx(X,{children:"Trouvez rapidement un membre et filtrez par niveau ou module"})]}),e.jsxs(p,{className:"space-y-4",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{className:"md:col-span-1",children:[e.jsx(R,{htmlFor:"search",children:"Rechercher par nom"}),e.jsxs("div",{className:"relative",children:[e.jsx(W,{className:"absolute left-3 top-3 w-4 h-4 text-muted-foreground"}),e.jsx(_e,{id:"search",type:"text",placeholder:"Nom ou prénom...",value:C,onChange:s=>G(s.target.value),className:"pl-10"}),C&&e.jsx("button",{onClick:()=>G(""),className:"absolute right-3 top-3 text-muted-foreground hover:text-foreground",children:e.jsx(Se,{className:"w-4 h-4"})})]})]}),e.jsxs("div",{children:[e.jsx(R,{htmlFor:"filter-passeport",children:"Niveau de passeport"}),e.jsxs(K,{value:_,onValueChange:ce,children:[e.jsx(ee,{id:"filter-passeport",children:e.jsx(se,{placeholder:"Tous les niveaux"})}),e.jsxs(te,{children:[e.jsx(v,{value:"all",children:"Tous les niveaux"}),e.jsx(v,{value:"blanc",children:"⚪ Blanc"}),e.jsx(v,{value:"jaune",children:"🟡 Jaune"}),e.jsx(v,{value:"orange",children:"🟠 Orange"})]})]})]}),e.jsxs("div",{children:[e.jsx(R,{htmlFor:"filter-module",children:"Module"}),e.jsxs(K,{value:S,onValueChange:de,children:[e.jsx(ee,{id:"filter-module",children:e.jsx(se,{placeholder:"Tous les modules"})}),e.jsxs(te,{children:[e.jsx(v,{value:"all",children:"Tous les modules"}),e.jsx(v,{value:"bloc",children:"🧗 Bloc"}),e.jsx(v,{value:"difficulte",children:"🧗‍♀️ Difficulté"})]})]})]})]}),e.jsxs("div",{className:"flex items-center gap-2 text-sm text-muted-foreground",children:[e.jsx(Me,{className:"w-4 h-4"}),e.jsxs("span",{children:[L.length," membre(s) trouvé(s)"]})]})]})]}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",children:L.map(s=>{var n,h;const t=d.filter(i=>i.member_id===s.id),l=t[0],a={bloc:t.some(i=>i.module==="bloc"),difficulte:t.some(i=>i.module==="difficulte")};return e.jsxs(m,{className:"hover:shadow-lg transition-shadow cursor-pointer",onClick:()=>U(s.id),children:[e.jsx($,{className:`bg-gradient-to-r ${Q((n=s.passeport)==null?void 0:n.toLowerCase())} text-white`,children:e.jsxs(V,{className:"flex items-center justify-between",children:[e.jsxs("span",{children:[s.last_name," ",s.first_name]}),e.jsx(x,{className:z((h=s.passeport)==null?void 0:h.toLowerCase()),children:s.passeport})]})}),e.jsxs(p,{className:"p-4 space-y-3",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground mb-2",children:"Modules validés"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(x,{variant:a.bloc?"default":"outline",className:a.bloc?"bg-green-500":"",children:["🧗 Bloc ",a.bloc&&"✓"]}),e.jsxs(x,{variant:a.difficulte?"default":"outline",className:a.difficulte?"bg-green-500":"",children:["🧗‍♀️ Difficulté ",a.difficulte&&"✓"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(E,{className:"w-4 h-4 text-muted-foreground"}),e.jsxs("p",{className:"text-sm",children:[e.jsx("span",{className:"font-semibold",children:t.length})," validation(s)"]})]}),l&&e.jsxs("div",{className:"text-xs text-muted-foreground",children:["Dernière validation: ",new Date(l.date_validation).toLocaleDateString("fr-FR")]}),e.jsxs(g,{variant:"outline",size:"sm",className:"w-full",onClick:i=>{i.stopPropagation(),U(s.id)},children:[e.jsx(ae,{className:"w-4 h-4 mr-2"}),"Voir les détails"]})]})]},s.id)})}),L.length===0&&e.jsx(m,{children:e.jsx(p,{className:"p-8 text-center",children:e.jsx("p",{className:"text-muted-foreground",children:"Aucun membre ne correspond aux critères de recherche"})})}),b&&I.length>0&&e.jsxs(m,{children:[e.jsxs($,{children:[e.jsxs(V,{className:"flex items-center gap-2",children:[e.jsx(Y,{className:"w-5 h-5"}),"Historique de ",b.first_name," ",b.last_name]}),e.jsx(X,{children:"Cliquez sur une validation pour voir les détails"})]}),e.jsx(p,{className:"space-y-4",children:e.jsx("div",{className:"space-y-2",children:I.map(s=>e.jsxs("div",{onClick:()=>w(s),className:"flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(x,{className:z(s.passeport_type),children:s.passeport_type}),s.module&&e.jsx(x,{variant:"outline",children:s.module==="bloc"?"🧗 Bloc":"🧗‍♀️ Difficulté"}),e.jsx("span",{className:"text-sm",children:new Date(s.date_validation).toLocaleDateString("fr-FR")})]}),e.jsx(g,{variant:"ghost",size:"sm",children:e.jsx(ae,{className:"w-4 h-4"})})]},s.id))})})]})]})};export{Ae as default};
