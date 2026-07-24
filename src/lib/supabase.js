const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set in .env');
    console.log(`[Supabase] Using key type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'}`);
    _client = createClient(url, key);
  }
  return _client;
}

module.exports = { getSupabase };
