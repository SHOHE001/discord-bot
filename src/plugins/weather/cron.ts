import { EmbedBuilder, TextChannel } from "discord.js";
import type { Client } from "discord.js";
import { fetchWeather, iconUrl, embedColor, DEFAULT_CITY } from "./api.js";

export async function postDailyWeather(client: Client): Promise<void> {
  const channelId = process.env.WEATHER_CHANNEL_ID;
  const city = DEFAULT_CITY;

  if (!channelId) {
    console.warn("[weather/cron] WEATHER_CHANNEL_ID が設定されていません");
    return;
  }

  try {
    const channel = await client.channels.fetch(channelId);
    if (!(channel instanceof TextChannel)) {
      console.warn("[weather/cron] WEATHER_CHANNEL_ID がテキストチャンネルではありません");
      return;
    }

    const w = await fetchWeather(city);

    const embed = new EmbedBuilder()
      .setColor(embedColor(w.icon))
      .setTitle(`🌤️ 今日の天気 - ${w.cityName}`)
      .setThumbnail(iconUrl(w.icon))
      .setDescription(`**${w.description}**\nおはようございます！今日もいい一日を☀️`)
      .addFields(
        { name: "🌡️ 気温", value: `${w.temp}°C（体感 ${w.feelsLike}°C）`, inline: true },
        { name: "💧 湿度", value: `${w.humidity}%`, inline: true },
        { name: "💨 風速", value: `${w.windSpeed} m/s`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "毎朝7:00 自動投稿" });

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("[weather/cron] 投稿エラー:", err);
  }
}
