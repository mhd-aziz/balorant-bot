/**
 * Express server untuk Discord Bot + API endpoints
 * Serverless (Railway) friendly
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const { startBot } = require('./index');
const linkAccountHandler = require('./api/link-account');
const authCallbackHandler = require('./api/auth-callback');
const { validateConfig } = require('./src/config/config');
const Logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.post('/api/link-account', linkAccountHandler);
app.post('/api/auth-callback', authCallbackHandler);
app.post('/api/riot-login', require('./api/riot-login'));
app.post('/api/link-account-v2', require('./api/link-account-v2'));

// Pages
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint — check env vars (remove after debugging)
app.get('/debug/env', (req, res) => {
  res.json({
    supabase_url: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    supabase_anon_key: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    discord_token: process.env.DISCORD_TOKEN ? 'SET' : 'MISSING',
    client_id: process.env.CLIENT_ID ? 'SET' : 'MISSING',
    guild_id: process.env.GUILD_ID ? 'SET' : 'MISSING',
    node_env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 'default'
  });
});

// Debug endpoint — test Supabase session read (remove after debugging)
app.get('/debug/session/:discordId', async (req, res) => {
  try {
    const { AuthService } = require('./src/services/auth-service');
    const session = await AuthService.getSession(req.params.discordId);
    if (session) {
      res.json({ 
        found: true, 
        puuid: session.puuid || 'MISSING', 
        game_name: session.game_name, 
        tag_line: session.tag_line, 
        shard: session.shard, 
        has_access_token: !!session.access_token, 
        has_entitlement: !!session.entitlement_token 
      });
    } else {
      res.json({ found: false });
    }
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Token helper page
app.get('/token-helper', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'token-helper.html'));
});

// Auth callback page
app.get('/callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth-callback.html'));
});

// Start bot (non-blocking)
async function start() {
  try {
    validateConfig();
    await startBot();
  } catch (error) {
    Logger.error('Failed to start bot:', error);
    // Continue anyway - server can still serve API
  }

  // Start Express server
  app.listen(PORT, () => {
    Logger.success(`✅ Server running on port ${PORT}`);
  });
}

start().catch(console.error);

// Export for Railway
module.exports = app;
