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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.post('/api/link-account', linkAccountHandler);
app.post('/api/auth-callback', authCallbackHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
