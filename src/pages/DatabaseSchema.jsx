import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/customSupabaseClient';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const DatabaseSchema = () => {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        setLoading(true);
        // Appel d'une fonction RPC pour récupérer le schéma
        // Nous devrons créer cette fonction dans Supabase
        const { data, error } = await supabase.rpc('get_schema_info');

        if (error) {
          throw new Error("Impossible de récupérer le schéma. Assurez-vous que la fonction RPC 'get_schema_info' existe et que les permissions sont correctes. Erreur: " + error.message);
        }

        // Grouper les colonnes par table
        const groupedSchema = data.reduce((acc, col) => {
          const { table_name, column_name, data_type, description } = col;
          if (!acc[table_name]) {
            acc[table_name] = { columns: [], description: '' }; // Placeholder for table description
          }
          acc[table_name].columns.push({ column_name, data_type, description });
          return acc;
        }, {});

        setSchema(groupedSchema);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Chargement du schéma de la base de données...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Erreur</h1>
        <p className="mb-4">{error}</p>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Action requise :</h2>
          <p>Vous devez créer la fonction SQL suivante dans l'éditeur SQL de Supabase :</p>
          <pre className="bg-gray-800 text-white p-3 rounded-md mt-2 overflow-x-auto">
            {`
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
            `}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Schéma de la Base de Données</h1>
      {schema && Object.entries(schema).map(([tableName, tableInfo]) => (
        <div key={tableName} className="mb-8 p-4 border rounded-lg shadow-md bg-white">
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">{tableName}</h2>
          {tableInfo.description && <p className="text-gray-600 mb-4 italic">{tableInfo.description}</p>}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Colonne
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de Donnée
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableInfo.columns.map((col) => (
                <tr key={col.column_name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{col.column_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{col.data_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{col.description || <span className="italic text-gray-400">Non disponible</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

const ProtectedDatabaseSchema = () => (
  <ProtectedRoute>
    <DatabaseSchema />
  </ProtectedRoute>
);

export default ProtectedDatabaseSchema;
