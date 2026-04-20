import type { PluginDefinition } from "../../core/types.js";
import { getPluginChannelId } from "../../core/channel-manager.js";
import { saveMemo } from "./notion.js";

const plugin: PluginDefinition = {
  name: "tsubuyaki",
  channelName: "つぶやき",

  onMessage: async (message) => {
    if (message.author.bot || !message.content) return;

    const channelId = getPluginChannelId("tsubuyaki");
    if (message.channelId !== channelId) return;

    try {
      await saveMemo(message.content, message.createdAt, message.url);
      await message.react("🧠");
    } catch (err) {
      console.error("[tsubuyaki] Notion保存エラー:", err);
      await message.react("❌");
    }
  },
};

export default plugin;
