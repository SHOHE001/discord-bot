import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { Client, TextChannel } from "discord.js";
import { getPluginChannelId } from "../../core/channel-manager.js";
import { fetchUpdateText, SITE_URL } from "./api.js";

const STATE_FILE_PATH = resolve(process.cwd(), "data", "manga-update.txt");

export async function checkMangaUpdate(client: Client): Promise<void> {
  const channelId = getPluginChannelId("manga-update");
  if (!channelId) {
    console.warn("[manga-update] チャンネルIDが取得できませんでした");
    return;
  }

  const updateText = await fetchUpdateText();
  if (!updateText) {
    console.warn("[manga-update] 更新テキストの取得に失敗しました");
    return;
  }

  let previousUpdateText = "";
  try {
    previousUpdateText = await fs.readFile(STATE_FILE_PATH, "utf-8");
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      console.error("[manga-update] 状態ファイルの読み込みに失敗:", err);
      return;
    }
  }

  // 初回起動時（状態ファイルがない場合）は通知せず、現在の状態を保存するだけ
  if (!previousUpdateText) {
    console.log("[manga-update] 初回実行。現在の状態を保存します。");
    try {
      await fs.mkdir(resolve(process.cwd(), "data"), { recursive: true });
      await fs.writeFile(STATE_FILE_PATH, updateText, "utf-8");
    } catch (err) {
      console.error("[manga-update] 状態ファイルの保存に失敗:", err);
    }
    return;
  }

  if (updateText !== previousUpdateText) {
    console.log(`[manga-update] 更新を検知: ${previousUpdateText} -> ${updateText}`);

    try {
      const channel = await client.channels.fetch(channelId);
      if (channel instanceof TextChannel) {
        await channel.send(
          `ワンパンマン（原作）が更新されました！\n${updateText}\n${SITE_URL}`
        );
      }

      // 通知が成功したら状態を更新
      await fs.mkdir(resolve(process.cwd(), "data"), { recursive: true });
      await fs.writeFile(STATE_FILE_PATH, updateText, "utf-8");
    } catch (err) {
      console.error("[manga-update] 通知の送信または状態ファイルの保存に失敗:", err);
    }
  } else {
    console.log("[manga-update] 更新はありませんでした");
  }
}
