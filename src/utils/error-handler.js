/**
 * Centralized Error Handler
 * Consistent error messages and embed builders
 */

const { EmbedBuilder } = require('discord.js');
const { ERROR_RED } = require('../constants/colors');

/**
 * Create error embed
 * @param {string} title - Error title
 * @param {string} description - Error description
 * @returns {EmbedBuilder}
 */
function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(ERROR_RED)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Auth required error
 * User belum login
 */
function authRequiredError(commandName = 'command ini') {
  return createErrorEmbed(
    'Belum Login',
    `Kamu harus login terlebih dahulu menggunakan \`/login\` untuk menggunakan ${commandName}.\n\n` +
    '💡 **Cara Login:**\n' +
    '1. Ketik `/login` untuk mendapat link\n' +
    '2. Login di web Riot Games\n' +
    '3. Copy URL setelah redirect\n' +
    '4. Paste di halaman Balorant Bot'
  );
}

/**
 * Token expired error
 * Token sudah kadaluarsa (401/403)
 */
function tokenExpiredError() {
  return createErrorEmbed(
    'Sesi Login Kadaluarsa',
    'Token login kamu sudah habis masa berlakunya.\n\n' +
    '🔄 **Solusi:**\n' +
    '1. Jalankan `/logout` untuk hapus sesi lama\n' +
    '2. Jalankan `/login` untuk login ulang\n' +
    '3. Coba command lagi\n\n' +
    '💡 Token Riot berlaku ~1 jam untuk keamanan.'
  );
}

/**
 * Network error
 * Koneksi gagal atau timeout
 */
function networkError(details = '') {
  return createErrorEmbed(
    'Koneksi Gagal',
    'Gagal menghubungi server Riot Games.\n\n' +
    '🔄 **Solusi:**\n' +
    '• Cek koneksi internet kamu\n' +
    '• Coba lagi dalam beberapa detik\n' +
    '• Server Riot mungkin sedang maintenance\n\n' +
    (details ? `📋 **Detail:** ${details}` : '')
  );
}

/**
 * Data not found error
 * Data yang dicari tidak ditemukan
 */
function dataNotFoundError(dataType = 'Data', suggestion = '') {
  return createErrorEmbed(
    `${dataType} Tidak Ditemukan`,
    `${dataType} yang kamu cari tidak ditemukan.\n\n` +
    (suggestion ? `💡 **Saran:** ${suggestion}` : '')
  );
}

/**
 * Generic API error
 * Error dari API dengan status code
 */
function apiError(message, statusCode = null) {
  const title = statusCode ? `Error ${statusCode}` : 'Terjadi Kesalahan';
  return createErrorEmbed(
    title,
    `${message}\n\n` +
    '🔄 Jika masalah berlanjut, hubungi developer atau coba lagi nanti.'
  );
}

/**
 * Check if error is auth-related (401/403/BAD_CLAIMS)
 * @param {Error} error
 * @returns {boolean}
 */
function isAuthError(error) {
  const message = error?.message || '';
  return (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('Unauthorized') ||
    message.includes('BAD_CLAIMS') ||
    message.includes('validating/decoding RSO')
  );
}

/**
 * Check if error is network-related
 * @param {Error} error
 * @returns {boolean}
 */
function isNetworkError(error) {
  const message = error?.message || '';
  return (
    message.includes('timeout') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    message.includes('Network') ||
    error?.code === 'ENOTFOUND'
  );
}

module.exports = {
  createErrorEmbed,
  authRequiredError,
  tokenExpiredError,
  networkError,
  dataNotFoundError,
  apiError,
  isAuthError,
  isNetworkError,
};
