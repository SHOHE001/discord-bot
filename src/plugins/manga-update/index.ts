import type { PluginDefinition } from "../../core/types.js";
import { checkMangaUpdate, sendNoUpdateIfNeeded } from "./cron.js";

const plugin: PluginDefinition = {
  name: "manga-update",
  channelName: "manga-update",
  cronJobs: [
    {
      schedule: "0 8,20 * * *", // 毎日 8:00 と 20:00 JST に更新チェック
      timezone: "Asia/Tokyo",
      execute: checkMangaUpdate,
    },
    {
      schedule: "0 22 * * *", // 毎日 22:00 JST に未更新メッセージ
      timezone: "Asia/Tokyo",
      execute: sendNoUpdateIfNeeded,
    },
  ],
};

export default plugin;
