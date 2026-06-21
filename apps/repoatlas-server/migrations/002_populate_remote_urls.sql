-- Backfill missing remote URLs for known projects so the Nexus UI can link to source.
update projects
set remote_url = coalesce(
  remote_url,
  meta->>'remoteUrl',
  case id
    when 'aigency-monorepo' then 'https://github.com/AReid987/aigency-monorepo'
    when 'aigency-router-v2' then 'https://github.com/antonioreid/aigency-router-v2'
    else null
  end
)
where remote_url is null;
