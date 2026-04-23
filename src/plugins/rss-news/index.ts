import type { PluginDefinition } from "../../core/types.js";
import { checkRssFeeds } from "./cron.js";
import { newsCommand } from "./commands.js";

const plugin: PluginDefinition = {
  name: "rss-news",
  channelName: "rss-news",
  commands: [newsCommand],
  cronJobs: [
    {
      schedule: "0 8,20 * * *", // 毎日 8:00 と 20:00 JST
      timezone: "Asia/Tokyo",
      execute: checkRssFeeds,
    },
  ],
};

export default plugin;
