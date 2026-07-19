update public.sources
set
  base_url = 'https://jzai1688.com',
  entry_url = 'https://jzai1688.com/',
  health_status = 'retrying',
  consecutive_failures = 0,
  last_error = null,
  updated_at = now()
where id = 'jzai168-com'
  and base_url = 'https://jzai168.com';
