import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { fetchWeather, iconUrl, embedColor, DEFAULT_CITY } from "./api.js";
import type { PluginCommand } from "../../core/types.js";

export const weatherCommand: PluginCommand = {
  data: new SlashCommandBuilder()
    .setName("weather")
    .setDescription("天気予報を表示します")
    .addStringOption((opt) =>
      opt
        .setName("city")
        .setDescription("都市名（例: Tokyo, Osaka）")
        .setRequired(false)
    ),

  async execute(interaction) {
    const city = interaction.options.getString("city") ?? DEFAULT_CITY;

    await interaction.deferReply();

    try {
      const w = await fetchWeather(city);

      const embed = new EmbedBuilder()
        .setColor(embedColor(w.icon))
        .setTitle(`${w.cityName} の天気`)
        .setThumbnail(iconUrl(w.icon))
        .setDescription(`**${w.description}**`)
        .addFields(
          { name: "🌡️ 気温", value: `${w.temp}°C（体感 ${w.feelsLike}°C）`, inline: true },
          { name: "💧 湿度", value: `${w.humidity}%`, inline: true },
          { name: "💨 風速", value: `${w.windSpeed} m/s`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "OpenWeatherMap" });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー";
      await interaction.editReply(`❌ ${msg}`);
    }
  },
};
