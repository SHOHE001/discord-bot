import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { loadPlugins } from "./core/plugin-loader.js";

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.DISCORD_GUILD_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = await loadPlugins(client);

// スラッシュコマンド登録
const rest = new REST().setToken(token);
const commandsJSON = [...commands.values()].map((c) => c.data.toJSON());

if (guildId) {
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandsJSON });
  console.log(`[bot] ${commandsJSON.length}個のコマンドをギルドに登録しました`);
} else {
  await rest.put(Routes.applicationCommands(clientId), { body: commandsJSON });
  console.log(`[bot] ${commandsJSON.length}個のコマンドをグローバルに登録しました`);
}

// インタラクションハンドラ
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: "不明なコマンドです", ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[bot] コマンドエラー (${interaction.commandName}):`, err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "エラーが発生しました", ephemeral: true });
    } else {
      await interaction.reply({ content: "エラーが発生しました", ephemeral: true });
    }
  }
});

client.once("clientReady", (c) => {
  console.log(`[bot] ${c.user.tag} でログインしました`);
});

await client.login(token);
