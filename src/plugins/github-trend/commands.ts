import { SlashCommandBuilder } from "discord.js";
import type { PluginCommand } from "../../core/types.js";
import { fetchTrending } from "./api.js";
import { buildTrendingEmbed } from "./embed.js";

export const githubTrendCommand: PluginCommand = {
  data: new SlashCommandBuilder()
    .setName("github-trend")
    .setDescription("GitHub Trendingのトップリポジトリを表示します"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const repos = await fetchTrending();
      const embed = buildTrendingEmbed(repos);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー";
      await interaction.editReply(`❌ トレンドの取得に失敗しました: ${msg}`);
    }
  },
};
