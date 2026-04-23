import type { PluginDefinition } from "../../core/types.js";
import { trendCommand } from "./commands.js";

const plugin: PluginDefinition = {
  name: "trend",
  channelName: "trend",
  commands: [trendCommand],
};

export default plugin;
