import type {
  Client,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

export interface PluginCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface PluginCronJob {
  schedule: string;
  timezone?: string;
  execute: (client: Client) => Promise<void>;
}

export interface PluginDefinition {
  name: string;
  commands?: PluginCommand[];
  cronJobs?: PluginCronJob[];
  onReady?: (client: Client) => Promise<void>;
}
