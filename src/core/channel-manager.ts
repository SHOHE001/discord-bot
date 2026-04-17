import { ChannelType, TextChannel } from "discord.js";
import type { Client } from "discord.js";
import type { PluginDefinition } from "./types.js";

// pluginName → channelId のマップ
const pluginChannels = new Map<string, string>();

/**
 * プラグイン名からチャンネルIDを取得する
 * onReady 後に使用すること
 */
export function getPluginChannelId(pluginName: string): string | undefined {
  return pluginChannels.get(pluginName);
}

/**
 * Bot 起動時にプラグインの channelName を見てチャンネルを自動作成する
 */
export async function setupPluginChannels(
  client: Client,
  plugins: PluginDefinition[]
): Promise<void> {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) {
    console.warn(
      "[channel-manager] DISCORD_GUILD_ID が未設定のため、チャンネル自動作成をスキップします"
    );
    return;
  }

  let guild;
  try {
    guild = await client.guilds.fetch(guildId);
  } catch (err) {
    console.error("[channel-manager] ギルドの取得に失敗:", err);
    return;
  }

  for (const plugin of plugins) {
    if (!plugin.channelName) continue;

    // キャッシュを取得（fetch してから検索）
    await guild.channels.fetch();
    const existing = guild.channels.cache.find(
      (ch) => ch.name === plugin.channelName && ch.type === ChannelType.GuildText
    ) as TextChannel | undefined;

    if (existing) {
      pluginChannels.set(plugin.name, existing.id);
      console.log(
        `[channel-manager] ✓ ${plugin.name}: 既存チャンネル #${plugin.channelName} を使用 (${existing.id})`
      );
    } else {
      try {
        const channel = await guild.channels.create({
          name: plugin.channelName,
          type: ChannelType.GuildText,
          topic: `${plugin.name} プラグインの自動投稿チャンネル`,
        });
        pluginChannels.set(plugin.name, channel.id);
        console.log(
          `[channel-manager] ✓ ${plugin.name}: チャンネル #${plugin.channelName} を作成しました (${channel.id})`
        );
      } catch (err) {
        console.error(`[channel-manager] ${plugin.name}: チャンネル作成に失敗:`, err);
      }
    }
  }
}
