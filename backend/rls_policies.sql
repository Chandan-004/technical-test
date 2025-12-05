alter table leads enable row level security;


create policy leads_select_policy
on leads
for select
using (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
  and (
    auth.jwt()->>'role' = 'admin'
    or (
      auth.jwt()->>'role' = 'counselor'
      and (
        owner_id = (auth.jwt()->>'user_id')::uuid
        or owner_id in (
          select ut.user_id
          from user_teams ut
          where ut.team_id in (
            select team_id
            from user_teams
            where user_id = (auth.jwt()->>'user_id')::uuid
          )
        )
      )
    )
  )
);


create policy leads_insert_policy
on leads
for insert
with check (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
  and auth.jwt()->>'role' in ('admin', 'counselor')
);