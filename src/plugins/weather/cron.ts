import { EmbedBuilder, TextChannel } from "discord.js";
import type { Client } from "discord.js";
import { fetchWeather, iconUrl, embedColor } from "./api.js";
import { getPluginChannelId } from "../../core/channel-manager.js";

// TODO: `postDailyWeather` cronジョブのテストを追加してください。
export async function postDailyWeather(client: Client): Promise<void> {
  // channel-manager で自動作成されたチャンネルを優先、なければ env var にフォールバック
  const channelId = getPluginChannelId("weather") ?? process.env.WEATHER_CHANNEL_ID;
  const city = process.env.CITY ?? "Tokyo";

  if (!channelId) {
    console.warn("[weather/cron] 投稿先チャンネルが見つかりません（WEATHER_CHANNEL_ID も未設定）");
    return;
  }

  try {
    const channel = await client.channels.fetch(channelId);
    if (!(channel instanceof TextChannel)) {
      console.warn("[weather/cron] 投稿先がテキストチャンネルではありません");
      return;
    }

    const w = await fetchWeather(city);

    // TODO: 天気予報のDiscord埋め込みロジックを重複して使用しています。共通の関数に切り出してください。
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
