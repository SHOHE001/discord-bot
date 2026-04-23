import type { PluginDefinition } from "../../core/types.js";
import { checkTechBlog } from "./cron.js";

const plugin: PluginDefinition = {
  name: "tech-blog",
  channelName: "tech-blog",
  cronJobs: [
    {
      schedule: "0 9,21 * * *", // 毎日 9:00 と 21:00 JST
      timezone: "Asia/Tokyo",
      execute: checkTechBlog,
    },
  ],
};

export default plugin;
