create table if not exists helloasso_orders (
  id text primary key,
  date timestamp with time zone,
  payer_first_name text,
  payer_last_name text,
  payer_email text,
  total_amount integer,
  status text,
  form_slug text,
  items jsonb,
  raw_data jsonb,
  created_at timestamp with time zone default now()
);

-- Add RLS policies if needed, for now assuming admin access or open for authenticated users
alter table helloasso_orders enable row level security;

create policy "Enable read access for authenticated users"
on helloasso_orders for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on helloasso_orders for insert
to authenticated
with check (true);

create policy "Enable update access for authenticated users"
on helloasso_orders for update
to authenticated
using (true);
