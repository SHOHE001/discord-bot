import type { PluginDefinition } from "../../core/types.js";
import { checkMangaUpdate } from "./cron.js";

const plugin: PluginDefinition = {
  name: "manga-update",
  channelName: "manga-update",
  cronJobs: [
    {
      schedule: "0 8,20 * * *", // 毎日 8:00 と 20:00 JST に実行
      timezone: "Asia/Tokyo",
      execute: checkMangaUpdate,
    },
  ],
};

export default plugin;
