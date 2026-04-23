import type { PluginDefinition } from "../../core/types.js";
import { postGithubTrending } from "./cron.js";
import { githubTrendCommand } from "./commands.js";

const plugin: PluginDefinition = {
  name: "github-trend",
  channelName: "github-trend",
  commands: [githubTrendCommand],
  cronJobs: [
    {
      schedule: "0 9 * * *", // 毎朝 9:00 JST
      timezone: "Asia/Tokyo",
      execute: postGithubTrending,
    },
  ],
};

export default plugin;
