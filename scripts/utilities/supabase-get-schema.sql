-- Create a function get_schema() that returns JSON describing tables, columns, indexes and constraints
-- Run this in Supabase SQL Editor as a privileged role (Service Role key or via SQL Editor UI)

create or replace function public.get_schema()
returns jsonb
language sql
security definer
as $$
  with tbls as (
    select table_schema, table_name
    from information_schema.tables
    where table_type = 'BASE TABLE'
      and table_schema not in ('pg_catalog', 'information_schema')
    order by table_schema, table_name
  ), cols as (
    select jsonb_build_object(
      'table_schema', c.table_schema,
      'table_name', c.table_name,
      'columns', jsonb_agg(jsonb_build_object(
        'column_name', c.column_name,
        'data_type', c.data_type,
        'is_nullable', c.is_nullable,
        'character_maximum_length', c.character_maximum_length,
        'column_default', c.column_default,
        'ordinal_position', c.ordinal_position
      ) order by c.ordinal_position)
    ) as col_json
    from information_schema.columns c
    group by c.table_schema, c.table_name
  ), idx as (
    select jsonb_build_object('schemaname', i.schemaname, 'tablename', i.tablename, 'indexname', i.indexname, 'indexdef', i.indexdef) as idx_json
    from pg_indexes i
    where i.schemaname not in ('pg_catalog', 'information_schema')
  ), cons as (
    select jsonb_build_object(
      'table_schema', tc.table_schema,
      'table_name', tc.table_name,
      'constraint_name', tc.constraint_name,
      'constraint_type', tc.constraint_type,
      'column_name', kcu.column_name,
      'foreign_schema', ccu.table_schema,
      'foreign_table', ccu.table_name,
      'foreign_column', ccu.column_name
    ) as cons_json
    from information_schema.table_constraints tc
    left join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema and tc.table_name = kcu.table_name
    left join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name
    where tc.table_schema not in ('pg_catalog', 'information_schema')
  )
  select jsonb_build_object(
    'tables', jsonb_agg(jsonb_build_object('schema', t.table_schema, 'name', t.table_name)) ,
    'columns', (select jsonb_object_agg((col_json->> 'table_schema') || '.' || (col_json->> 'table_name'), col_json->> 'columns') from cols),
    'indexes', jsonb_agg(idx_json),
    'constraints', jsonb_agg(cons_json)
  )
  from tbls t cross join cols c left join idx on true left join cons on true;
$$;

comment on function public.get_schema() is 'Returns JSONB describing the database schema. Use service role or an admin role to create and call this function.';
