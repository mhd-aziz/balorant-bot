/**
 * Riot Games API HTTP Client
 * Handles authentication, rate limiting, and error handling
 */

const Logger = require('../utils/logger');
const { config } = require('../config/config');

// Rate limiting queue per routing value
const queues = new Map();

class RiotApiError extends Error {
  constructor(message, statusCode, url) {
    super(message);
    this.name = 'RiotApiError';
    this.statusCode = statusCode;
    this.url = url;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Get rate limit queue for a routing value
 * @param {string} routing - API routing value (na1, euw1, americas, etc.)
 * @returns {Object} Queue object
 */
function getQueue(routing) {
  if (!queues.has(routing)) {
    queues.set(routing, {
      requests: [],
      processing: false,
      secondLimit: config.riot.rateLimits.perSecond,
      minuteLimit: config.riot.rateLimits.perMinute,
    });
  }
  return queues.get(routing);
}

/**
 * Rate limit helper
 * @param {string} routing - Routing value
 * @returns {Promise<void>}
 */
async function rateLimit(routing) {
  const queue = getQueue(routing);
  const now = Date.now();
  
  // Clean up old requests
  queue.requests = queue.requests.filter(time => 
    time > now - 120000 // Keep only last 2 minutes
  );
  
  const secondRequests = queue.requests.filter(time => 
    time > now - 1000
  ).length;
  
  const minuteRequests = queue.requests.length;
  
  // Check rate limits
  if (secondRequests >= queue.secondLimit) {
    const waitTime = 1000 - (now - queue.requests[0]);
    Logger.warn(`Rate limit per second hit for ${routing}, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  if (minuteRequests >= queue.minuteLimit) {
    const waitTime = 120000 - (now - queue.requests[0]);
    Logger.warn(`Rate limit per minute hit for ${routing}, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Add this request to queue
  queue.requests.push(Date.now());
}

/**
 * Make HTTP request to Riot Games API
 * @param {string} method - HTTP method
 * @param {string} url - Full API URL
 * @param {string} routing - Routing value for rate limiting
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data
 * @throws {RiotApiError} On API errors
 */
async function request(method, url, routing, options = {}) {
  await rateLimit(routing);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.riot.timeout);
  
  const headers = {
    'X-Riot-Token': config.riot.apiKey,
    'Accept': 'application/json',
    ...options.headers,
  };
  
  try {
    Logger.debug(`API Request: ${method} ${url}`);
    const response = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      ...options,
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 429) {
      // Rate limit exceeded
      const retryAfter = response.headers.get('Retry-After') || '1';
      const waitTime = parseInt(retryAfter) * 1000;
      Logger.warn(`Rate limit exceeded, retrying after ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return request(method, url, routing, options);
    }
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: await response.text() };
      }
      
      throw new RiotApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        url
      );
    }
    
    const data = await response.json();
    Logger.debug(`API Response: ${method} ${url} - ${response.status}`);
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new RiotApiError(`Request timeout after ${config.riot.timeout}ms`, 408, url);
    }
    
    if (error.name === 'RiotApiError') {
      throw error;
    }
    
    throw new RiotApiError(
      `Network error: ${error.message}`,
      0,
      url
    );
  }
}

/**
 * Riot API Client wrapper
 */
const RiotApiClient = {
  /**
   * GET request
   * @param {string} url - API URL
   * @param {string} routing - Routing value
   * @param {Object} options - Additional options
   * @returns {Promise<Object>}
   */
  async get(url, routing, options = {}) {
    return request('GET', url, routing, options);
  },
  
  /**
   * Test API connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const url = `${config.riot.apiBaseUrl}/riot/account/v1/accounts/me`;
      await this.get(url, 'americas');
      Logger.info('Riot API connection test successful');
      return true;
    } catch (error) {
      Logger.error(`Riot API connection test failed: ${error.message}`);
      return false;
    }
  },
};

module.exports = { RiotApiClient, RiotApiError };
