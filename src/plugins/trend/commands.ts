import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { PluginCommand } from "../../core/types.js";
import { fetchTogetterHot } from "./api.js";

const MAX_ITEMS = 10;

export const trendCommand: PluginCommand = {
  data: new SlashCommandBuilder()
    .setName("trend")
    .setDescription("Togetterのホットまとめ（Xトレンド）を表示します"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const items = await fetchTogetterHot();
      const top = items.slice(0, MAX_ITEMS);

      const description = top
        .map((item, i) => {
          const safeTitle = item.title.replace(/[[\]()]/g, "\\$&");
          return `**${i + 1}.** [${safeTitle}](${item.link})`;
        })
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle("🔥 Togetterホット（Xトレンドまとめ）")
        .setURL("https://togetter.com/")
        .setDescription(description)
        .setColor(0xff6600)
        .setTimestamp()
        .setFooter({ text: "Togetter" });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー";
      await interaction.editReply(`❌ トレンドの取得に失敗しました: ${msg}`);
    }
  },
};
