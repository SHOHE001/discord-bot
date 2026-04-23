import { Client, TextChannel } from "discord.js";
import { getPluginChannelId } from "../../core/channel-manager.js";
import { fetchTrending } from "./api.js";
import { buildTrendingEmbed } from "./embed.js";

export async function postGithubTrending(client: Client): Promise<void> {
  const channelId = getPluginChannelId("github-trend");
  if (!channelId) {
    console.warn("[github-trend] チャンネルIDが取得できませんでした");
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!(channel instanceof TextChannel)) {
    console.warn("[github-trend] テキストチャンネルを取得できませんでした");
    return;
  }

  try {
    const repos = await fetchTrending();
    const embed = buildTrendingEmbed(repos);
    await channel.send({ embeds: [embed] });
    console.log(`[github-trend] ${repos.length}件のトレンドを投稿しました`);
  } catch (err) {
    console.error("[github-trend] 投稿に失敗しました:", err);
  }
}
