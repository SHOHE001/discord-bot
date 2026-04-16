import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Client } from "discord.js";
import cron from "node-cron";
import type { PluginDefinition, PluginCommand } from "./types.js";

export async function loadPlugins(client: Client): Promise<Map<string, PluginCommand>> {
  const commands = new Map<string, PluginCommand>();
  const pluginsDir = resolve(process.cwd(), "src/plugins");

  let entries: string[];
  try {
    entries = readdirSync(pluginsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    console.warn("[plugin-loader] src/plugins/ ディレクトリが見つかりません");
    return commands;
  }

  for (const entry of entries) {
    const indexPath = resolve(pluginsDir, entry, "index.ts");
    const url = pathToFileURL(indexPath).href;

    try {
      const mod = await import(url);
      const plugin: PluginDefinition = mod.default;

      if (!plugin || typeof plugin.name !== "string") {
        console.warn(`[plugin-loader] ${entry}: 無効なプラグイン定義`);
        continue;
      }

      // コマンド登録
      for (const cmd of plugin.commands ?? []) {
        commands.set(cmd.data.name, cmd);
      }

      // cronジョブ登録
      for (const job of plugin.cronJobs ?? []) {
        cron.schedule(
          job.schedule,
          () => void job.execute(client),
          { timezone: job.timezone ?? "Asia/Tokyo" }
        );
      }

      // onReadyフック
      if (plugin.onReady) {
        client.once("clientReady", () => void plugin.onReady!(client));
      }

      console.log(`[plugin-loader] ✓ ${plugin.name} 読み込み完了`);
    } catch (err) {
      console.error(`[plugin-loader] ${entry} の読み込みに失敗:`, err);
    }
  }

  return commands;
}
