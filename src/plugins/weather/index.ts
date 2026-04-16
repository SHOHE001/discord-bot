import type { PluginDefinition } from "../../core/types.js";
import { weatherCommand } from "./commands.js";
import { postDailyWeather } from "./cron.js";

const plugin: PluginDefinition = {
  name: "weather",
  commands: [weatherCommand],
  cronJobs: [
    {
      schedule: "0 7 * * *",
      timezone: "Asia/Tokyo",
      execute: postDailyWeather,
    },
  ],
};

export default plugin;
