import{j as e,af as N,r,y as j}from"./index-1760862795448.js";const y=()=>{const[i,d]=r.useState(null),[m,l]=r.useState(!0),[o,p]=r.useState(null);return r.useEffect(()=>{(async()=>{try{l(!0);const{data:t,error:s}=await j.rpc("get_schema_info");if(s)throw new Error("Impossible de récupérer le schéma. Assurez-vous que la fonction RPC 'get_schema_info' existe et que les permissions sont correctes. Erreur: "+s.message);const x=t.reduce((a,h)=>{const{table_name:n,column_name:u,data_type:g,description:b}=h;return a[n]||(a[n]={columns:[],description:""}),a[n].columns.push({column_name:u,data_type:g,description:b}),a},{});d(x)}catch(t){p(t.message)}finally{l(!1)}})()},[]),m?e.jsx("div",{className:"container mx-auto p-4",children:"Chargement du schéma de la base de données..."}):o?e.jsxs("div",{className:"container mx-auto p-4",children:[e.jsx("h1",{className:"text-2xl font-bold mb-4 text-red-600",children:"Erreur"}),e.jsx("p",{className:"mb-4",children:o}),e.jsxs("div",{className:"bg-gray-100 p-4 rounded-lg",children:[e.jsx("h2",{className:"text-xl font-semibold mb-2",children:"Action requise :"}),e.jsx("p",{children:"Vous devez créer la fonction SQL suivante dans l'éditeur SQL de Supabase :"}),e.jsx("pre",{className:"bg-gray-800 text-white p-3 rounded-md mt-2 overflow-x-auto",children:`
CREATE OR REPLACE FUNCTION get_schema_info()
RETURNS TABLE(
  table_name text,
  column_name text,
  data_type text,
  description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    pgd.description
  FROM
    information_schema.columns c
    LEFT JOIN pg_catalog.pg_stat_all_tables psat ON (psat.schemaname = c.table_schema AND psat.relname = c.table_name)
    LEFT JOIN pg_catalog.pg_description pgd ON (pgd.objoid = psat.relid AND pgd.objsubid = c.ordinal_position)
  WHERE
    c.table_schema = 'public'
  ORDER BY
    c.table_name,
    c.ordinal_position;
END;
$$ LANGUAGE plpgsql;
            `})]})]}):e.jsxs("div",{className:"container mx-auto p-4",children:[e.jsx("h1",{className:"text-3xl font-bold mb-6",children:"Schéma de la Base de Données"}),i&&Object.entries(i).map(([c,t])=>e.jsxs("div",{className:"mb-8 p-4 border rounded-lg shadow-md bg-white",children:[e.jsx("h2",{className:"text-2xl font-semibold mb-3 text-gray-800",children:c}),t.description&&e.jsx("p",{className:"text-gray-600 mb-4 italic",children:t.description}),e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("th",{scope:"col",className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Colonne"}),e.jsx("th",{scope:"col",className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Type de Donnée"}),e.jsx("th",{scope:"col",className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Description"})]})}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:t.columns.map(s=>e.jsxs("tr",{children:[e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:s.column_name}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:s.data_type}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:s.description||e.jsx("span",{className:"italic text-gray-400",children:"Non disponible"})})]},s.column_name))})]})]},c))]})},f=()=>e.jsx(N,{children:e.jsx(y,{})});export{f as default};
