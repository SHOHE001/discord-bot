import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { PluginCommand } from "../../core/types.js";
import { ALL_FEEDS } from "./feeds.js";
import { fetchFeed } from "./api.js";

const MAX_ITEMS = 5;
const EMBED_DESCRIPTION_LIMIT = 4000;

function buildEmbed(label: string, url: string, items: Awaited<ReturnType<typeof fetchFeed>>): EmbedBuilder {
  let description = "";
  for (const item of items.slice(0, MAX_ITEMS)) {
    const date = item.pubDate
      ? ` _(${new Date(item.pubDate).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false })})_`
      : "";
    const safeTitle = item.title.replace(/[[\]()]/g, "\\$&");
    const line = `• **[${safeTitle}](${item.link})**${date}\n\n`;
    if ((description + line).length > EMBED_DESCRIPTION_LIMIT - 50) {
      description += "...(以下略)";
      break;
    }
    description += line;
  }

  return new EmbedBuilder()
    .setTitle(`📰 ${label}`)
    .setURL(url)
    .setDescription(description.trim() || "(記事が見つかりませんでした)")
    .setColor(0x2b8cee)
    .setTimestamp()
    .setFooter({ text: "NHK / ITmedia" });
}

export const newsCommand: PluginCommand = {
  data: new SlashCommandBuilder()
    .setName("news")
    .setDescription("ニュースカテゴリを選んで最新記事を表示します")
    .addStringOption((opt) =>
      opt
        .setName("category")
        .setDescription("カテゴリを選択")
        .setRequired(true)
        .addChoices(
          ...ALL_FEEDS.map((f) => ({ name: f.label, value: f.label }))
        )
    ),

  async execute(interaction) {
    const selected = interaction.options.getString("category", true);
    const feed = ALL_FEEDS.find((f) => f.label === selected);
    if (!feed) {
      await interaction.reply({ content: "❌ カテゴリが見つかりません。", ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const items = await fetchFeed(feed.url);
      const embed = buildEmbed(feed.label, feed.url, items);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー";
      await interaction.editReply(`❌ フィードの取得に失敗しました: ${msg}`);
    }
  },
};
