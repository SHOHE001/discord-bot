import { SlashCommandBuilder } from "discord.js";
import type { PluginCommand } from "../../core/types.js";
import { FEEDS } from "./feeds.js";
import { fetchSubreddit } from "./api.js";
import { translateAll } from "./translate.js";
import { buildEmbed } from "./cron.js";

const ALL_CHOICE = "すべて";

export const redditAiCommand: PluginCommand = {
  data: new SlashCommandBuilder()
    .setName("reddit-ai")
    .setDescription("Reddit AIサブレディットの最新投稿を表示します")
    .addStringOption((opt) =>
      opt
        .setName("subreddit")
        .setDescription("サブレディットを選択")
        .setRequired(false)
        .addChoices(
          { name: "すべて", value: ALL_CHOICE },
          ...FEEDS.map((f) => ({ name: f.label, value: f.label }))
        )
    ),

  async execute(interaction) {
    const selected = interaction.options.getString("subreddit") ?? ALL_CHOICE;
    const targets = selected === ALL_CHOICE
      ? FEEDS
      : FEEDS.filter((f) => f.label === selected);

    await interaction.deferReply();

    try {
      for (const source of targets) {
        const posts = await fetchSubreddit(source.url);
        const top = posts.slice(0, 5);
        const translatedTitles = await translateAll(top.map((p) => p.title));
        const embed = buildEmbed(source, top, translatedTitles);
        await interaction.followUp({ embeds: [embed] });
      }
      // deferReply に対する最初の応答（空でOK）
      await interaction.editReply({ content: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー";
      await interaction.editReply(`❌ 取得に失敗しました: ${msg}`);
    }
  },
};
