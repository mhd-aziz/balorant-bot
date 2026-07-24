/**
 * /match — info match API limitations dengan dev key
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('match')
    .setDescription('Info tentang VALORANT match data'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor('#FF4655')
      .setTitle('Match History API')
      .setDescription('Akses match history memerlukan **Production API key** dari Riot Games.')
      .addFields(
        {
          name: '⚠️ Developer Key Limitation',
          value: 'Endpoint `/val/match/v1/*` tidak accessible dengan development key.\n\nBot ini menggunakan dev key yang hanya bisa akses:\n• Account lookup (`/profile`)\n• Game content (`/agents`, `/maps`)\n• Server status (`/status`)',
          inline: false,
        },
        {
          name: '🔑 Production Key',
          value: 'Untuk akses match history, butuh production key dari:\n[Riot Developer Portal](https://developer.riotgames.com/app-type)',
          inline: false,
        }
      )
      .setFooter({ text: 'Balorant Bot • Asia Pacific' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
