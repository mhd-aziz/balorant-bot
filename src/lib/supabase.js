const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    _client = createClient(url, key);
  }
  return _client;
}

module.exports = { getSupabase };
