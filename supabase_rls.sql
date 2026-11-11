alter table public.registro_escolar enable row level security;

create policy "Authenticated users can read school records"
on public.registro_escolar
for select
to authenticated
using (true);