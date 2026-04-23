import type { PluginDefinition } from "../../core/types.js";
import { postRedditAI } from "./cron.js";
import { redditAiCommand } from "./commands.js";

const plugin: PluginDefinition = {
  name: "reddit-ai",
  channelName: "reddit-ai",
  commands: [redditAiCommand],
  cronJobs: [
    {
      schedule: "0 9 * * *", // 毎朝 9:00 JST
      timezone: "Asia/Tokyo",
      execute: postRedditAI,
    },
  ],
};

export default plugin;
