/**
 * Auth Service — simpan/ambil Riot session per Discord user ke Supabase
 */

const { getSupabase } = require('../lib/supabase');
const Logger = require('../utils/logger');

const AuthService = {
  async saveSession(discordId, session) {
    const { error } = await getSupabase()
      .from('riot_sessions')
      .upsert({
        discord_id: discordId,
        puuid: session.puuid,
        game_name: session.gameName,
        tag_line: session.tagLine,
        shard: session.shard || 'ap',
        region: session.region || 'ap',
        access_token: session.accessToken,
        entitlement_token: session.entitlementToken,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'discord_id' });

    if (error) {
      Logger.error(`Failed to save session for ${discordId}: ${error.message}`);
      throw new Error('Gagal menyimpan session ke database.');
    }
    Logger.info(`Session saved for Discord ID ${discordId}`);
  },

  async getSession(discordId) {
    const { data, error } = await getSupabase()
      .from('riot_sessions')
      .select('*')
      .eq('discord_id', discordId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      Logger.error(`Failed to get session for ${discordId}: ${error.message}`);
      throw new Error('Gagal mengambil session dari database.');
    }
    return data;
  },

  async deleteSession(discordId) {
    const { error } = await getSupabase()
      .from('riot_sessions')
      .delete()
      .eq('discord_id', discordId);

    if (error) {
      Logger.error(`Failed to delete session for ${discordId}: ${error.message}`);
      throw new Error('Gagal menghapus session.');
    }
    Logger.info(`Session deleted for Discord ID ${discordId}`);
  },
};

module.exports = { AuthService };
