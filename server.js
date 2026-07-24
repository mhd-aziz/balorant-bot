/**
 * Express server untuk Discord Bot + API endpoints
 * Railway deployment
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const { startBot } = require('./index');
const { validateConfig } = require('./src/config/config');
const Logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes
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
